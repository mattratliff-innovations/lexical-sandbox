/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
import { useCallback, useState, useEffect } from 'react';
import { $isRangeSelection, $createParagraphNode, $isTextNode, $isElementNode, $setSelection, $getSelection } from 'lexical';
import {
  $getTableNodeFromLexicalNodeOrThrow,
  $computeTableMapSkipCellCheck,
  $getTableCellNodeFromLexicalNode,
  $isTableCellNode,
  $isTableSelection,
  $unmergeCell,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getTableRowIndexFromTableCellNode,
  $getTableColumnIndexFromTableCellNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableNode,
} from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

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

/**
 * Helper function to check if a cell contains only an empty paragraph
 * @returns {boolean} Whether the cell contains only an empty paragraph
 */
function $cellContainsEmptyParagraph(cell) {
  if (!cell || cell.getChildrenSize() !== 1) return false;

  const firstChild = cell.getFirstChild();
  if (!firstChild) return false;

  // Check if it's a paragraph node and if it has an isEmpty method
  if (firstChild.getType() === 'paragraph' && typeof firstChild.isEmpty === 'function') return firstChild.isEmpty();

  // Fallback check: if it has no children, consider it empty
  return firstChild.getChildrenSize ? firstChild.getChildrenSize() === 0 : false;
}

// Helper function to select the last descendant of a node
function $selectLastDescendant(node) {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) lastDescendant.select();
  else if ($isElementNode(lastDescendant)) lastDescendant.selectEnd();
  else if (lastDescendant !== null) lastDescendant.selectNext();
}

/**
 * Hook that provides table cell merging and unmerging functionality
 * @param {Object} curSelection - Object of current table cells
 * @returns {Object} Object containing merge cell methods and state
 */
export default function useTableActions(curSelection, cellNode) {
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [editor] = useLexicalComposerContext();

  // Update merge/unmerge state based on current selection
  useEffect(
    () =>
      editor.getEditorState().read(() => {
        const nodes = curSelection?.getNodes();
        const tableCells = nodes?.filter($isTableCellNode);

        setCanMergeCells(tableCells?.length > 1);
        setCanUnmergeCell($canUnmerge(curSelection));
      }),
    [editor, curSelection]
  );

  /**
   * Merges selected table cells
   */
  const mergeTableCellsAtSelection = useCallback(() => {
    if (!canMergeCells) return;

    editor.update(() => {
      if ($isTableSelection(curSelection)) {
        // Get all selected cells and compute the total area
        const nodes = curSelection.getNodes();
        const tableCells = nodes.filter($isTableCellNode);

        // Find the table node
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCells[0]);
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
      }
    });
  }, [editor, curSelection, canMergeCells]);

  // Unmerges a merged table cell
  const unmergeTableCellsAtSelection = useCallback(() => {
    if ($isRangeSelection(curSelection)) {
      editor.update(() => {
        const clonedSelection = curSelection.clone();
        $setSelection(clonedSelection);
        $unmergeCell();
      });
    }
  }, [editor, curSelection]);

  const insertTableRowAtSelection = useCallback(
    (direction) => {
      setTimeout(() => {
        editor.update(() => {
          try {
            $insertTableRow__EXPERIMENTAL(direction);
          } catch (error) {
            console.error('Error inserting row:', error);
          }
        });
      }, 0);
    },
    [editor]
  );

  const insertTableColumnAtSelection = useCallback(
    (direction) => {
      setTimeout(() => {
        editor.update(() => {
          try {
            $insertTableColumn__EXPERIMENTAL(direction);
          } catch (error) {
            console.error('Error inserting column:', error);
          }
        });
      }, 0);
    },
    [editor]
  );

  const deleteTableColumnAtSelection = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        try {
          $deleteTableColumn__EXPERIMENTAL();
        } catch (error) {
          console.error('Error deleting column:', error);
        }
      });
    }, 0);
  }, [editor]);

  const deleteTableRowAtSelection = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        try {
          $deleteTableRow__EXPERIMENTAL();
        } catch (error) {
          console.error('Error deleting row:', error);
        }
      });
    }, 0);
  }, [editor]);

  const deleteTableAtSelection = useCallback(() => {
    // Use setTimeout to ensure the menu is fully closed
    setTimeout(() => {
      editor.update(() => {
        try {
          // First approach: Use a fresh selection to find the table
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const currentCellNode = $getTableCellNodeFromLexicalNode(anchorNode);

            if (currentCellNode) {
              const tableNode = $getTableNodeFromLexicalNodeOrThrow(currentCellNode);
              tableNode.remove();
            }
          }
        } catch (error) {
          console.error('Error deleting table:', error);
        }
      });
    }, 0);
  }, [editor]);

  const alignTableAction = useCallback(
    (align) => {
      editor.update(() => {
        const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (table.getType() === 'table' || table instanceof TableNode) {
          const writable = table.getWritable();
          writable.__alignment = align;
          table.setStyle(`justify-self: ${align}`);

          const dom = editor.getElementByKey(table.getKey());
          if (dom) dom.setAttribute('data-align', align);
        }
      });
    },
    [editor, cellNode]
  );

  const toggleTableRowIsHeader = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        try {
          // First attempt: Use the current selection
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const currentCellNode = $getTableCellNodeFromLexicalNode(anchorNode);

            if (currentCellNode) {
              const tableNode = $getTableNodeFromLexicalNodeOrThrow(currentCellNode);
              const currentRowIndex = $getTableRowIndexFromTableCellNode(currentCellNode);
              const tableRows = tableNode.getChildren();

              if (currentRowIndex >= 0 && currentRowIndex < tableRows.length) {
                const tableRow = tableRows[currentRowIndex];
                if ($isTableRowNode(tableRow)) {
                  // eslint-disable-next-line no-bitwise
                  const newStyle = currentCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;
                  tableRow.getChildren().forEach((tableCell) => {
                    if ($isTableCellNode(tableCell)) {
                      tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
                    }
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error toggling row header:', error);
        }
      });
    }, 0);
  }, [editor]);

  const toggleTableColumnIsHeader = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        try {
          // First attempt: Use the current selection
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const currentCellNode = $getTableCellNodeFromLexicalNode(anchorNode);

            if (currentCellNode) {
              const tableNode = $getTableNodeFromLexicalNodeOrThrow(currentCellNode);

              const currentColumnIndex = $getTableColumnIndexFromTableCellNode(currentCellNode);

              const tableRows = tableNode.getChildren();

              const newStyle = currentCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;

              tableRows.forEach((tableRow) => {
                if ($isTableRowNode(tableRow)) {
                  const tableCells = tableRow.getChildren();

                  if (currentColumnIndex < tableCells.length) {
                    const tableCell = tableCells[currentColumnIndex];

                    if ($isTableCellNode(tableCell)) {
                      tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
                    }
                  }
                }
              });
            }
          }
        } catch (error) {
          console.error('Error toggling column header:', error);
        }
      });
    }, 0);
  }, [editor]);

  return {
    mergeTableCellsAtSelection,
    unmergeTableCellsAtSelection,
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableColumnAtSelection,
    deleteTableAtSelection,
    alignTableAction,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
    canMergeCells,
    canUnmergeCell,
  };
}
