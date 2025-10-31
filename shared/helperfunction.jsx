/**
 * Merges selected table cells
 */
const mergeTableCellsAtSelection = useCallback(() => {
  if (!canMergeCells) return;

  // Store the current selection before the menu closes
  const savedSelection = curSelection;

  setTimeout(() => {
    editor.update(() => {
      try {
        // First, restore the table selection
        if (savedSelection && $isTableSelection(savedSelection)) {
          const clonedSelection = savedSelection.clone();
          $setSelection(clonedSelection);
          
          // Get all selected cells from the restored selection
          const nodes = clonedSelection.getNodes();
          const tableCells = nodes.filter($isTableCellNode);

          if (tableCells.length === 0) {
            console.warn('No table cells in selection');
            return;
          }

          // Find the table node
          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCells[0]);
          if (tableNode) preserveAttributes(tableNode);

          const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);

          // Find the boundaries of the selection including merged cells
          let minRow = Infinity;
          let maxRow = -Infinity;
          let minCol = Infinity;
          let maxCol = -Infinity;

          // First pass: find the actual boundaries considering merged cells
          const processedCells = new Set();
          for (const row of gridMap) {
            for (const mapCell of row) {
              // eslint-disable-next-line no-continue
              if (!mapCell || !mapCell.cell) continue;

              const cellKey = mapCell.cell.getKey();
              // eslint-disable-next-line no-continue
              if (processedCells.has(cellKey)) continue;

              if (tableCells.some((cell) => cell.is(mapCell.cell))) {
                processedCells.add(cellKey);
                // Get the actual position of this cell in the grid
                const cellStartRow = mapCell.startRow;
                const cellStartCol = mapCell.startColumn;
                const cellRowSpan = mapCell.cell.__rowSpan || 1;
                const cellColSpan = mapCell.cell.__colSpan || 1;

                // Update boundaries considering the cell's actual position and span
                minRow = Math.min(minRow, cellStartRow);
                maxRow = Math.max(maxRow, cellStartRow + cellRowSpan - 1);
                minCol = Math.min(minCol, cellStartCol);
                maxCol = Math.max(maxCol, cellStartCol + cellColSpan - 1);
              }
            }
          }

          // Validate boundaries
          if (minRow === Infinity || minCol === Infinity) return;

          // The total span of the merged cell
          const totalRowSpan = maxRow - minRow + 1;
          const totalColSpan = maxCol - minCol + 1;

          // Use the top-left cell as the target cell
          const targetCellMap = gridMap[minRow][minCol];
          if (!targetCellMap?.cell) return;

          const targetCell = targetCellMap.cell;

          // Set the spans for the target cell
          targetCell.setColSpan(totalColSpan);
          targetCell.setRowSpan(totalRowSpan);

          // Move content from other cells to the target cell
          const seenCells = new Set([targetCell.getKey()]);

          // Second pass: merge content and remove other cells
          for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
              const mapCell = gridMap[row][col];
              // eslint-disable-next-line no-continue
              if (!mapCell?.cell) continue;

              const currentCell = mapCell.cell;
              const key = currentCell.getKey();

              if (!seenCells.has(key)) {
                seenCells.add(key);
                const isEmpty = $cellContainsEmptyParagraph(currentCell);

                if (!isEmpty) targetCell.append(...currentCell.getChildren());
                currentCell.remove();
              }
            }
          }

          // Ensure target cell has content
          if (targetCell.getChildrenSize() === 0) targetCell.append($createParagraphNode());

          // Select the last descendant of the target cell to place cursor at the end
          $selectLastDescendant(targetCell);

          // Mark the table node as dirty to trigger a re-render
          if (tableNode.isAttached()) tableNode.markDirty();
        } else {
          console.warn('Invalid or missing table selection for merge');
        }
      } catch (error) {
        console.error('Error merging cells:', error);
      }
    });
  }, 0);
}, [editor, curSelection, canMergeCells]);


const unmergeTableCellsAtSelection = useCallback(() => {
  if (!$isRangeSelection(curSelection)) return;

  const savedSelection = curSelection;

  setTimeout(() => {
    editor.update(() => {
      try {
        const cellNode = getTableCellNode();
        if (!cellNode) {
          console.warn('No cell node found for unmerge');
          return;
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (tableNode) preserveAttributes(tableNode);

        // Restore the selection
        if (savedSelection && $isRangeSelection(savedSelection)) {
          const clonedSelection = savedSelection.clone();
          $setSelection(clonedSelection);
        } else {
          cellNode.selectStart();
        }

        $unmergeCell();
      } catch (error) {
        console.error('Error unmerging cells:', error);
      }
    });
  }, 0);
}, [editor, curSelection, getTableCellNode]);

