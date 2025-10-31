// Add this helper function at the top of useTableActions, before the callbacks

const executeWithTableSelection = useCallback(
  (operation, operationName) => {
    const savedSelection = curSelection;
    
    setTimeout(() => {
      editor.update(() => {
        try {
          const cellNode = getTableCellNode();
          if (!cellNode) {
            console.warn(`No cell node found for ${operationName}`);
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
          if (tableNode) preserveAttributes(tableNode);

          // Restore selection to the cell
          if (savedSelection) {
            if ($isRangeSelection(savedSelection)) {
              const clonedSelection = savedSelection.clone();
              $setSelection(clonedSelection);
            } else if ($isTableSelection(savedSelection)) {
              // For table selections, select the anchor cell
              cellNode.selectStart();
            }
          } else {
            cellNode.selectStart();
          }
          
          // Execute the operation
          operation();
        } catch (error) {
          console.error(`Error in ${operationName}:`, error);
        }
      });
    }, 0);
  },
  [editor, getTableCellNode, curSelection]
);

// Then update your callbacks to use this helper:

const insertTableRowAtSelection = useCallback(
  (direction) => {
    executeWithTableSelection(
      () => $insertTableRow__EXPERIMENTAL(direction),
      'insertTableRow'
    );
  },
  [executeWithTableSelection]
);

const insertTableColumnAtSelection = useCallback(
  (direction) => {
    executeWithTableSelection(
      () => $insertTableColumn__EXPERIMENTAL(direction),
      'insertTableColumn'
    );
  },
  [executeWithTableSelection]
);

const deleteTableColumnAtSelection = useCallback(() => {
  executeWithTableSelection(
    () => $deleteTableColumn__EXPERIMENTAL(),
    'deleteTableColumn'
  );
}, [executeWithTableSelection]);

const deleteTableRowAtSelection = useCallback(() => {
  executeWithTableSelection(
    () => $deleteTableRow__EXPERIMENTAL(),
    'deleteTableRow'
  );
}, [executeWithTableSelection]);