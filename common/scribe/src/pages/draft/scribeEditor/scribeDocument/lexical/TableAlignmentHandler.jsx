import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableNode } from '@lexical/table';
import { $getNodeByKey } from 'lexical';
import { useEffect } from 'react';

const originalImportDOM = TableNode.importDOM;

TableNode.importDOM = () => {
  const importers = originalImportDOM ? originalImportDOM() : {};

  return {
    ...importers,
    table: (node) => {
      const alignment = node.getAttribute('data-align');
      return {
        conversion: () => {
          const tableNode = new TableNode();

          if (alignment) tableNode.__alignment = alignment;
          return { node: tableNode };
        },
        priority: 1,
      };
    },
  };
};

export default function TableAlignmentHandler() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerMutationListener(TableNode, (mutatedNodes) => {
      mutatedNodes.forEach((mutation, nodeKey) => {
        if (mutation === 'created' || mutation === 'updated') {
          const dom = editor.getElementByKey(nodeKey);
          if (dom) {
            editor.getEditorState().read(() => {
              const node = $getNodeByKey(nodeKey);
              if (node && node.__alignment) {
                dom.style.justifySelf = node.__alignment;
                dom.setAttribute('data-align', node.__alignment);
              }
            });
          }
        }
      });
    });
    return () => removeListener();
  }, [editor]);
  return null;
}
