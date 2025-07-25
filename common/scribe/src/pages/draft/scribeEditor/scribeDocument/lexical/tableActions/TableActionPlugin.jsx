import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Menu, MenuItem, Divider } from '@mui/material';
import { $getTableNodeFromLexicalNodeOrThrow } from '@lexical/table';
import useTableCellNode from './hooks/useTableCellNode';
import useTableActions from './hooks/useTableActions';
import useTableCellBtnCreation from './components/useTableCellBtnCreation';
import getMenuItems from './MenuItems';

// eslint-disable-next-line react/prop-types
function TableActionPlugin() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [secondAnchorEl, setSecondAnchorEl] = useState(null);
  const [curSelection, setCurSelection] = useState(null);
  const cellRef = useRef(null);
  const preCellRef = useRef(null);

  const [editor] = useLexicalComposerContext();
  const { tableCellDOMNode, tableCellNode } = useTableCellNode(setCurSelection);
  const tableActions = useTableActions(curSelection, tableCellNode);

  useTableCellBtnCreation(tableCellDOMNode, setAnchorEl, cellRef, preCellRef, setCurSelection);

  const open = Boolean(anchorEl);
  const secondOpen = Boolean(secondAnchorEl);
  const handleClose = () => setAnchorEl(null);
  const handleSecondClose = () => setSecondAnchorEl(null);

  const columnAddLimit = useCallback(() => {
    let count = 0;
    try {
      editor.read(() => {
        if (tableCellNode) {
          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          count = tableNode.getColumnCount();
        }
      });
    } catch (error) {
      console.error('Error checking column count:', error);
    }

    return count > 8 - 1;
  }, [editor, tableCellNode]);

  const { mainMenuItems, alignMenuItems } = useMemo(
    () =>
      getMenuItems({
        isColumnsDisabled: columnAddLimit(),
        actions: tableActions,
      }),
    [columnAddLimit, tableActions, anchorEl]
  );

  const curTableAligned = (align) => {
    let disabled = false;
    editor.getEditorState().read(() => {
      const table = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

      if (table && table.getType() === 'table') {
        const curAlignment = table.__alignment || 'left'
        disabled = curAlignment === align;
      }
    })
    return disabled;
  }

  const handleMenuAction = (action, id, evt) => {
    if (id !== 'table-align') {
      handleClose();
      handleSecondClose();
      action();
    } else setSecondAnchorEl(evt.target);
  };

  // This detects when the menu closes to bring focus back to the table cell node on Tab, Enter and Escape keys.
  useEffect(() => {
    if (tableCellNode && !open) editor.update(() => tableCellNode.select());
  }, [anchorEl]);

  // This detects Control + Shift to move focus to the menu button inside table cell node.
  useEffect(() => {
    const pressedKeys = new Set();

    const handleKeyDown = (evt) => {
      pressedKeys.add(evt.key);
      if (pressedKeys.has('Shift') && pressedKeys.has('Control')) cellRef.current.focus();
    };

    const handleKeyUp = (evt) => pressedKeys.delete(evt.key);

    if (cellRef.current) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      return document.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    tableCellDOMNode && (
      <>
        <Menu className="table-actions-dropdown" id="table-cell-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
          {mainMenuItems?.map((item) => {
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
          anchorEl={secondAnchorEl}
          open={secondOpen}
          onClose={handleSecondClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          {alignMenuItems?.map((item) => (
            <MenuItem
              key={item.id}
              onClick={(evt) => handleMenuAction(item.onClick, item.id, evt)}
              disabled={curTableAligned(item.align)}
              data-test-id={item.testId}>
              {item.text}
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  );
}
export default memo(TableActionPlugin);
