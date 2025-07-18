// FootnotePlugin.jsx
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  TextNode,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import './FootNotePlugin.css'; // Assuming you have styles for footnotes

// Custom command for footnote
export const INSERT_FOOTNOTE_COMMAND = 'INSERT_FOOTNOTE_COMMAND';

// Custom node for footnotes
export class FootNoteNode extends TextNode {
  static getType() {
    return 'footnote';
  }

  static clone(node) {
    return new FootNoteNode(node.__text, node.__footnoteId, node.__key);
  }

  constructor(text, footnoteId, key) {
    super(text, key);
    this.__footnoteId = footnoteId;
  }

  getFootnoteId() {
    return this.__footnoteId;
  }

  setFootnoteId(footnoteId) {
    const writable = this.getWritable();
    writable.__footnoteId = footnoteId;
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.className = 'footnote-highlight';
    element.style.backgroundColor = '#fff3cd';
    element.style.border = '1px solid #ffeaa7';
    element.style.borderRadius = '3px';
    element.style.padding = '2px 4px';
    element.style.cursor = 'pointer';
    element.style.position = 'relative';
    
    // Add footnote number indicator
    const footnoteIndicator = document.createElement('sup');
    footnoteIndicator.textContent = this.__footnoteId;
    footnoteIndicator.style.fontSize = '0.8em';
    footnoteIndicator.style.color = '#0066cc';
    footnoteIndicator.style.marginLeft = '2px';
    footnoteIndicator.style.fontWeight = 'bold';
    element.appendChild(footnoteIndicator);
    
    // Add click handler to show footnote modal
    element.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showFootnoteModal(element, this.__text, this.__footnoteId);
    });
    
    return element;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__footnoteId !== prevNode.__footnoteId) {
      // Update footnote indicator
      const indicator = dom.querySelector('sup');
      if (indicator) {
        indicator.textContent = this.__footnoteId;
      }
    }
    return updated;
  }

  showFootnoteModal(element, text, footnoteId) {
    // Remove any existing modal
    const existingModal = document.querySelector('.footnote-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Get the position of the clicked element
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Calculate position
    const top = rect.bottom + scrollTop + 5;
    const left = rect.left + scrollLeft;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'footnote-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    modal.style.zIndex = '1000';
    modal.style.pointerEvents = 'none';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'footnote-modal-content';
    modalContent.style.position = 'absolute';
    modalContent.style.top = `${top}px`;
    modalContent.style.left = `${left}px`;
    modalContent.style.background = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    modalContent.style.padding = '16px';
    modalContent.style.minWidth = '300px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.pointerEvents = 'all';
    modalContent.style.border = '1px solid #ddd';
    
    // Adjust position if modal would go off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left + 400 > viewportWidth) {
      modalContent.style.left = `${viewportWidth - 420}px`;
    }
    
    if (top + 200 > viewportHeight + scrollTop) {
      modalContent.style.top = `${rect.top + scrollTop - 200 - 5}px`;
    }
    
    // Modal header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid #eee';
    
    const title = document.createElement('h3');
    title.textContent = `Footnote ${footnoteId}`;
    title.style.margin = '0';
    title.style.fontSize = '16px';
    title.style.fontWeight = '600';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    closeButton.style.padding = '4px';
    closeButton.style.borderRadius = '4px';
    closeButton.onclick = () => modal.remove();
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Content
    const content = document.createElement('div');
    content.innerHTML = `
      <p style="margin: 0 0 16px 0; color: #333;">
        <strong>Highlighted text:</strong> "${text}"
      </p>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Add footnote text:</label>
        <textarea 
          id="footnote-text-${footnoteId}" 
          placeholder="Enter footnote content here..."
          style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"
        ></textarea>
      </div>
    `;
    
    // Actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.justifyContent = 'flex-end';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = '#3b82f6';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontSize = '14px';
    saveButton.onclick = () => {
      const footnoteText = document.getElementById(`footnote-text-${footnoteId}`).value;
      // Here you could save the footnote text to your data store
      console.log(`Footnote ${footnoteId}:`, footnoteText);
      modal.remove();
    };
    
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove Footnote';
    removeButton.style.padding = '8px 16px';
    removeButton.style.backgroundColor = '#dc3545';
    removeButton.style.color = 'white';
    removeButton.style.border = 'none';
    removeButton.style.borderRadius = '4px';
    removeButton.style.cursor = 'pointer';
    removeButton.style.fontSize = '14px';
    removeButton.onclick = () => {
      this.removeFootnote();
      modal.remove();
    };
    
    actions.appendChild(saveButton);
    actions.appendChild(removeButton);
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(actions);
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
    
    // Focus the textarea
    setTimeout(() => {
      const textarea = document.getElementById(`footnote-text-${footnoteId}`);
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  removeFootnote() {
    if (window.lexicalEditor) {
      window.lexicalEditor.update(() => {
        const textNode = $createTextNode(this.__text);
        this.replace(textNode);
      });
    }
  }

  static importJSON(serializedNode) {
    const { text, footnoteId } = serializedNode;
    return $createFootnoteNode(text, footnoteId);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      footnoteId: this.__footnoteId,
      type: 'footnote',
      version: 1,
    };
  }
}

export function $createFootnoteNode(text, footnoteId) {
  return new FootNoteNode(text, footnoteId);
}

export function $isFootnoteNode(node) {
  return node instanceof FootNoteNode;
}

// Hook to register the footnote plugin
export function useFootnotePlugin() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (!editor) return;
    
    // Store editor reference globally
    window.lexicalEditor = editor;
    
    let footnoteCounter = 1;
    
    const insertFootnote = () => {
      editor.update(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          return;
        }
        
        const selectedText = selection.getTextContent();
        
        if (selectedText.trim() === '') {
          // If no text is selected, try to select the word at cursor
          const nodes = selection.getNodes();
          if (nodes.length > 0 && $isTextNode(nodes[0])) {
            const textNode = nodes[0];
            const text = textNode.getTextContent();
            const offset = selection.anchor.offset;
            
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
              
              nodes.push($createFootnoteNode(wordText, footnoteCounter++));
              
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
          const footnoteNode = $createFootnoteNode(selectedText, footnoteCounter++);
          selection.insertNodes([footnoteNode]);
        }
      });
    };
    
    const removeListeners = mergeRegister(
      editor.registerCommand(
        INSERT_FOOTNOTE_COMMAND,
        () => {
          insertFootnote();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
    
    return removeListeners;
  }, [editor]);
  
  return null;
}