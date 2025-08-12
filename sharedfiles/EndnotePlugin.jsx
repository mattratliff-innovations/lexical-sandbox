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

  static transform() {
    // This method is called when the node is being transformed
    // Return the node constructor for proper registration
    return EndnoteNode;
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

// Helper function to check if there is actual selected text
function $hasSelectedText(selection) {
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const selectedText = selection.getTextContent();
  return selectedText.trim() !== '';
}

// Hook to register the footnote plugin
export function useEndnotePlugin(handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    // Register the EndnoteNode with the editor
    const unregisterNode = editor.registerNodeTransform(EndnoteNode, (node) => {
      // This ensures the node is properly registered
      return node;
    });

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
          const hasSelectedText = $hasSelectedText(selection);
          const currentEndnoteNode = $getSelectedEndnoteNode(selection);

          handleSetSelectedText(selectedText);
          // Only allow creating endnote if there is actual selected text OR we're on an existing endnote
          handleSetCanCreateEndnote(hasSelectedText || !!currentEndnoteNode);
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
      unregisterNode();
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

        // Only proceed if there is actual selected text
        if (selectedText.trim() !== '') {
          // Create a simple text replacement with endnote marker
          const endnoteText = `${selectedText}[${footnoteId}]`;
          
          // Replace the selected text
          selection.insertText(endnoteText);
          
          // Register with endnote manager for tracking
          if (window.endnoteManager) {
            window.endnoteManager.addEndnote(footnoteId, selectedText, endnoteValue, `endnote-ref-${footnoteId}`);
          }
          
          console.log(`Created endnote ${footnoteId} for "${selectedText}" with value: "${endnoteValue}"`);
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