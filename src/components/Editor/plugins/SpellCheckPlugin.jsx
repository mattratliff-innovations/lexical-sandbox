// SpellCheckPlugin.js
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $getNodeByKey,
  $getRoot,
  TextNode,
  ElementNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback } from 'react';
import { SpellCheckPluginModal } from './SpellCheckPluginModal';

// Custom node for spelling errors
export class SpellCheckNode extends TextNode {
  static getType() {
    return 'spell-check';
  }

  static clone(node) {
    return new SpellCheckNode(node.__text, node.__suggestions, node.__key);
  }

  constructor(text, suggestions = [], key) {
    super(text, key);
    this.__suggestions = suggestions;
  }

  getSuggestions() {
    return this.__suggestions;
  }

  setSuggestions(suggestions) {
    const writable = this.getWritable();
    writable.__suggestions = suggestions;
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.className = 'spell-check-error';
    element.style.textDecoration = 'underline';
    element.style.textDecorationColor = 'red';
    element.style.textDecorationStyle = 'wavy';
    element.style.cursor = 'pointer';
    
    // Store the node key on the element for modal access
    element.setAttribute('data-lexical-spell-check', this.getKey());
    
    return element;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__suggestions !== prevNode.__suggestions) {
      // Update stored node key
      dom.setAttribute('data-lexical-spell-check', this.getKey());
    }
    return updated;
  }

  static importJSON(serializedNode) {
    const { text, suggestions } = serializedNode;
    return $createSpellCheckNode(text, suggestions);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      suggestions: this.__suggestions,
      type: 'spell-check',
      version: 1,
    };
  }

  setTextContent(text) {
    const writable = this.getWritable();
    writable.__text = text;
  }
}

export function $createSpellCheckNode(text, suggestions = []) {
  return new SpellCheckNode(text, suggestions);
}

export function $isSpellCheckNode(node) {
  return node instanceof SpellCheckNode;
}

// Helper to check if node is an ElementNode
export function $isElementNode(node) {
  return node && typeof node.getChildren === 'function';
}

// LanguageTool API service
class LanguageToolService {
  constructor(apiUrl = 'http://localhost:8010/v2/check') {
    this.apiUrl = apiUrl;
    this.cache = new Map();
  }

  async checkText(text) {
    const cacheKey = text.trim().toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: 'en-US',
          enabledOnly: 'false',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = this.processLanguageToolResponse(data);
      
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('LanguageTool API error:', error);
      return [];
    }
  }

  processLanguageToolResponse(data) {
    return data.matches
      .map(match => ({
        offset: match.offset,
        length: match.length,
        word: match.context.text.substring(match.offset, match.offset + match.length),
        suggestions: match.replacements.map(r => r.value).slice(0, 5),
        message: match.message,
      }));
  }

  clearCache() {
    this.cache.clear();
  }
}

export function SpellCheckPlugin() {
  const [editor] = useLexicalComposerContext();
  const [modalState, setModalState] = useState({
    isVisible: false,
    nodeKey: null,
    originalText: '',
    suggestions: [],
    position: { x: 0, y: 0 },
    elementRef: null // Add reference to the DOM element
  });

  const languageToolService = new LanguageToolService();

  // Handle clicks on spell check errors
  const handleSpellCheckClick = useCallback((event) => {
    const target = event.target;
    if (target && target.classList.contains('spell-check-error')) {
      event.preventDefault();
      event.stopPropagation();
      
      const nodeKey = target.getAttribute('data-lexical-spell-check');
      if (nodeKey) {
        // Get node data within editor context
        editor.read(() => {
          try {
            const node = $getNodeByKey(nodeKey);
            if (node && $isSpellCheckNode(node)) {
              const rect = target.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
              setModalState({
                isVisible: true,
                nodeKey: nodeKey,
                originalText: node.getTextContent(),
                suggestions: node.getSuggestions(),
                elementRef: target, // Store reference to the DOM element
                position: {
                  x: rect.left + scrollLeft + (rect.width / 2),
                  y: rect.bottom + scrollTop + 5
                }
              });
            } else {
              console.warn('SpellCheck: Node not found or not a spell check node:', nodeKey);
            }
          } catch (error) {
            console.warn('Error reading spell check node:', error);
          }
        });
      } else {
        console.warn('SpellCheck: No node key found on clicked element');
      }
    }
  }, [editor]);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isVisible: false,
      nodeKey: null,
      originalText: '',
      suggestions: [],
      elementRef: null
    }));
  }, []);

  // Handle suggestion application
  const applySuggestion = useCallback((suggestion) => {
    if (!modalState.nodeKey) return;
    
    editor.update(() => {
      let replaced = false;
      
      // Method 1: Try to find by node key
      try {
        const node = $getNodeByKey(modalState.nodeKey);
        
        if (node && $isSpellCheckNode(node)) {
          const textNode = $createTextNode(suggestion);
          node.replace(textNode);
          replaced = true;
          
          // Force a re-render by selecting the new node
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            textNode.select();
          }
        }
      } catch (error) {
        console.warn('Method 1 failed:', error);
      }
      
      // Method 2: Find by traversing the tree if Method 1 failed
      if (!replaced) {
        try {
          const root = $getRoot();
          let foundNode = null;
          
          const findNodeByKey = (node) => {
            if (node.getKey() === modalState.nodeKey) {
              foundNode = node;
              return true;
            }
            if ($isElementNode(node)) {
              const children = node.getChildren();
              for (const child of children) {
                if (findNodeByKey(child)) return true;
              }
            }
            return false;
          };
          
          if (findNodeByKey(root) && foundNode && $isSpellCheckNode(foundNode)) {
            const textNode = $createTextNode(suggestion);
            foundNode.replace(textNode);
            replaced = true;
            
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              textNode.select();
            }
          }
        } catch (error) {
          console.warn('Method 2 failed:', error);
        }
      }
      
      // Method 3: Find by text content matching if previous methods failed
      if (!replaced) {
        try {
          const root = $getRoot();
          
          const findAndReplaceByText = (node) => {
            if ($isSpellCheckNode(node) && node.getTextContent() === modalState.originalText) {
              const textNode = $createTextNode(suggestion);
              node.replace(textNode);
              return true;
            }
            
            if ($isElementNode(node)) {
              const children = node.getChildren();
              for (const child of children) {
                if (findAndReplaceByText(child)) return true;
              }
            }
            return false;
          };
          
          replaced = findAndReplaceByText(root);
        } catch (error) {
          console.warn('Method 3 failed:', error);
        }
      }
      
      if (!replaced) {
        console.error('SpellCheck: All replacement methods failed');
      }
    });
    closeModal();
  }, [editor, modalState.nodeKey, modalState.originalText, closeModal]);

  // Handle ignore
  const ignoreError = useCallback(() => {
    if (!modalState.nodeKey) return;
    
    editor.update(() => {
      try {
        const node = $getNodeByKey(modalState.nodeKey);
        if (node && $isSpellCheckNode(node)) {
          const textNode = $createTextNode(node.getTextContent());
          node.replace(textNode);
          
          // Force a re-render by selecting the new node
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            textNode.select();
          }
        } else {
          console.warn('Node not found or not a spell check node:', modalState.nodeKey);
        }
      } catch (error) {
        console.warn('Could not ignore spelling error:', error);
        
        // Fallback: try to find the node by traversing the tree
        try {
          const root = $getRoot();
          let foundNode = null;
          
          const findNodeByKey = (node) => {
            if (node.getKey() === modalState.nodeKey) {
              foundNode = node;
              return true;
            }
            if ($isElementNode(node)) {
              const children = node.getChildren();
              for (const child of children) {
                if (findNodeByKey(child)) return true;
              }
            }
            return false;
          };
          
          if (findNodeByKey(root) && foundNode && $isSpellCheckNode(foundNode)) {
            const textNode = $createTextNode(foundNode.getTextContent());
            foundNode.replace(textNode);
            
            // Force a re-render by selecting the new node
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              textNode.select();
            }
          }
        } catch (fallbackError) {
          console.error('Fallback ignore also failed:', fallbackError);
        }
      }
    });
    closeModal();
  }, [editor, modalState.nodeKey, closeModal]);

  useEffect(() => {
    if (!editor) return;

    let timeoutId = null;
    let isTyping = false;
    let typingTimeout = null;

    // Add global click listener for spell check errors
    document.addEventListener('click', handleSpellCheckClick);

    const performSpellCheck = async () => {
      if (!editor.isEditable()) return;

      editor.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const root = $getRoot();
        if (!root) return;

        const textContent = root.getTextContent();
        if (!textContent.trim()) return;

        // Only skip if user is actively typing (within last 500ms)
        if (isTyping) {
          return;
        }

        // Debounce spell checking
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            const errors = await languageToolService.checkText(textContent);
            
            editor.update(() => {
              const root = $getRoot();
              
              // First, convert all SpellCheckNodes back to TextNodes
              const nodesToReplace = [];
              
              const collectSpellCheckNodes = (node) => {
                if ($isSpellCheckNode(node)) {
                  nodesToReplace.push({
                    node,
                    replacement: $createTextNode(node.getTextContent()),
                  });
                }
                
                // Only traverse children if this is an ElementNode
                if ($isElementNode(node)) {
                  try {
                    const children = node.getChildren();
                    children.forEach(collectSpellCheckNodes);
                  } catch (error) {
                    console.warn('Could not get children for node:', error);
                  }
                }
              };

              collectSpellCheckNodes(root);

              // Replace spell check nodes with regular text nodes
              nodesToReplace.forEach(({ node, replacement }) => {
                try {
                  node.replace(replacement);
                } catch (error) {
                  console.warn('Could not replace spell check node:', error);
                }
              });

              // Now apply new spell check highlights
              if (errors.length > 0) {
                applySpellCheckHighlights(root, errors);
              }
            });
          } catch (error) {
            console.error('Spell check error:', error);
          }
        }, 1000);
      });
    };

    const handleTyping = () => {
      isTyping = true;
      
      // Clear existing typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set user as not typing after 1000ms of inactivity
      typingTimeout = setTimeout(() => {
        isTyping = false;
        performSpellCheck(); // Check spelling after user stops typing
      }, 1000);
    };

    const applySpellCheckHighlights = (root, errors) => {
      const allTextNodes = [];
      
      // Collect all text nodes with their positions
      let currentOffset = 0;
      
      const collectTextNodes = (node) => {
        if ($isTextNode(node) && !$isSpellCheckNode(node)) {
          const text = node.getTextContent();
          allTextNodes.push({
            node,
            text,
            startOffset: currentOffset,
            endOffset: currentOffset + text.length,
          });
          currentOffset += text.length;
        }
        
        // Only traverse children if this is an ElementNode
        if ($isElementNode(node)) {
          try {
            const children = node.getChildren();
            children.forEach(collectTextNodes);
          } catch (error) {
            console.warn('Could not get children for node:', error);
          }
        }
      };

      collectTextNodes(root);

      // Apply highlights for each error
      errors.forEach(error => {
        const errorStart = error.offset;
        const errorEnd = error.offset + error.length;

        // Find the text node that contains this error
        for (const textNodeInfo of allTextNodes) {
          if (errorStart >= textNodeInfo.startOffset && errorEnd <= textNodeInfo.endOffset) {
            const relativeStart = errorStart - textNodeInfo.startOffset;
            const relativeEnd = errorEnd - textNodeInfo.startOffset;
            
            try {
              highlightErrorInNode(textNodeInfo.node, relativeStart, relativeEnd, error.suggestions);
            } catch (error) {
              console.warn('Could not highlight error in node:', error);
            }
            break;
          }
        }
      });
    };

    const highlightErrorInNode = (node, start, end, suggestions) => {
      const text = node.getTextContent();
      const beforeText = text.substring(0, start);
      const errorText = text.substring(start, end);
      const afterText = text.substring(end);

      const nodes = [];
      
      if (beforeText) {
        nodes.push($createTextNode(beforeText));
      }
      
      nodes.push($createSpellCheckNode(errorText, suggestions));
      
      if (afterText) {
        nodes.push($createTextNode(afterText));
      }

      // Replace the original node with the new nodes
      if (nodes.length > 0) {
        try {
          node.replace(nodes[0]);
          for (let i = 1; i < nodes.length; i++) {
            nodes[i - 1].insertAfter(nodes[i]);
          }
        } catch (error) {
          console.warn('Could not replace node during highlighting:', error);
        }
      }
    };

    // Register listeners with typing detection
    const removeListeners = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        try {
          editorState.read(() => {
            handleTyping(); // Mark as typing activity
          });
        } catch (error) {
          console.warn('Error in spell check update listener:', error);
        }
      }),
      
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          try {
            // Don't mark selection changes as typing
            if (!isTyping) {
              performSpellCheck();
            }
          } catch (error) {
            console.warn('Error in spell check selection change:', error);
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      document.removeEventListener('click', handleSpellCheckClick);
      removeListeners();
    };
  }, [editor, handleSpellCheckClick]);

  // Create a mock spell check node object for the modal
  const modalSpellCheckNode = modalState.isVisible ? {
    getSuggestions: () => modalState.suggestions,
    getTextContent: () => modalState.originalText
  } : null;

  return (
    <SpellCheckPluginModal
      isVisible={modalState.isVisible}
      onClose={closeModal}
      spellCheckNode={modalSpellCheckNode}
      editor={editor}
      position={modalState.position}
      onApplySuggestion={applySuggestion}
      onIgnore={ignoreError}
    />
  );
}

// Hook version for easier integration
export function useSpellCheckPlugin() {
  return SpellCheckPlugin;
}