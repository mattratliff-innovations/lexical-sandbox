// EndnotePlugin.jsx
import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode, TextNode, COMMAND_PRIORITY_LOW, $getRoot } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import { $createParagraphNode } from 'lexical';
import './EndnotePlugin.css';

// Global endnote management
window.endnoteManager = window.endnoteManager || {
  counter: 1,
  endnotes: new Map(),
  initialized: false,
  
  initializeFromLetter: function(letterData) {
    this.reset();
    if (letterData && letterData.endNotes && Array.isArray(letterData.endNotes)) {
      let maxId = 0;
      letterData.endNotes.forEach(endnote => {
        const id = parseInt(endnote.index);
        this.endnotes.set(id, { 
          text: endnote.text || '', 
          value: endnote.value || '',
          ref: endnote.ref || `endnote-ref-${id}`
        });
        maxId = Math.max(maxId, id);
      });
      this.counter = maxId + 1;
    }
    this.initialized = true;
    console.log('Endnote manager initialized from letter data:', this.getAllEndnotes());
  },
  
  reset: function() {
    this.counter = 1;
    this.endnotes.clear();
    this.initialized = false;
    console.log('Endnote manager reset');
  },
  
  getNextId: function() {
    return this.counter++;
  },
  
  addEndnote: function(id, text, value, ref) {
    this.endnotes.set(id, { 
      text, 
      value, 
      ref: ref || `endnote-ref-${id}` 
    });
    // Update counter to ensure it's always higher than existing IDs
    if (id >= this.counter) {
      this.counter = id + 1;
    }
  },
  
  updateEndnote: function(id, value) {
    const endnote = this.endnotes.get(id);
    if (endnote) {
      endnote.value = value;
    }
  },
  
  getAllEndnotes: function() {
    const result = [];
    for (const [id, data] of this.endnotes) {
      result.push({
        index: id,
        text: data.text,
        value: data.value,
        ref: data.ref
      });
    }
    return result.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  },
  
  removeEndnote: function(id) {
    this.endnotes.delete(id);
  }
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
  
  console.log('EndnoteNode - Created:', {
    footnoteId,
    text,
    endnoteValue,
    ref: this.__endnoteRef
  });
  
  // Register with global endnote manager
  if (footnoteId && window.endnoteManager) {
    window.endnoteManager.addEndnote(footnoteId, text, endnoteValue, this.__endnoteRef);
    console.log('EndnoteNode - Registered with global manager');
  }
}

  // constructor(text, footnoteId, endnoteValue = '', key) {
  //   super(text, key);
  //   this.__footnoteId = footnoteId;
  //   this.__endnoteValue = endnoteValue;
  //   this.__endnoteRef = `endnote-ref-${footnoteId}`;
    
  //   // Register with global endnote manager
  //   if (footnoteId && window.endnoteManager) {
  //     window.endnoteManager.addEndnote(footnoteId, text, endnoteValue, this.__endnoteRef);
  //   }
  // }

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

  // createDOM(config) {
  //   const element = super.createDOM(config);
  //   element.style.padding = '1px 2px';
    
  //   // Add anchor ID using the stored endnote reference
  //   element.id = this.__endnoteRef;

  //   // Add footnote number indicator
  //   const footnoteIndicator = document.createElement('sup');
  //   footnoteIndicator.textContent = `[${this.__footnoteId}]`;
  //   footnoteIndicator.style.fontSize = '0.65em';
  //   footnoteIndicator.style.marginLeft = '2px';
  //   footnoteIndicator.style.color = '#1976d2';
  //   element.appendChild(footnoteIndicator);

  //   return element;
  // }

//   createDOM(config) {
//   const element = super.createDOM(config);
//   element.style.padding = '1px 2px';
//   element.style.cursor = 'pointer';
  
//   // Add anchor ID using the stored endnote reference
//   element.id = this.__endnoteRef;

//   // Add footnote number indicator
//   const footnoteIndicator = document.createElement('sup');
//   footnoteIndicator.textContent = `[${this.__footnoteId}]`;
//   footnoteIndicator.style.fontSize = '0.65em';
//   footnoteIndicator.style.marginLeft = '2px';
//   footnoteIndicator.style.color = '#1976d2';
//   footnoteIndicator.style.cursor = 'pointer';
//   element.appendChild(footnoteIndicator);

//   // Add click handler for editing
//   element.addEventListener('click', (e) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     console.log('EndnoteNode - Clicked, dispatching edit event:', {
//       id: this.__footnoteId,
//       text: this.__text,
//       value: this.__endnoteValue
//     });
    
//     // Dispatch custom event to trigger modal
//     const editEvent = new CustomEvent('showEndnoteModal', {
//       detail: {
//         id: this.__footnoteId,
//         text: this.__text,
//         value: this.__endnoteValue
//       }
//     });
//     document.dispatchEvent(editEvent);
//   });

//   return element;
// }

createDOM(config) {
  const element = super.createDOM(config);
  element.style.padding = '1px 2px';
  element.style.cursor = 'pointer';
  element.style.backgroundColor = '#e3f2fd'; // Light blue background to make it visible
  element.style.borderRadius = '2px';
  element.setAttribute('data-endnote-id', this.__footnoteId);
  element.setAttribute('data-endnote-text', this.__text);
  element.setAttribute('data-endnote-value', this.__endnoteValue || '');
  
  // Add anchor ID using the stored endnote reference
  element.id = this.__endnoteRef;

  // Add footnote number indicator
  const footnoteIndicator = document.createElement('sup');
  footnoteIndicator.textContent = `[${this.__footnoteId}]`;
  footnoteIndicator.style.fontSize = '0.65em';
  footnoteIndicator.style.marginLeft = '2px';
  footnoteIndicator.style.color = '#1976d2';
  footnoteIndicator.style.cursor = 'pointer';
  footnoteIndicator.style.fontWeight = 'bold';
  element.appendChild(footnoteIndicator);

  // Add click handler for editing
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('EndnoteNode - Clicked endnote:', {
      id: this.__footnoteId,
      text: this.__text,
      value: this.__endnoteValue
    });
    
    // First, set the current endnote in the global state
    if (window.lexicalEditor) {
      // Trigger a selection change to update the current endnote
      window.lexicalEditor.update(() => {
        // Force a selection update by slightly modifying and restoring selection
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // This will trigger the selection change listeners
          selection.dirty = true;
        }
      });
    }
    
    // Dispatch custom event to trigger modal
    setTimeout(() => {
      const editEvent = new CustomEvent('showEndnoteModal', {
        detail: {
          id: this.__footnoteId,
          text: this.__text,
          value: this.__endnoteValue
        }
      });
      document.dispatchEvent(editEvent);
    }, 100); // Small delay to ensure selection is processed
  };

  element.addEventListener('click', handleClick);
  
  // Also add click handler to the sup element specifically
  footnoteIndicator.addEventListener('click', handleClick);

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
// function $getSelectedEndnoteNode(selection) {
//   if (!$isRangeSelection(selection)) {
//     return null;
//   }

//   const nodes = selection.getNodes();
//   for (const node of nodes) {
//     if ($isEndnoteNode(node)) {
//       return node;
//     }
//     // Check if cursor is within an endnote node
//     const parent = node.getParent();
//     if (parent && $isEndnoteNode(parent)) {
//       return parent;
//     }
//   }

//   // Check if cursor is positioned within an endnote
//   const anchorNode = selection.anchor.getNode();
//   if ($isEndnoteNode(anchorNode)) {
//     return anchorNode;
//   }

//   return null;
// }

function $getSelectedEndnoteNode(selection) {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const nodes = selection.getNodes();
  console.log('EndnotePlugin - Checking selection nodes:', nodes.length);
  
  // Check all nodes in the selection
  for (const node of nodes) {
    console.log('EndnotePlugin - Node type:', node.getType?.(), 'Is endnote:', $isEndnoteNode(node));
    
    if ($isEndnoteNode(node)) {
      console.log('EndnotePlugin - Found endnote node directly:', {
        id: node.getEndnoteId(),
        text: node.getTextContent(),
        value: node.getEndnoteValue()
      });
      return node;
    }
    
    // Check parent nodes
    let parent = node.getParent();
    while (parent) {
      if ($isEndnoteNode(parent)) {
        console.log('EndnotePlugin - Found endnote in parent:', {
          id: parent.getEndnoteId(),
          text: parent.getTextContent(),
          value: parent.getEndnoteValue()
        });
        return parent;
      }
      parent = parent.getParent();
    }
  }

  // Alternative approach: check if cursor is within an endnote by checking the anchor node
  const anchorNode = selection.anchor.getNode();
  console.log('EndnotePlugin - Checking anchor node:', anchorNode.getType?.());
  
  if ($isEndnoteNode(anchorNode)) {
    console.log('EndnotePlugin - Anchor is endnote node');
    return anchorNode;
  }

  // Check if anchor's parent is an endnote
  const anchorParent = anchorNode.getParent();
  if (anchorParent && $isEndnoteNode(anchorParent)) {
    console.log('EndnotePlugin - Anchor parent is endnote node');
    return anchorParent;
  }

  console.log('EndnotePlugin - No endnote node found in selection');
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

    // const checkSelection = () => {
    //   editor.getEditorState().read(() => {
    //     const selection = $getSelection();
    //     if ($isRangeSelection(selection)) {
    //       const selectedText = selection.getTextContent();
    //       const canCreateEndnote = $isOnWord(selection);
    //       const currentEndnoteNode = $getSelectedEndnoteNode(selection);

    //       handleSetSelectedText(selectedText);
    //       handleSetCanCreateEndnote(canCreateEndnote);
    //       handleSetCurrentEndnote(currentEndnoteNode);
    //     } else {
    //       handleSetSelectedText('');
    //       handleSetCanCreateEndnote(false);
    //       handleSetCurrentEndnote(null);
    //     }
    //   });
    // };

    const checkSelection = () => {
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const selectedText = selection.getTextContent();
      const canCreateEndnote = $isOnWord(selection);
      const currentEndnoteNode = $getSelectedEndnoteNode(selection);

      console.log('EndnotePlugin - Selection check:', {
        selectedText: selectedText.substring(0, 20) + '...',
        canCreateEndnote,
        hasCurrentEndnote: !!currentEndnoteNode,
        currentEndnoteId: currentEndnoteNode?.getEndnoteId?.()
      });

      handleSetSelectedText(selectedText);
      handleSetCanCreateEndnote(canCreateEndnote);
      handleSetCurrentEndnote(currentEndnoteNode);
    } else {
      console.log('EndnotePlugin - No range selection');
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

  return null;
}

export const createEndnoteSafely = (editor, endnoteValue = '') => {
  if (!editor) {
    console.error('createEndnoteSafely - No editor provided');
    return false;
  }

  try {
    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        console.log('createEndnoteSafely - No valid selection, creating placeholder endnote');
        // Create a placeholder endnote at the end of the content
        const root = $getRoot();
        const lastChild = root.getLastChild();
        
        if (lastChild) {
          const footnoteId = window.endnoteManager ? window.endnoteManager.getNextId() : 1;
          const endnoteNode = $createEndnoteNode('Endnote', footnoteId, endnoteValue);
          
          // Append to the last paragraph or create a new one
          if (lastChild.getType() === 'paragraph') {
            lastChild.append($createTextNode(' '), endnoteNode);
          } else {
            const newParagraph = $createParagraphNode();
            newParagraph.append(endnoteNode);
            root.append(newParagraph);
          }
        }
        return true;
      }

      const selectedText = selection.getTextContent();
      const footnoteId = window.endnoteManager ? window.endnoteManager.getNextId() : 1;

      if (selectedText.trim() === '') {
        // Handle word selection at cursor
        const nodes = selection.getNodes();
        if (nodes.length > 0 && $isTextNode(nodes[0])) {
          const textNode = nodes[0];
          const text = textNode.getTextContent();
          const { offset } = selection.anchor;

          let start = offset;
          let end = offset;

          // Find word boundaries
          while (start > 0 && /\w/.test(text[start - 1])) {
            start--;
          }
          while (end < text.length && /\w/.test(text[end])) {
            end++;
          }

          if (start < end) {
            const wordText = text.substring(start, end);
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
          } else {
            // No word found, insert a placeholder
            const endnoteNode = $createEndnoteNode('Endnote', footnoteId, endnoteValue);
            selection.insertNodes([endnoteNode]);
          }
        }
      } else {
        // Replace selected text with endnote node
        const footnoteNode = $createEndnoteNode(selectedText, footnoteId, endnoteValue);
        selection.insertNodes([footnoteNode]);
      }

      console.log('createEndnoteSafely - Successfully created endnote with ID:', footnoteId);
      return true;
    });
    
    return true;
  } catch (error) {
    console.error('createEndnoteSafely - Error:', error);
    return false;
  }
};
