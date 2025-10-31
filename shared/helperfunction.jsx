const toggleTableRowIsHeader = useCallback(() => {
  const savedSelection = curSelection;
  
  executeWithTableSelection(() => {
    const cellNode = getTableCellNode();
    if (!cellNode) return;
    
    const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
    if (!tableNode) return;

    const rowIdx = $getTableRowIndexFromTableCellNode(cellNode);
    const tableDom = editor.getElementByKey(tableNode.getKey());
    const targetRow = tableDom?.querySelectorAll('tr')[rowIdx];

    let thCount = 0;
    let totalCells = 0;

    if (targetRow) {
      Array.from(targetRow.children).forEach((cell) => {
        totalCells++;
        if (cell.tagName === 'TH') thCount++;
      });
    }

    const shouldTurnToTD = thCount === totalCells;
    const tableRows = tableNode.getChildren();

    if (rowIdx < tableRows.length) {
      const tableRow = tableRows[rowIdx];

      if ($isTableRowNode(tableRow)) {
        const tableCells = tableRow.getChildren();

        tableCells.forEach((tableCell, colIndex) => {
          if ($isTableCellNode(tableCell)) {
            if (shouldTurnToTD) {
              const columnStillTH = Array.from(tableDom.querySelectorAll('tr')).every((row) => {
                const cellInThisColumn = row.children[colIndex];
                return cellInThisColumn && cellInThisColumn.tagName === 'TH';
              });

              if (!columnStillTH) tableCell.setHeaderStyles(TableCellHeaderStates.NO_STATUS);
            } else if (colIndex === 0) {
              tableCell.setHeaderStyles(TableCellHeaderStates.ROW + TableCellHeaderStates.COLUMN);
            } else {
              tableCell.setHeaderStyles(TableCellHeaderStates.ROW);
            }
          }
        });
      }
    }

    const writable = tableNode.getWritable();
    writable.__hasRowHeader = !shouldTurnToTD;
  }, 'toggleTableRowIsHeader');
}, [executeWithTableSelection, getTableCellNode, editor, curSelection]);

const toggleTableColumnIsHeader = useCallback(() => {
  const savedSelection = curSelection;
  
  executeWithTableSelection(() => {
    const cellNode = getTableCellNode();
    if (!cellNode) return;
    
    const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
    if (!tableNode) return;

    const colIdx = $getTableColumnIndexFromTableCellNode(cellNode);
    const tableDom = editor.getElementByKey(tableNode.getKey());
    const allRows = tableDom?.querySelectorAll('tr');

    let thCount = 0;
    let totalCells = 0;

    allRows?.forEach((row) => {
      const cell = row.children[colIdx];
      if (cell) {
        totalCells++;
        if (cell.tagName === 'TH') thCount++;
      }
    });

    const shouldTurnToTD = thCount === totalCells;
    const tableRows = tableNode.getChildren();

    tableRows.forEach((tableRow, rowIndex) => {
      if ($isTableRowNode(tableRow)) {
        const tableCells = tableRow.getChildren();

        if (colIdx < tableCells.length) {
          const tableCell = tableCells[colIdx];

          if ($isTableCellNode(tableCell)) {
            if (shouldTurnToTD) {
              const rowStillTH = Array.from(tableDom.querySelectorAll('tr')[rowIndex].children).every(
                (cell) => cell && cell.tagName === 'TH'
              );

              if (!rowStillTH) tableCell.setHeaderStyles(TableCellHeaderStates.NO_STATUS);
            } else if (rowIndex === 0) {
              tableCell.setHeaderStyles(TableCellHeaderStates.ROW + TableCellHeaderStates.COLUMN);
            } else {
              tableCell.setHeaderStyles(TableCellHeaderStates.COLUMN);
            }
          }
        }
      }
    });

    const writable = tableNode.getWritable();
    writable.__hasColumnHeader = !shouldTurnToTD;
  }, 'toggleTableColumnIsHeader');
}, [executeWithTableSelection, getTableCellNode, editor, curSelection]);