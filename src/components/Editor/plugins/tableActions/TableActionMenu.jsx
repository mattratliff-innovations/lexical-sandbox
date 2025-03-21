/* eslint-disable react/prop-types */
/* eslint-disable react/require-default-props */
import React, {
  useEffect, useCallback, useState, useRef, memo,
} from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  // eslint-disable-next-line camelcase
  $deleteTableColumn__EXPERIMENTAL,
  // eslint-disable-next-line camelcase
  $deleteTableRow__EXPERIMENTAL,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  // eslint-disable-next-line camelcase
  $insertTableColumn__EXPERIMENTAL,
  // eslint-disable-next-line camelcase
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

const useTableActions = (editor, tableCellNode, onClose) => {
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

  return {
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableColumnAtSelection,
    deleteTableAtSelection,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
  };
};

const useKeyboardNavigation = (activeIndex, executeAction) => {
  const keysPressedRef = useRef(new Set());

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    keysPressedRef.current.add(key);

    switch (key) {
      case 'ArrowUp':
        if (activeIndex > 1) {
          event.preventDefault();
          document.getElementById(`table-actions-${activeIndex}`).style.backgroundColor = '#ffffff';
          // eslint-disable-next-line no-plusplus, no-param-reassign
          document.getElementById(`table-actions-${--activeIndex}`).style.backgroundColor = '#eeeeee';
        }
        break;
      case 'ArrowDown':
        if (activeIndex === 0) {
          event.preventDefault();
          // eslint-disable-next-line no-plusplus, no-param-reassign
          document.getElementById(`table-actions-${++activeIndex}`).style.backgroundColor = '#eeeeee';
        } else if (activeIndex < 9) {
          event.preventDefault();
          document.getElementById(`table-actions-${activeIndex}`).style.backgroundColor = '#ffffff';
          // eslint-disable-next-line no-plusplus, no-param-reassign
          document.getElementById(`table-actions-${++activeIndex}`).style.backgroundColor = '#eeeeee';
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (activeIndex > 0) {
          executeAction(activeIndex);
        }
        break;
      default:
        break;
    }
  }, [activeIndex, executeAction]);

  useEffect(() => {
    const handleKeyUp = (event) => {
      keysPressedRef.current.delete(event.key);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown]);

  return keysPressedRef.current;
};

const TableActionMenu = ({
  onClose,
  tableCellNode: initialTableCellNode,
  contextRef,
}) => {
  const [editor] = useLexicalComposerContext();
  const activeIndex = 0;
  const [tableCellNode] = useState(initialTableCellNode);
  const dropDownRef = useRef(null);

  const getIsDisabled = useCallback(() => {
    let count = 0;
    editor.read(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      count = tableNode.getColumnCount();
    });
    return count > MAX_COLUMNS - 1 ? 'disabled' : '';
  });

  const {
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableColumnAtSelection,
    deleteTableAtSelection,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
  } = useTableActions(editor, tableCellNode, onClose);

  // calculate the position of the menu
  useEffect(() => {
    const calculatePosition = () => {
      const menuButton = contextRef.current;
      const dropDown = dropDownRef.current;
      const rootElement = editor.getRootElement();

      if (!menuButton || !dropDown || !rootElement) {
        return;
      }

      const MARGIN = 5;
      const {
        right, left, top, bottom,
      } = menuButton.getBoundingClientRect();
      const rootRect = rootElement.getBoundingClientRect();
      const dropDownRect = dropDown.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;

      // Calculate left position
      let leftPosition = right + MARGIN;
      const exceedsRight = leftPosition + dropDownRect.width > Math.min(window.innerWidth, rootRect.right);

      if (exceedsRight) {
        const alternateLeft = left - dropDownRect.width - MARGIN;
        leftPosition = Math.max(MARGIN, alternateLeft) + scrollX;
      }

      // Calculate top position
      let topPosition = top;
      const exceedsBottom = topPosition + dropDownRect.height > window.innerHeight;

      if (exceedsBottom) {
        const alternateTop = bottom - dropDownRect.height;
        topPosition = Math.max(MARGIN, alternateTop) + scrollY;
      }

      // Apply positions
      Object.assign(dropDown.style, {
        opacity: '1',
        left: `${leftPosition}px`,
        top: `${topPosition + scrollY}px`,
      });
    };

    // Initial position calculation
    calculatePosition();

    // Recalculate on resize
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [contextRef, dropDownRef, editor]);

  // handle keyboard actions
  useKeyboardNavigation(activeIndex, (index) => {
    const actions = {
      [ACTIONS.INSERT_ROW_ABOVE]: () => insertTableRowAtSelection(false),
      [ACTIONS.INSERT_ROW_BELOW]: () => insertTableRowAtSelection(true),
      [ACTIONS.INSERT_COLUMN_LEFT]: () => insertTableColumnAtSelection(false),
      [ACTIONS.INSERT_COLUMN_RIGHT]: () => insertTableColumnAtSelection(true),
      [ACTIONS.DELETE_COLUMN]: deleteTableColumnAtSelection,
      [ACTIONS.DELETE_ROW]: deleteTableRowAtSelection,
      [ACTIONS.DELETE_TABLE]: deleteTableAtSelection,
      [ACTIONS.TOGGLE_ROW_HEADER]: toggleTableRowIsHeader,
      [ACTIONS.TOGGLE_COLUMN_HEADER]: toggleTableColumnIsHeader,
    };
    actions[index]?.();
  });

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

  const menu = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
    <div
      className="table-actions-dropdown"
      id="table-actions"
      ref={dropDownRef}
      role="menu"
      aria-label="Table actions"
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => (item.type === 'divider' ? (
        <Divider key={`divider-${item.id}`} />
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

  return createPortal(menu, document.body);
};

export default memo(TableActionMenu);
