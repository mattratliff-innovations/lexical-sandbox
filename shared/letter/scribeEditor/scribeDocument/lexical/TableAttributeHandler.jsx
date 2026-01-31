import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableNode } from '@lexical/table';
import { $getNodeByKey } from 'lexical';

const originalImportDOM = TableNode.importDOM;

TableNode.importDOM = () => {
  const importers = originalImportDOM ? originalImportDOM() : {};

  return {
    ...importers,
    table: (node) => {
      const style = node?.getAttribute('style');
      let alignment = 'left';
      let width = null;
      let columnWidths = null;

      if (style?.includes('justify-self')) {
        const alignMatch = style.match(/justify-self:\s*([^;]+)/);
        if (alignMatch) alignment = alignMatch[1].trim();
      }

      if (style?.includes('width:') && style.includes('%')) {
        const widthMatch = style.match(/width:\s*(\d+)%/);
        if (widthMatch) width = parseInt(widthMatch[1], 10);
      }

      const columnWidthsAttr = node?.getAttribute('data-column-widths');
      if (columnWidthsAttr) columnWidths = columnWidthsAttr.split(',').map((val) => parseInt(val.trim(), 10));

      const lexicalStripingAttr = node?.getAttribute('data-lexical-row-striping');

      return {
        conversion: () => {
          const tableNode = new TableNode();

          if (alignment !== 'left') tableNode.__alignment = alignment;
          if (width) tableNode.__width = width;
          if (columnWidths) tableNode.__columnWidths = columnWidths;
          tableNode.setRowStriping(lexicalStripingAttr === 'true');
          return { node: tableNode };
        },
        priority: 1,
      };
    },
  };
};

export default function TableAttributeHandler() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerMutationListener(TableNode, (mutatedNodes) => {
      mutatedNodes.forEach((mutation, nodeKey) => {
        if (mutation === 'created' || mutation === 'updated') {
          const dom = editor.getElementByKey(nodeKey);
          if (dom) {
            editor.getEditorState().read(() => {
              const node = $getNodeByKey(nodeKey);
              if (node) {
                if (node.__alignment) dom.style.justifySelf = node.__alignment;
                if (node.__width) dom.style.width = `${node.__width}%`;
                if (node.__columnWidths) {
                  const currentTableWidth = dom.offsetWidth;
                  dom.style.width = `${currentTableWidth}px`;
                  dom.style.tableLayout = 'fixed';

                  const rows = dom.querySelectorAll('tr');
                  node.__columnWidths.forEach((percentage, idx) => {
                    rows.forEach((row) => {
                      const cell = row.children[idx];
                      cell?.style.removeProperty('width');
                      cell?.style.setProperty('width', `${percentage}%`);
                    });
                  });
                }
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
