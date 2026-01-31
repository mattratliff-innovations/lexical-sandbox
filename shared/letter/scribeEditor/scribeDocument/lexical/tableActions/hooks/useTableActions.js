/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */

import { useCallback, useEffect, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $computeTableMapSkipCellCheck,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $unmergeCell,
  TableCellHeaderStates,
} from '@lexical/table';
import { $createParagraphNode, $getNodeByKey, $isElementNode, $isRangeSelection, $isTextNode, $setSelection } from 'lexical';

/**
 * Helper function to get the node triplet from a point
 * @param {Object} point - The selection point
 * @returns {Array} Array containing [cell, row, table]
 */
function $getNodeTriplet(point) {
  const node = point.getNode();
  const tableCellNode = $getTableCellNodeFromLexicalNode(node);
  if (!$isTableCellNode(tableCellNode)) return [null, null, null];

  const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
  const tableRowNode = tableCellNode.getParent();
  return [tableCellNode, tableRowNode, tableNode];
}

/**
 * Helper function to check if a cell can be unmerged
 * @returns {boolean} Whether the cell at the current selection can be unmerged
 */
function $canUnmerge(curSelection) {
  if (
    !curSelection ||
    ($isRangeSelection(curSelection) && !curSelection.isCollapsed()) ||
    ($isTableSelection(curSelection) && !curSelection.anchor.is(curSelection.focus)) ||
    (!$isRangeSelection(curSelection) && !$isTableSelection(curSelection))
  )
    return false;

  const [cell] = $getNodeTriplet(curSelection.anchor);

  // Check if cell exists before accessing its properties
  if (!cell) return false;
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}

// Helper function to select the last descendant of a node
function $selectLastDescendant(node) {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) lastDescendant.select();
  else if ($isElementNode(lastDescendant)) lastDescendant.selectEnd();
  else if (lastDescendant !== null) lastDescendant.selectNext();
}

const preserveAttributes = (tableNode) => {
  const writable = tableNode.getWritable();

  const existingAlignment = tableNode.__alignment;
  const existingWidth = tableNode.__width;
  const existingColumnWidths = tableNode.__columnWidths;

  if (existingAlignment) writable.__alignment = existingAlignment;
  if (existingWidth) writable.__width = existingWidth;
  if (existingColumnWidths) writable.__columnWidths = existingColumnWidths;
};

/**
 * Hook that provides table cell merging and unmerging functionality
 * @param {Object} curSelection - Object of current table cells
 * @param {string} cellNodeKey - The key of the current table cell node
 * @returns {Object} Object containing merge cell methods and state
 */
export default function useTableActions(curSelection, cellNodeKey) {
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [editor] = useLexicalComposerContext();

  // Helper to get fresh table cell node from key
  const getTableCellNode = useCallback(() => {
    if (!cellNodeKey) return null;
    const node = $getNodeByKey(cellNodeKey);
    return $isTableCellNode(node) ? node : null;
  }, [cellNodeKey]);

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

  // Update merge/unmerge state based on current selection
  useEffect(() => {
    if (!curSelection) return;

    editor.getEditorState().read(() => {
      try {
        const nodes = curSelection?.getNodes();

        if (!nodes || nodes.length === 0) {
          setCanMergeCells(false);
          setCanUnmergeCell(false);
          return;
        }

        const tableCells = nodes.filter($isTableCellNode);
        setCanMergeCells(tableCells?.length > 1);

        try {
          setCanUnmergeCell($canUnmerge(curSelection));
        } catch (innerError) {
          // Log as warning to satisfy linter and aid debugging
          console.warn('Silent error checking unmerge:', innerError);
          setCanUnmergeCell(false);
        }
      } catch {
        // This catches the "Expected node with key..." error when deleting tables
        setCanMergeCells(false);
        setCanUnmergeCell(false);
      }
    });
  }, [editor, curSelection]);

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

  const insertTableRowAtSelection = useCallback(
    (direction) => {
      executeWithTableSelection(() => $insertTableRowAtSelection(direction), 'insertTableRow');
    },
    [executeWithTableSelection]
  );

  const insertTableColumnAtSelection = useCallback(
    (direction) => {
      executeWithTableSelection(() => $insertTableColumnAtSelection(direction), 'insertTableColumn');
    },
    [executeWithTableSelection]
  );

  const deleteTableColumnAtSelection = useCallback(() => {
    executeWithTableSelection(() => $deleteTableColumnAtSelection(), 'deleteTableColumn');
  }, [executeWithTableSelection]);

  const deleteTableRowAtSelection = useCallback(() => {
    executeWithTableSelection(() => $deleteTableRowAtSelection(), 'deleteTableRow');
  }, [executeWithTableSelection]);

  const deleteTableAtSelection = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        try {
          const cellNode = getTableCellNode();
          if (!cellNode) {
            console.warn('No cell node found for delete table');
            return;
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
          if (tableNode) {
            tableNode.remove();
          }
        } catch (error) {
          console.error('Error deleting table:', error);
        }
      });
    }, 0);
  }, [editor, getTableCellNode]);

  const alignTable = useCallback(
    (align) => {
      editor.update(() => {
        try {
          const cellNode = getTableCellNode();
          if (!cellNode) return;

          const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);
          if (table && table.getType() === 'table') {
            const existingWidth = table.__width;
            const existingColumnWidths = table.__columnWidths;

            const writable = table.getWritable();

            if (existingWidth) writable.__width = existingWidth;
            if (existingColumnWidths) writable.__columnWidths = existingColumnWidths;

            writable.__alignment = align;

            const dom = editor.getElementByKey(table.getKey());
            if (dom) dom.style.justifySelf = align;
          }
        } catch (error) {
          console.error('Error aligning table:', error);
        }
      });
    },
    [editor, getTableCellNode]
  );

  const toggleTableRowIsHeader = useCallback(() => {
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
  }, [executeWithTableSelection, getTableCellNode, editor]);

  const toggleTableColumnIsHeader = useCallback(() => {
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
                const rowStillTH = Array.from(tableDom.querySelectorAll('tr')[rowIndex].children).every((cell) => cell && cell.tagName === 'TH');

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
  }, [executeWithTableSelection, getTableCellNode, editor]);

  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      try {
        const cellNode = getTableCellNode();
        if (!cellNode || !cellNode.isAttached()) return;

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (tableNode) {
          preserveAttributes(tableNode);
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      } catch (error) {
        console.warn('No table found for row striping toggle: ', error);
      }
    });
  }, [editor, getTableCellNode]);

  return {
    mergeTableCellsAtSelection,
    unmergeTableCellsAtSelection,
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableColumnAtSelection,
    deleteTableAtSelection,
    alignTable,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
    toggleRowStriping,
    canMergeCells,
    canUnmergeCell,
  };
}
