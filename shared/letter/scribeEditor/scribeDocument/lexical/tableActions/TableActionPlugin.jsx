import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getTableNodeFromLexicalNodeOrThrow, $isTableCellNode } from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import { Divider, Menu, MenuItem, Popover } from '@mui/material';
import { $getNodeByKey } from 'lexical';

import ColumnWidthsModal from './ColumnWidthsModal';
import useTableCellBtnCreation from './components/useTableCellBtnCreation';
import useTableActions from './hooks/useTableActions';
import useTableCellNode from './hooks/useTableCellNode';
import { getMenuItems, Width } from './MenuItems';

function TableActionPlugin() {
  const [mainAnchorEl, setMainAnchorEl] = useState(null);
  const [alignMenuAnchorEl, setAlignMenuAnchorEl] = useState(null);
  const [widthMenuAnchorEl, setWidthMenuAnchorEl] = useState(null);
  const [isColumnWidthsOpen, setIsColumnWidthsOpen] = useState(false);
  const [numOfCols, setNumOfCols] = useState(null);

  const [curSelection, setCurSelection] = useState(null);
  const cellRef = useRef(null);
  const preCellRef = useRef(null);

  // Store the node KEY instead of the node itself
  const [tableCellNodeKey, setTableCellNodeKey] = useState(null);

  const [editor] = useLexicalComposerContext();
  const isEditable = editor.isEditable();

  const { tableCellDOMNode } = useTableCellNode((selection) => {
    // Defer state update to avoid render-phase updates
    setTimeout(() => setCurSelection(selection), 0);
  });

  const tableActions = useTableActions(curSelection, tableCellNodeKey);

  useTableCellBtnCreation(isEditable ? tableCellDOMNode : null, setMainAnchorEl, cellRef, preCellRef, (selection) => {
    // Defer to avoid render-phase updates
    setTimeout(() => setCurSelection(selection), 0);
  });

  const mainMenuOpen = Boolean(mainAnchorEl);
  const alignMenuOpen = Boolean(alignMenuAnchorEl);
  const widthMenuOpen = Boolean(widthMenuAnchorEl);

  const handleMainMenuClose = () => setMainAnchorEl(null);
  const handleAlignMenuClose = () => setAlignMenuAnchorEl(null);
  const handleWidthMenuClose = () => setWidthMenuAnchorEl(null);

  // Get fresh node reference every time we need it
  const getTableCellNode = useCallback(() => {
    let node = null;
    editor.getEditorState().read(() => {
      if (tableCellNodeKey) {
        const cellNode = $getNodeByKey(tableCellNodeKey);
        if ($isTableCellNode(cellNode)) {
          node = cellNode;
        }
      }
    });
    return node;
  }, [editor, tableCellNodeKey]);

  const columnAddLimit = useCallback(() => {
    let count = 0;
    try {
      editor.getEditorState().read(() => {
        const tableCellNode = getTableCellNode();
        if (tableCellNode) {
          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          count = tableNode.getColumnCount();
        }
      });
    } catch (error) {
      console.error('Error checking column count:', error);
    }

    return count > 8 - 1;
  }, [editor, getTableCellNode]);

  const { cellMenuItems } = useMemo(() => {
    let isStriped = false;
    let tableNode = null;

    try {
      editor.getEditorState().read(() => {
        const tableCellNode = getTableCellNode();
        if (tableCellNode) {
          tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          isStriped = tableNode.getRowStriping(); // Get whether the table is stripped
        }
      });
    } catch (error) {
      console.error('Error accessing tableNode or row striping:', error);
    }

    return getMenuItems({
      isStriped,
      isColumnsDisabled: columnAddLimit(),
      actions: tableActions,
    });
  }, [columnAddLimit, tableActions, editor, getTableCellNode]);

  const curTableAligned = useCallback(
    (align) => {
      let disabled = false;
      try {
        editor.getEditorState().read(() => {
          const tableCellNode = getTableCellNode();
          if (tableCellNode) {
            const table = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

            if (table && table.getType() === 'table') {
              const curAlignment = table.__alignment || 'left';
              disabled = curAlignment === align;
            }
          }
        });
      } catch (error) {
        console.error('Error checking alignment:', error);
      }
      return disabled;
    },
    [editor, getTableCellNode]
  );

  const handleMenuAction = useCallback(async (action, id, evt) => {
    switch (id) {
      case 'width-input':
        break;
      case 'table-align':
        setAlignMenuAnchorEl(evt.target);
        break;
      case 'table-width':
        setWidthMenuAnchorEl(evt.target);
        break;
      case 'table-column-widths':
        setIsColumnWidthsOpen(true);
        // Defer close to avoid state update during render
        setTimeout(() => handleMainMenuClose(), 0);
        break;
      default:
        // Defer all closes to avoid state update during render
        setTimeout(() => {
          handleMainMenuClose();
          handleAlignMenuClose();
          handleWidthMenuClose();
        }, 0);
        action();
    }
  }, []);

  const allClose = useCallback(() => {
    setTimeout(() => {
      handleMainMenuClose();
      handleAlignMenuClose();
      handleWidthMenuClose();
    }, 0);
  }, []);

  // Update tableCellNodeKey when selection changes
  useEffect(() => {
    if (curSelection) {
      editor.getEditorState().read(() => {
        const anchorNode = $getNodeByKey(curSelection?.anchor?.key);
        if (!anchorNode) return; // Stop here if the node is dead

        const cellNode = $findMatchingParent(anchorNode, $isTableCellNode);
        if (cellNode) {
          setTableCellNodeKey(cellNode.getKey());

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
          setNumOfCols(tableNode.getColumnCount());
        }
      });
    }
  }, [curSelection, editor]);

  // Bring focus back to table cell when menu closes
  useEffect(() => {
    if (!mainMenuOpen && tableCellNodeKey) {
      editor.update(() => {
        const tableCellNode = $getNodeByKey(tableCellNodeKey);
        if (tableCellNode && $isTableCellNode(tableCellNode)) {
          tableCellNode.select();
        }
      });
    }
  }, [mainMenuOpen, tableCellNodeKey, editor]);

  // Handle Control + Shift to focus menu button
  useEffect(() => {
    const pressedKeys = new Set();

    const handleKeyDown = (evt) => {
      pressedKeys.add(evt.key);
      if (pressedKeys.has('Shift') && pressedKeys.has('Control')) {
        cellRef.current?.focus();
      }
    };

    const handleKeyUp = (evt) => pressedKeys.delete(evt.key);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!isEditable) {
    return null;
  }

  return (
    tableCellDOMNode && (
      <>
        <Menu anchorEl={mainAnchorEl} open={mainMenuOpen} onClose={handleMainMenuClose} className="table-actions-dropdown" id="table-cell-menu">
          {cellMenuItems?.mainMenu.map((item) => {
            if (item?.type === 'divider') return <Divider key={item.id} />;

            return (
              <MenuItem
                key={item.id}
                onClick={(evt) => handleMenuAction(item.onClick, item.id, evt)}
                disabled={item.disabled}
                data-test-id={item.testId}>
                {item.text}
              </MenuItem>
            );
          })}
        </Menu>

        <Menu
          anchorEl={alignMenuAnchorEl}
          open={alignMenuOpen}
          className="table-actions-dropdown"
          onClose={handleAlignMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          {cellMenuItems?.alignMenu.map((item) => (
            <MenuItem
              key={item.id}
              onClick={(evt) => handleMenuAction(item.onClick, item.id, evt)}
              disabled={curTableAligned(item.align)}
              data-test-id={item.testId}>
              {item.text}
            </MenuItem>
          ))}
        </Menu>

        <Popover
          anchorEl={widthMenuAnchorEl}
          open={widthMenuOpen}
          className="table-actions-dropdown"
          onClose={handleWidthMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          <Width cellNodeKey={tableCellNodeKey} allClose={allClose} />
        </Popover>

        <ColumnWidthsModal isOpen={isColumnWidthsOpen} setIsOpen={setIsColumnWidthsOpen} numOfCols={numOfCols} cellNodeKey={tableCellNodeKey} />
      </>
    )
  );
}

TableActionPlugin.propTypes = {};

export default memo(TableActionPlugin);
