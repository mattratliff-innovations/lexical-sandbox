import { useState, useCallback, useEffect } from 'react';
import { $getSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { $getTableCellNodeFromLexicalNode } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

/**
 * Hook to get and track the current table cell node from editor selection
 * @returns {Object} Object containing tableCellNode and tableCellDOMNode
 */
export default function useTableCellNode(setCurSelection) {
  const [tableCellNode, setTableCellNode] = useState(null);
  const [tableCellDOMNode, setTableCellDOMNode] = useState(null);
  const [editor] = useLexicalComposerContext();

  const moveMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();
      if (!selection || !rootElement || !nativeSelection) return;
      setCurSelection(selection);

      const cellNode = $getTableCellNodeFromLexicalNode(selection?.anchor?.getNode());
      const cellNodeDOM = editor.getElementByKey(cellNode?.getKey());

      if (!cellNode) {
        setTableCellDOMNode(null);
        return;
      }

      setTableCellNode(cellNode);
      setTableCellDOMNode(cellNodeDOM);
    });
  }, [editor]);

  // Register a selection change listener
  useEffect(() => {
    // Listen for editor updates
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => editorState.read(() => moveMenu()));

    // Listen for selection changes using the SELECTION_CHANGE_COMMAND
    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        moveMenu();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    // Additional registration for document clicks
    const handleDocumentClick = () => setTimeout(moveMenu, 0);

    document.addEventListener('click', handleDocumentClick);

    return () => {
      unregisterListener();
      removeSelectionListener();
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [editor, moveMenu]);

  // Also check for selection changes on mouse up
  useEffect(() => {
    const checkSelectionOnMouseUp = () => setTimeout(moveMenu, 0);
    document.addEventListener('mouseup', checkSelectionOnMouseUp);

    return () => document.removeEventListener('mouseup', checkSelectionOnMouseUp);
  }, [moveMenu]);

  return { tableCellNode, tableCellDOMNode };
}
