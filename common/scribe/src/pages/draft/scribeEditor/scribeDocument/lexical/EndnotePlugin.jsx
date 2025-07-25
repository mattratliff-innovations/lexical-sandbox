// FootnotePlugin.jsx
import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode, TextNode, COMMAND_PRIORITY_LOW } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
// import './FootNotePlugin.css'; // Assuming you have styles for footnotes
import './EndnotePlugin.css';

// Custom command for footnote
export const INSERT_FOOTNOTE_COMMAND = 'INSERT_FOOTNOTE_COMMAND';

// Custom node for footnotes
export class EndnoteNode extends TextNode {
  static getType() {
    return 'footnote';
  }

  static clone(node) {
    return new EndnoteNode(node.__text, node.__footnoteId, node.__key);
  }

  constructor(text, footnoteId, key) {
    super(text, key);
    this.__footnoteId = footnoteId;
  }

  getEndnoteId() {
    return this.__footnoteId;
  }

  setEndnoteId(footnoteId) {
    const writable = this.getWritable();
    writable.__footnoteId = footnoteId;
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.style.cursor = 'pointer';

    // Add footnote number indicator
    const footnoteIndicator = document.createElement('sup');
    footnoteIndicator.textContent = `[${this.__footnoteId}]`;
    footnoteIndicator.style.fontSize = '0.65em';
    footnoteIndicator.style.marginLeft = '2px';
    element.appendChild(footnoteIndicator);

    // Add click handler to show footnote modal
    element.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEndnoteModal(element, this.__text, this.__footnoteId);
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

  static importJSON(serializedNode) {
    const { text, footnoteId } = serializedNode;
    // eslint-disable-next-line no-use-before-define
    return $createEndnoteNode(text, footnoteId);
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

export function $createEndnoteNode(text, footnoteId) {
  return new EndnoteNode(text, footnoteId);
}

export function $isEndnoteNode(node) {
  return node instanceof EndnoteNode;
}

// Hook to register the footnote plugin
export function useEndnotePlugin(handleSetSelectedText) {
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

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        checkForSelectedText();
      });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      removeUpdateListener();
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // Store editor reference globally
    window.lexicalEditor = editor;

    let footnoteCounter = 1;

    const insertEndnote = () => {
      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        const selectedText = selection.getTextContent();
        console.log('selectedTExt = ', selectedText);

        if (selectedText.trim() === '') {
          // If no text is selected, try to select the word at cursor
          const nodes = selection.getNodes();
          if (nodes.length > 0 && $isTextNode(nodes[0])) {
            //enable the endnote toolbar button
            handleSetSelectedText(selectedText);

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

              nodes.push($createEndnoteNode(wordText, footnoteCounter++));

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
          //trigger to open modal

          // Replace selected text with footnote node
          const footnoteNode = $createEndnoteNode(selectedText, footnoteCounter++);
          selection.insertNodes([footnoteNode]);
        }
      });
    };

    const removeListeners = mergeRegister(
      editor.registerCommand(
        INSERT_FOOTNOTE_COMMAND,
        () => {
          insertEndnote();
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    // eslint-disable-next-line consistent-return
    return removeListeners;
  }, [editor]);

  return null;
}
