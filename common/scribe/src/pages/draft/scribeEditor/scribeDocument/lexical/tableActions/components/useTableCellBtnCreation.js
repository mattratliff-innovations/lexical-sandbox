import { useRef, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection } from 'lexical';
import { $isTableSelection } from '@lexical/table';

export default function useTableCellBtnCreation(tableCellDOMNode, setAnchorEl, cellRef, preCellRef, setCurSelection) {
  const buttonContainerRef = useRef(null);
  const [editor] = useLexicalComposerContext();

  const handleButtonAction = useCallback(
    (evt) => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isTableSelection(selection)) setCurSelection(selection);
      });

      // keeps style selection of the table node(s) in combination with onmousedown
      cellRef.current.focus();

      // anchoring menu to button
      setAnchorEl(evt.currentTarget);
    },
    [setAnchorEl]
  );

  useEffect(() => {
    const existingButton = preCellRef?.current?.querySelector('.table-cell-action-button-container');

    if (!tableCellDOMNode) {
      preCellRef?.current?.removeChild(existingButton);
      return;
    }

    const addButtonToCell = () => {
      // If the cell changes, clean up the previous button
      if (preCellRef.current && preCellRef.current !== tableCellDOMNode && existingButton) preCellRef?.current?.removeChild(existingButton);

      // Create a new button container if it doesn't exist in the current cell
      let buttonContainer = tableCellDOMNode.querySelector('.table-cell-action-button-container');

      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'table-cell-action-button-container';
        buttonContainer.setAttribute('aria-label', 'Table actions');

        // Create button element
        const button = document.createElement('button');
        button.className = 'table-cell-action-button';
        button.setAttribute('aria-label', 'Table actions');
        button.setAttribute('title', 'Table actions');
        button.setAttribute('type', 'button');
        button.setAttribute('id', `table-cell-action-button-${Date.now()}`); // Unique ID

        // Create chevron icon
        const icon = document.createElement('i');
        icon.className = 'chevron-down';

        // Create a button event for testing/debugging
        button.onmousedown = handleButtonAction;
        button.onkeydown = (evt) => {
          if (evt.key === 'Enter') handleButtonAction(evt);
        };

        // Assemble and append
        tableCellDOMNode.appendChild(buttonContainer);
        buttonContainer.appendChild(button);
        button.appendChild(icon);

        // Store references
        buttonContainerRef.current = buttonContainer;
        cellRef.current = button;
      } else {
        // Update references if button already exists
        cellRef.current = buttonContainer.querySelector('button');
      }

      // Update the previous cell reference
      preCellRef.current = tableCellDOMNode;
    };

    // Initial creation
    addButtonToCell();

    // Add an observer to ensure the button remains in the cell
    const observer = new MutationObserver((mutations) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const buttonExists = tableCellDOMNode.querySelector('.table-cell-action-button-container');

          // If button was removed, add it back
          if (!buttonExists && tableCellDOMNode) addButtonToCell();
        }
      }
    });

    // Start observing the cell for changes to its children
    observer.observe(tableCellDOMNode, { childList: true });

    // Clean up function
    // eslint-disable-next-line consistent-return
    return () => observer.disconnect();
  }, [tableCellDOMNode, setAnchorEl, cellRef, preCellRef]);
}
