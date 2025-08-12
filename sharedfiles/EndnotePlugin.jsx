// EndnotePlugin.jsx
import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode, TextNode, COMMAND_PRIORITY_LOW, $getRoot } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import './EndnotePlugin.css';

// Global endnote management
window.endnoteManager = window.endnoteManager || {
  counter: 1,
  endnotes: new Map(),
  initialized: false,

  initializeFromLetter: function (letterData) {
    this.reset();
    if (letterData && letterData.endNotes && Array.isArray(letterData.endNotes)) {
      let maxId = 0;
      letterData.endNotes.forEach((endnote) => {
        const id = parseInt(endnote.index);
        this.endnotes.set(id, {
          text: endnote.text || '',
          value: endnote.value || '',
          ref: endnote.ref || `endnote-ref-${id}`,
        });
        maxId = Math.max(maxId, id);
      });
      this.counter = maxId + 1;
    }
    this.initialized = true;
    console.log('Endnote manager initialized from letter data:', this.getAllEndnotes());
  },

  reset: function () {
    this.counter = 1;
    this.endnotes.clear();
    this.initialized = false;
    console.log('Endnote manager reset');
  },

  getNextId: function () {
    return this.counter++;
  },

  addEndnote: function (id, text, value, ref) {
    this.endnotes.set(id, {
      text,
      value,
      ref: ref || `endnote-ref-${id}`,
    });
    // Update counter to ensure it's always higher than existing IDs
    if (id >= this.counter) {
      this.counter = id + 1;
    }
  },

  updateEndnote: function (id, value) {
    const endnote = this.endnotes.get(id);
    if (endnote) {
      endnote.value = value;
    }
  },

  getAllEndnotes: function () {
    const result = [];
    for (const [id, data] of this.endnotes) {
      result.push({
        index: id,
        text: data.text,
        value: data.value,
        ref: data.ref,
      });
    }
    return result.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  },

  removeEndnote: function (id) {
    this.endnotes.delete(id);
  },
};

// Custom command for footnote
export const INSERT_FOOTNOTE_COMMAND = 'INSERT_FOOTNOTE_COMMAND';

// Custom node for footnotes
export class EndnoteNode extends TextNode {
  static getType() {
    return 'footnote';
  }

  static clone(node) {
    return new EndnoteNode(node.__text, node.__footnoteId, node.__endnoteValue, node.__key);
  }

  constructor(text, footnoteId, endnoteValue = '', key) {
    super(text, key);
    this.__footnoteId = footnoteId;
    this.__endnoteValue = endnoteValue;
    this.__endnoteRef = `endnote-ref-${footnoteId}`;

    // Register with global endnote manager
    if (footnoteId && window.endnoteManager) {
      window.endnoteManager.addEndnote(footnoteId, text, endnoteValue, this.__endnoteRef);
    }
  }

  getEndnoteId() {
    return this.__footnoteId;
  }

  setEndnoteId(footnoteId) {
    const writable = this.getWritable();
    writable.__footnoteId = footnoteId;
  }

  getEndnoteRef() {
    return this.__endnoteRef;
  }

  setEndnoteRef(endnoteRef) {
    const writable = this.getWritable();
    writable.__endnoteRef = endnoteRef;
  }

  getEndnoteValue() {
    return this.__endnoteValue;
  }

  setEndnoteValue(endnoteValue) {
    const writable = this.getWritable();
    writable.__endnoteValue = endnoteValue;

    // Update global endnote manager
    if (window.endnoteManager) {
      window.endnoteManager.updateEndnote(this.__footnoteId, endnoteValue);
    }
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.style.padding = '1px 2px';

    // Add anchor ID using the stored endnote reference
    element.id = this.__endnoteRef;

    // Add footnote number indicator
    const footnoteIndicator = document.createElement('sup');
    footnoteIndicator.textContent = `[${this.__footnoteId}]`;
    footnoteIndicator.style.fontSize = '0.65em';
    footnoteIndicator.style.marginLeft = '2px';
    footnoteIndicator.style.color = '#1976d2';
    element.appendChild(footnoteIndicator);

    return element;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__footnoteId !== prevNode.__footnoteId) {
      // Update footnote indicator
      const indicator = dom.querySelector('sup');
      if (indicator) {
        indicator.textContent = `[${this.__footnoteId}]`;
      }
    }
    return updated;
  }

  static importJSON(serializedNode) {
    const { text, footnoteId, endnoteValue, endnoteRef } = serializedNode;
    const node = $createEndnoteNode(text, footnoteId, endnoteValue);
    if (endnoteRef) {
      node.__endnoteRef = endnoteRef;
    }
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      footnoteId: this.__footnoteId,
      endnoteValue: this.__endnoteValue,
      endnoteRef: this.__endnoteRef,
      type: 'footnote',
      version: 1,
    };
  }
}

export function $createEndnoteNode(text, footnoteId, endnoteValue = '') {
  return new EndnoteNode(text, footnoteId, endnoteValue);
}

export function $isEndnoteNode(node) {
  return node instanceof EndnoteNode;
}

// Helper function to get the currently selected endnote node
function $getSelectedEndnoteNode(selection) {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const nodes = selection.getNodes();
  for (const node of nodes) {
    if ($isEndnoteNode(node)) {
      return node;
    }
    // Check if cursor is within an endnote node
    const parent = node.getParent();
    if (parent && $isEndnoteNode(parent)) {
      return parent;
    }
  }

  // Check if cursor is positioned within an endnote
  const anchorNode = selection.anchor.getNode();
  if ($isEndnoteNode(anchorNode)) {
    return anchorNode;
  }

  return null;
}

// Helper function to check if cursor is on a word
function $isOnWord(selection) {
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const selectedText = selection.getTextContent();

  // If there's selected text, return true
  if (selectedText.trim() !== '') {
    return true;
  }

  // If no text is selected, check if cursor is on a word
  const nodes = selection.getNodes();
  if (nodes.length > 0 && $isTextNode(nodes[0])) {
    const textNode = nodes[0];
    const text = textNode.getTextContent();
    const { offset } = selection.anchor;

    // Check if cursor is within a word
    if (offset > 0 && offset < text.length) {
      return /\w/.test(text[offset - 1]) || /\w/.test(text[offset]);
    } else if (offset === 0) {
      return /\w/.test(text[offset]);
    } else if (offset === text.length) {
      return /\w/.test(text[offset - 1]);
    }
  }

  return false;
}

// Function to check if cursor is on an endnote (for existing endnotes)
function checkForEndnoteAtCursor(selection) {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  // First check for actual EndnoteNode instances
  const currentEndnoteNode = $getSelectedEndnoteNode(selection);
  if (currentEndnoteNode) {
    return currentEndnoteNode;
  }

  // Then check for text-based endnote patterns
  const selectedText = selection.getTextContent();
  
  // If no selection, check if cursor is within an endnote pattern
  if (selectedText.trim() === '') {
    const anchorNode = selection.anchor.getNode();
    if ($isTextNode(anchorNode)) {
      const text = anchorNode.getTextContent();
      const offset = selection.anchor.offset;
      
      console.log(`Checking cursor at offset ${offset} in text: "${text}"`);
      
      // Look for endnote pattern around cursor position
      // Use more flexible regex
      const endnoteRegex = /(.+?)\[(\d+)\]/g;
      let match;
      
      while ((match = endnoteRegex.exec(text)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        console.log(`Found endnote pattern at ${matchStart}-${matchEnd}: "${match[0]}"`);
        
        if (offset >= matchStart && offset <= matchEnd) {
          const [fullMatch, endnoteText, footnoteId] = match;
          console.log(`Cursor is within endnote: "${endnoteText.trim()}" [${footnoteId}]`);
          
          return {
            getEndnoteId: () => parseInt(footnoteId),
            getTextContent: () => endnoteText.trim(),
            getEndnoteValue: () => {
              if (window.endnoteManager) {
                const endnote = window.endnoteManager.endnotes.get(parseInt(footnoteId));
                return endnote ? endnote.value : '';
              }
              return '';
            }
          };
        }
      }
    }
  }
  
  return null;
}

// Hook to register the footnote plugin
export function useEndnotePlugin(handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    // Function to parse existing endnotes from the editor content
    const parseExistingEndnotes = () => {
      editor.update(() => {
        const root = $getRoot();
        let hasChanges = false;

        // Recursively process all text nodes to find and convert endnote patterns
        const processNode = (node) => {
          if ($isTextNode(node)) {
            const text = node.getTextContent();
            
            // Look for endnote patterns in this text node
            const endnoteRegex = /(.+?)\[(\d+)\]/g;
            const matches = [];
            let match;
            
            while ((match = endnoteRegex.exec(text)) !== null) {
              matches.push({
                fullMatch: match[0],
                text: match[1].trim(),
                footnoteId: parseInt(match[2]),
                startIndex: match.index,
                endIndex: match.index + match[0].length
              });
            }
            
            if (matches.length > 0) {
              console.log(`Found ${matches.length} endnote patterns in text node:`, text);
              
              // Process matches from end to start to maintain correct indices
              matches.reverse().forEach(matchInfo => {
                const { text: endnoteText, footnoteId, startIndex, endIndex } = matchInfo;
                
                console.log(`Converting endnote pattern: "${endnoteText}[${footnoteId}]"`);
                
                // Register with global endnote manager
                if (window.endnoteManager && !window.endnoteManager.endnotes.has(footnoteId)) {
                  const existingEndnote = window.endnoteManager.getAllEndnotes().find(e => e.index === footnoteId);
                  const endnoteValue = existingEndnote ? existingEndnote.value : '';
                  
                  window.endnoteManager.addEndnote(footnoteId, endnoteText, endnoteValue, `endnote-ref-${footnoteId}`);
                  console.log(`Registered endnote ${footnoteId}: "${endnoteText}"`);
                }
                
                // Split the text node and insert EndnoteNode
                const fullText = node.getTextContent();
                const beforeText = fullText.substring(0, startIndex);
                const afterText = fullText.substring(endIndex);
                
                const newNodes = [];
                
                // Add text before the endnote (if any)
                if (beforeText) {
                  newNodes.push($createTextNode(beforeText));
                }
                
                // Add the EndnoteNode
                try {
                  const endnoteValue = window.endnoteManager?.endnotes.get(footnoteId)?.value || '';
                  const endnoteNode = $createEndnoteNode(endnoteText, footnoteId, endnoteValue);
                  newNodes.push(endnoteNode);
                  console.log(`Created EndnoteNode for "${endnoteText}[${footnoteId}]"`);
                } catch (error) {
                  console.error('Error creating EndnoteNode:', error);
                  // Fallback: keep original text
                  newNodes.push($createTextNode(matchInfo.fullMatch));
                }
                
                // Add text after the endnote (if any)
                if (afterText) {
                  newNodes.push($createTextNode(afterText));
                }
                
                // Replace the original text node with the new nodes
                if (newNodes.length > 0) {
                  node.replace(newNodes[0]);
                  for (let i = 1; i < newNodes.length; i++) {
                    newNodes[i - 1].insertAfter(newNodes[i]);
                  }
                  hasChanges = true;
                }
              });
            }
          }
          
          // Recursively process child nodes
          const children = node.getChildren ? node.getChildren() : [];
          children.forEach(child => processNode(child));
        };
        
        // Also check for HTML patterns with superscript tags
        const processHtmlEndnotes = () => {
          // This is a more complex approach - we'd need to find sup tags and convert them
          // For now, let's focus on the text pattern approach
          console.log('Processing HTML endnote patterns...');
        };
        
        console.log('Starting endnote parsing and conversion...');
        processNode(root);
        
        // Update counter after processing
        if (window.endnoteManager) {
          const allEndnotes = window.endnoteManager.getAllEndnotes();
          if (allEndnotes.length > 0) {
            const maxId = Math.max(...allEndnotes.map(e => parseInt(e.index)));
            if (maxId >= window.endnoteManager.counter) {
              window.endnoteManager.counter = maxId + 1;
              console.log(`Updated endnote counter to ${window.endnoteManager.counter}`);
            }
          }
        }
        
        if (hasChanges) {
          console.log('Endnote conversion completed with changes');
        } else {
          console.log('No endnote patterns found for conversion');
        }
      });
    };

    // Parse existing endnotes when the plugin initializes
    const timeoutId = setTimeout(() => {
      parseExistingEndnotes();
    }, 100); // Small delay to ensure content is loaded

    const checkForSelectedText = () => {
      editor.update(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        console.log('textContent = ', textContent.trim());
      });
    };

    const checkSelection = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();
          const canCreateEndnote = $isOnWord(selection);
          const currentEndnoteNode = checkForEndnoteAtCursor(selection);

          handleSetSelectedText(selectedText);
          // Allow creating endnote if user can create one OR we're on an existing endnote
          handleSetCanCreateEndnote(canCreateEndnote || !!currentEndnoteNode);
          handleSetCurrentEndnote(currentEndnoteNode);
        } else {
          handleSetSelectedText('');
          handleSetCanCreateEndnote(false);
          handleSetCurrentEndnote(null);
        }
      });
    };

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        checkForSelectedText();
        checkSelection();
      });
    });

    return () => {
      clearTimeout(timeoutId);
      removeUpdateListener();
    };
  }, [editor, handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote]);

  useEffect(() => {
    if (!editor) return;

    // Store editor reference globally
    window.lexicalEditor = editor;

    const insertEndnote = (endnoteValue = '') => {
      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        const selectedText = selection.getTextContent();

        // Get next global endnote ID
        const footnoteId = window.endnoteManager ? window.endnoteManager.getNextId() : 1;

        if (selectedText.trim() === '') {
          // If no text is selected, try to select the word at cursor
          const nodes = selection.getNodes();
          if (nodes.length > 0 && $isTextNode(nodes[0])) {
            const textNode = nodes[0];
            const text = textNode.getTextContent();
            const { offset } = selection.anchor;

            // Find word boundaries
            let start = offset;
            let end = offset;

            // Find start of word
            while (start > 0 && /\w/.test(text[start - 1])) {
              start--;
            }

            // Find end of word
            while (end < text.length && /\w/.test(text[end])) {
              end++;
            }

            if (start < end) {
              const wordText = text.substring(start, end);

              // Split the text node and replace the word with footnote node
              const beforeText = text.substring(0, start);
              const afterText = text.substring(end);

              const nodes = [];

              if (beforeText) {
                nodes.push($createTextNode(beforeText));
              }

              nodes.push($createEndnoteNode(wordText, footnoteId, endnoteValue));

              if (afterText) {
                nodes.push($createTextNode(afterText));
              }

              if (nodes.length > 0) {
                textNode.replace(nodes[0]);
                for (let i = 1; i < nodes.length; i++) {
                  nodes[i - 1].insertAfter(nodes[i]);
                }
              }
            }
          }
        } else {
          // Replace selected text with footnote node
          const endnoteNodes = $createEndnoteNode(selectedText, footnoteId, endnoteValue);
          selection.insertNodes([endnoteNodes]);
        }
      });
    };

    const updateEndnote = (footnoteId, newValue) => {
      // First try to update actual EndnoteNode instances
      let nodeFound = false;
      
      editor.update(() => {
        const root = $getRoot();

        // Recursively search for endnote nodes
        const findAndUpdateEndnote = (node) => {
          if ($isEndnoteNode(node) && node.getEndnoteId() === footnoteId) {
            node.setEndnoteValue(newValue);
            nodeFound = true;
            return true;
          }

          const children = node.getChildren ? node.getChildren() : [];
          for (const child of children) {
            if (findAndUpdateEndnote(child)) {
              return true;
            }
          }
          return false;
        };

        findAndUpdateEndnote(root);
      });

      // If no EndnoteNode was found, update the global endnote manager
      // (this handles text-based endnotes)
      if (!nodeFound && window.endnoteManager) {
        window.endnoteManager.updateEndnote(footnoteId, newValue);
        console.log(`Updated text-based endnote ${footnoteId} with new value: "${newValue}"`);
      }
    };

    // Store the update function globally for access from modal
    window.updateEndnote = updateEndnote;

    const removeListeners = mergeRegister(
      editor.registerCommand(
        INSERT_FOOTNOTE_COMMAND,
        (endnoteValue) => {
          insertEndnote(endnoteValue);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    return removeListeners;
  }, [editor]);

  return null;
}