// SpellCheckPlugin.js
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $getNodeByKey,
  TextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

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
    
    // Store the original text and suggestions on the element
    element._originalText = this.__text;
    element._suggestions = this.__suggestions;
    
    // Add click handler to show modal
    element.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showSuggestionModal(element, this.__suggestions, this.__text);
    });
    
    return element;
  }

  updateDOM(prevNode, dom, config) {
    // Fixed: Pass config parameter and handle undefined theme
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__suggestions !== prevNode.__suggestions) {
      // Update stored data on the element
      dom._originalText = this.__text;
      dom._suggestions = this.__suggestions;
      
      // Update click handler with new suggestions
      const existingHandler = dom._spellCheckHandler;
      if (existingHandler) {
        dom.removeEventListener('click', existingHandler);
      }
      
      const newHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showSuggestionModal(dom, this.__suggestions, this.__text);
      };
      
      dom.addEventListener('click', newHandler);
      dom._spellCheckHandler = newHandler;
    }
    return updated;
  }

  showSuggestionModal(element, suggestions, originalText) {
    // Remove any existing modal
    const existingModal = document.querySelector('.spell-check-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'spell-check-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'spell-check-modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'spell-check-modal-header';
    header.innerHTML = `
      <h3>Spelling Suggestions for "${originalText}"</h3>
      <button class="spell-check-modal-close">&times;</button>
    `;
    
    // Suggestions list
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'spell-check-suggestions-list';
    
    if (suggestions.length > 0) {
      suggestions.forEach(suggestion => {
        const suggestionButton = document.createElement('button');
        suggestionButton.className = 'spell-check-suggestion-btn';
        suggestionButton.textContent = suggestion;
        suggestionButton.onclick = () => {
          this.applySuggestion(suggestion, originalText);
          modal.remove();
        };
        suggestionsList.appendChild(suggestionButton);
      });
    } else {
      const noSuggestions = document.createElement('div');
      noSuggestions.className = 'no-suggestions';
      noSuggestions.textContent = 'No suggestions available';
      suggestionsList.appendChild(noSuggestions);
    }
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'spell-check-modal-actions';
    
    const ignoreButton = document.createElement('button');
    ignoreButton.className = 'spell-check-ignore-btn';
    ignoreButton.textContent = 'Ignore';
    ignoreButton.onclick = () => {
      this.ignoreError(originalText);
      modal.remove();
    };
    
    actions.appendChild(ignoreButton);
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(suggestionsList);
    modalContent.appendChild(actions);
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeButton = modal.querySelector('.spell-check-modal-close');
    closeButton.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
    
    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }
  
  applySuggestion(suggestion, originalText) {
    // Use the global editor reference and find the node by its text content
    if (window.lexicalEditor) {
      window.lexicalEditor.update(() => {
        // Find all spell check nodes with matching text
        const root = window.lexicalEditor.getEditorState()._nodeMap.get('root');
        if (root) {
          const findAndReplaceNode = (node) => {
            if ($isSpellCheckNode(node) && node.getTextContent() === originalText) {
              node.replace($createTextNode(suggestion));
              return true; // Found and replaced
            }
            return false;
          };

          // Search through all paragraphs and their children
          let found = false;
          root.getChildren().forEach(paragraph => {
            if (found) return;
            paragraph.getChildren().forEach(node => {
              if (found) return;
              found = findAndReplaceNode(node);
            });
          });
        }
      });
    }
  }
  
  ignoreError(originalText) {
    // Use the global editor reference and find the node by its text content
    if (window.lexicalEditor) {
      window.lexicalEditor.update(() => {
        // Find all spell check nodes with matching text
        const root = window.lexicalEditor.getEditorState()._nodeMap.get('root');
        if (root) {
          const findAndReplaceNode = (node) => {
            if ($isSpellCheckNode(node) && node.getTextContent() === originalText) {
              node.replace($createTextNode(originalText));
              return true; // Found and replaced
            }
            return false;
          };

          // Search through all paragraphs and their children
          let found = false;
          root.getChildren().forEach(paragraph => {
            if (found) return;
            paragraph.getChildren().forEach(node => {
              if (found) return;
              found = findAndReplaceNode(node);
            });
          });
        }
      });
    }
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
      // .filter(match => match.rule.category.id === 'TYPOS')
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

export function useSpellCheckPlugin() {
  const [editor] = useLexicalComposerContext();
  const languageToolService = new LanguageToolService();

  useEffect(() => {
    if (!editor) return;

    // Store editor reference globally for SpellCheckNode access
    window.lexicalEditor = editor;

    let timeoutId = null;
    let isTyping = false;
    let typingTimeout = null;

    const performSpellCheck = async () => {
      if (!editor.isEditable()) return;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const root = editor.getEditorState()._nodeMap.get('root');
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
              // First, convert all SpellCheckNodes back to TextNodes
              const nodesToReplace = [];
              
              root.getChildren().forEach(paragraph => {
                paragraph.getChildren().forEach(node => {
                  if ($isSpellCheckNode(node)) {
                    nodesToReplace.push({
                      node,
                      replacement: $createTextNode(node.getTextContent()),
                    });
                  }
                });
              });

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
      
      // Set user as not typing after 500ms of inactivity
      typingTimeout = setTimeout(() => {
        isTyping = false;
        performSpellCheck(); // Check spelling after user stops typing
      }, 1000);
    };

    const applySpellCheckHighlights = (root, errors) => {
      const allTextNodes = [];
      
      // Collect all text nodes with their positions
      let currentOffset = 0;
      root.getChildren().forEach(paragraph => {
        paragraph.getChildren().forEach(node => {
          if ($isTextNode(node)) {
            const text = node.getTextContent();
            allTextNodes.push({
              node,
              text,
              startOffset: currentOffset,
              endOffset: currentOffset + text.length,
            });
            currentOffset += text.length;
          }
        });
      });

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
      removeListeners();
    };
  }, [editor]);

  return null;
}

// Context menu component for spell check suggestions (kept for backward compatibility)
export function SpellCheckContextMenu({ editor, spellCheckNode, onClose }) {
  const suggestions = spellCheckNode.getSuggestions();

  const handleSuggestionClick = (suggestion) => {
    editor.update(() => {
      try {
        spellCheckNode.replace($createTextNode(suggestion));
      } catch (error) {
        console.warn('Could not apply suggestion:', error);
      }
    });
    onClose();
  };

  const handleIgnore = () => {
    editor.update(() => {
      try {
        spellCheckNode.replace($createTextNode(spellCheckNode.getTextContent()));
      } catch (error) {
        console.warn('Could not ignore spelling error:', error);
      }
    });
    onClose();
  };

  return (
    <div className="spell-check-context-menu">
      <div className="spell-check-suggestions">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="spell-check-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))
        ) : (
          <div className="no-suggestions">No suggestions available</div>
        )}
      </div>
      <div className="spell-check-actions">
        <button onClick={handleIgnore}>Ignore</button>
      </div>
    </div>
  );
}

// CSS styles (add to your stylesheet)
const styles = `
.spell-check-error {
  text-decoration: underline;
  text-decoration-color: red;
  text-decoration-style: wavy;
  cursor: pointer;
}

.spell-check-error:hover {
  background-color: rgba(255, 0, 0, 0.1);
}

/* Modal Styles */
.spell-check-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.spell-check-modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.spell-check-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.spell-check-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.spell-check-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.spell-check-modal-close:hover {
  background-color: #f5f5f5;
}

.spell-check-suggestions-list {
  padding: 16px 20px;
}

.spell-check-suggestion-btn {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.spell-check-suggestion-btn:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
  transform: translateY(-1px);
}

.spell-check-suggestion-btn:active {
  transform: translateY(0);
}

.spell-check-modal-actions {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.spell-check-ignore-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.spell-check-ignore-btn:hover {
  background-color: #f8f9fa;
  border-color: #dc3545;
  color: #dc3545;
}

.no-suggestions {
  padding: 16px;
  color: #666;
  font-size: 14px;
  text-align: center;
  font-style: italic;
}

/* Legacy context menu styles (kept for backward compatibility) */
.spell-check-context-menu {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
}

.spell-check-suggestions {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.spell-check-suggestion {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.spell-check-suggestion:hover {
  background-color: #f5f5f5;
}

.spell-check-actions {
  padding: 8px 0;
}

.spell-check-actions button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.spell-check-actions button:hover {
  background-color: #f5f5f5;
}
`;

export { styles as spellCheckStyles };