import React, { memo, useCallback } from 'react';
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableRowNode,
  TableCellHeaderStates,
} from '@lexical/table';

const MAX_COLUMNS = 8;

const ACTIONS = {
  INSERT_ROW_ABOVE: 1,
  INSERT_ROW_BELOW: 2,
  INSERT_COLUMN_LEFT: 3,
  INSERT_COLUMN_RIGHT: 4,
  DELETE_COLUMN: 5,
  DELETE_ROW: 6,
  DELETE_TABLE: 7,
  TOGGLE_ROW_HEADER: 8,
  TOGGLE_COLUMN_HEADER: 9,
};

const MenuButton = memo(({
  id,
  onClick,
  testId,
  children,
  disabled,
  text,
}) => {
  const className = disabled ? 'item-disabled' : 'item';
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      id={`table-actions-${id}`}
      onMouseDown={onClick}
      data-test-id={testId}
      role="menuitem"
      aria-label={text}
      tabIndex={0}
    >
      <span className="text">{children}</span>
    </button>
  );
});

const Divider = memo(() => (
  <hr aria-orientation="horizontal" />
));

// TableCellActionMenu component now takes editor and tableCellNode directly
const TableCellActionMenu = ({
  tableCellNode,
  editor,
  onClose,
}) => {
  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        tableNode.markDirty();
      }
      const rootNode = editor._editorState._nodeMap.get('root');
      rootNode.selectStart();
    });
  }, [editor, tableCellNode]);

  const insertTableRowAtSelection = useCallback((shouldInsertAfter) => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(shouldInsertAfter);
      onClose();
    });
  }, [editor, onClose]);

  const insertTableColumnAtSelection = useCallback((shouldInsertAfter) => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(shouldInsertAfter);
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
      const tableRows = tableNode.getChildren();

      if (tableRowIndex >= 0 && tableRowIndex < tableRows.length) {
        const tableRow = tableRows[tableRowIndex];
        if ($isTableRowNode(tableRow)) {
          // eslint-disable-next-line no-bitwise
          const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;
          tableRow.getChildren().forEach((tableCell) => {
            if ($isTableCellNode(tableCell)) {
              tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
            }
          });
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
      const tableRows = tableNode.getChildren();

      // eslint-disable-next-line no-bitwise
      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;
      tableRows.forEach((tableRow) => {
        if ($isTableRowNode(tableRow)) {
          const tableCells = tableRow.getChildren();
          if (tableColumnIndex < tableCells.length) {
            const tableCell = tableCells[tableColumnIndex];
            if ($isTableCellNode(tableCell)) {
              tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
            }
          }
        }
      });
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const getIsDisabled = useCallback(() => {
    let count = 0;
    editor.read(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      count = tableNode.getColumnCount();
    });
    return count > MAX_COLUMNS - 1;
  }, [editor, tableCellNode]);

  const menuItems = [
    {
      id: ACTIONS.INSERT_ROW_ABOVE,
      testId: 'table-insert-row-above',
      disabled: false,
      onClick: () => insertTableRowAtSelection(false),
      text: 'Insert row above',
    },
    {
      id: ACTIONS.INSERT_ROW_BELOW,
      testId: 'table-insert-row-below',
      disabled: false,
      onClick: () => insertTableRowAtSelection(true),
      text: 'Insert row below',
    },
    {
      type: 'divider',
      key: 'divider-1',
    },
    {
      id: ACTIONS.INSERT_COLUMN_LEFT,
      testId: 'table-insert-column-left',
      disabled: getIsDisabled(),
      onClick: () => insertTableColumnAtSelection(false),
      text: 'Insert column left',
    },
    {
      id: ACTIONS.INSERT_COLUMN_RIGHT,
      testId: 'table-insert-column-right',
      disabled: getIsDisabled(),
      onClick: () => insertTableColumnAtSelection(true),
      text: 'Insert column right',
    },
    {
      type: 'divider',
      key: 'divider-2',
    },
    {
      id: ACTIONS.DELETE_COLUMN,
      testId: 'table-delete-column',
      disabled: false,
      onClick: () => deleteTableColumnAtSelection(),
      text: 'Delete column',
    },
    {
      id: ACTIONS.DELETE_ROW,
      testId: 'table-delete-row',
      disabled: false,
      onClick: () => deleteTableRowAtSelection(),
      text: 'Delete row',
    },
    {
      id: ACTIONS.DELETE_TABLE,
      testId: 'table-delete-table',
      disabled: false,
      onClick: () => deleteTableAtSelection(),
      text: 'Delete table',
    },
    {
      type: 'divider',
      key: 'divider-3',
    },
    {
      id: ACTIONS.TOGGLE_ROW_HEADER,
      testId: 'table-toggle-row-header',
      disabled: false,
      onClick: () => toggleTableRowIsHeader(),
      text: 'Toggle row header',
    },
    {
      id: ACTIONS.TOGGLE_COLUMN_HEADER,
      testId: 'table-toggle-column-header',
      disabled: false,
      onClick: () => toggleTableColumnIsHeader(),
      text: 'Toggle column header',
    },
  ];

  return (
    <div
      className="table-actions-dropdown"
      id="table-actions"
      role="menu"
      aria-label="Table actions"
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => (item.type === 'divider' ? (
        <Divider key={item.key} />
      ) : (
        <MenuButton
          key={item.id}
          id={item.id}
          onClick={item.onClick}
          testId={item.testId}
          disabled={item.disabled}
          text={item.text}
        >
          {item.text}
        </MenuButton>
      )))}
    </div>
  );
};

export default memo(TableCellActionMenu);