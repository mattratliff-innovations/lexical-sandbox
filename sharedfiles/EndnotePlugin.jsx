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
    element.style.cursor = 'pointer';
    element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
    element.style.borderRadius = '2px';

    // Add anchor ID using the stored endnote reference
    element.id = this.__endnoteRef;

    // Add footnote number indicator
    const footnoteIndicator = document.createElement('sup');
    footnoteIndicator.textContent = `[${this.__footnoteId}]`;
    footnoteIndicator.style.fontSize = '0.65em';
    footnoteIndicator.style.marginLeft = '2px';
    footnoteIndicator.style.color = '#1976d2';
    footnoteIndicator.style.pointerEvents = 'none'; // Prevent interference with click detection
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
  console.log('EndnotePlugin - Checking selection nodes:', nodes.length);
  
  // First check if any selected nodes are already endnote nodes
  for (const node of nodes) {
    if ($isEndnoteNode(node)) {
      console.log('EndnotePlugin - Found existing endnote node:', {
        id: node.getEndnoteId(),
        text: node.getTextContent(),
        value: node.getEndnoteValue()
      });
      return node;
    }
    
    // Check parent nodes for endnote
    let parent = node.getParent();
    while (parent) {
      if ($isEndnoteNode(parent)) {
        console.log('EndnotePlugin - Found endnote in parent');
        return parent;
      }
      parent = parent.getParent();
    }
  }

  // Check anchor node
  const anchorNode = selection.anchor.getNode();
  if ($isEndnoteNode(anchorNode)) {
    return anchorNode;
  }

  // Only check for text patterns if we're specifically looking for endnotes
  // and not during regular text selection
  const selectedText = selection.getTextContent();
  if (selectedText.trim() === '' && anchorNode.getType?.() === 'extended-text') {
    const text = anchorNode.getTextContent();
    const endnotePattern = /([^[]*)\[(\d+)\]/;
    const match = text.match(endnotePattern);
    
    if (match) {
      const [_, beforeText, endnoteId] = match;
      
      // Only convert if we have the endnote data and the cursor is near the bracket
      if (window.endnoteManager) {
        const allEndnotes = window.endnoteManager.getAllEndnotes();
        const endnoteData = allEndnotes.find(e => String(e.index) === endnoteId);
        
        if (endnoteData) {
          // Check if cursor position is near the endnote reference
          const { offset } = selection.anchor;
          const bracketIndex = text.indexOf(`[${endnoteId}]`);
          
          // Only convert if cursor is within reasonable distance of the bracket
          if (Math.abs(offset - bracketIndex) <= beforeText.length + 3) {
            console.log('EndnotePlugin - Converting text to endnote node (cursor near bracket)');
            
            // Don't update immediately, defer to avoid interfering with focus
            setTimeout(() => {
              if (window.lexicalEditor) {
                window.lexicalEditor.update(() => {
                  const endnoteNode = $createEndnoteNode(beforeText, parseInt(endnoteId), endnoteData.value);
                  anchorNode.replace(endnoteNode);
                });
              }
            }, 100);
            
            // Return a temporary endnote representation
            return {
              getEndnoteId: () => parseInt(endnoteId),
              getTextContent: () => beforeText,
              getEndnoteValue: () => endnoteData.value || ''
            };
          }
        }
      }
    }
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

// Hook to register the footnote plugin
export function useEndnotePlugin(handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    let timeoutId;

    const checkForSelectedText = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        editor.update(() => {
          const root = $getRoot();
          const textContent = root.getTextContent();
          console.log('textContent = ', textContent.trim());
        });
      }, 500);
    };

    const checkSelection = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();
          const canCreateEndnote = $isOnWord(selection);
          const currentEndnoteNode = $getSelectedEndnoteNode(selection);

          handleSetSelectedText(selectedText);
          handleSetCanCreateEndnote(canCreateEndnote);
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
      if (timeoutId) clearTimeout(timeoutId);
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
          const footnoteNode = $createEndnoteNode(selectedText, footnoteId, endnoteValue);
          selection.insertNodes([footnoteNode]);
        }
      });
    };

    const updateEndnote = (footnoteId, newValue) => {
      editor.update(() => {
        const root = $getRoot();

        // Recursively search for endnote nodes
        const findAndUpdateEndnote = (node) => {
          if ($isEndnoteNode(node) && node.getEndnoteId() === footnoteId) {
            node.setEndnoteValue(newValue);
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

  // Add click handler for endnote detection
  useEffect(() => {
    if (!editor) return;

    const handleEditorClick = (event) => {
      // Check if clicked element or its parent contains endnote pattern
      let target = event.target;
      
      // Look up the DOM tree for text content
      while (target && target !== editor.getRootElement()) {
        const textContent = target.textContent || '';
        const endnotePattern = /([^[]*)\[(\d+)\]/;
        const match = textContent.match(endnotePattern);
        
        if (match) {
          console.log('EndnotePlugin - Click detected on potential endnote text');
          
          // Don't prevent propagation as it might interfere with focus management
          
          // Trigger endnote detection with a delay
          setTimeout(() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const currentEndnoteNode = $getSelectedEndnoteNode(selection);
                handleSetCurrentEndnote(currentEndnoteNode);
              }
            });
          }, 50);
          
          break;
        }
        
        target = target.parentElement;
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('click', handleEditorClick);
      
      return () => {
        rootElement.removeEventListener('click', handleEditorClick);
      };
    }
  }, [editor, handleSetCurrentEndnote]);

  return null;
}