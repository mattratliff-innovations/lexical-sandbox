import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './TablePlugin.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setSelection } from 'lexical';
import { INSERT_TABLE_COMMAND } from '@lexical/table';

const GRID_SIZE = 8;

function TablePlugin({ isTablePoppedUp, setIsTablePoppedUp }) {
  const [editor] = useLexicalComposerContext();
  const savedSelectionRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const popupRef = useRef(null);
  const gridSize = 8;

  const closePopup = () => {
    setIsTablePoppedUp(false);
  };

  const createTable = (rows, cols) => {
    editor.update(() => {
      const savedSelection = savedSelectionRef.current;
      if (savedSelection) {
        $setSelection(savedSelection);
      }
      console.log('inserting table command')
      console.log(editor);
      editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: cols, rows });
      editor.focus();
    });
    closePopup();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTablePoppedUp]);

  const selectGridCells = (index) => {
    const rowSize = gridSize;
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;
    setSelectedRows(row + 1);
    setSelectedCols(col + 1);
  };

  const handleMouseOver = (index) => {
    selectGridCells(index);
  };

  const handleCellClick = () => {
    createTable(selectedRows, selectedCols);
  };

  const handleKeyDown = (event, index) => {
    const newIndex = index;

    const keyActions = {
      Enter: () => ({ action: 'select', newIndex }),
      ' ': () => ({ action: 'select', newIndex }),
      ArrowUp: () => ({ action: 'move', newIndex: Math.max(0, index - GRID_SIZE) }),
      ArrowDown: () => ({ action: 'move', newIndex: Math.min(GRID_SIZE * GRID_SIZE - 1, index + GRID_SIZE) }),
      ArrowLeft: () => ({ action: 'move', newIndex: Math.max(0, index - 1) }),
      ArrowRight: () => ({ action: 'move', newIndex: Math.min(GRID_SIZE * GRID_SIZE - 1, index + 1) }),
      Escape: () => ({ action: 'escape' }),
      Tab: () => ({ action: 'prevent' }),
    };

    const keyAction = keyActions[event.key];
    if (!keyAction) return;

    event.preventDefault();
    const result = keyAction();

    if (result.action === 'escape') {
      closePopup();
    }
    if (result.action === 'select') {
      handleCellClick();
    }
    if (result.action === 'move') {
      selectGridCells(result.newIndex);
      const nextCell = document.querySelector(`[data-index="${result.newIndex}"]`);
      nextCell?.focus();
    }
  };

  return (
    isTablePoppedUp && (
      <div className="lexical-table-popup" ref={popupRef}>
        <div
          className="lexical-table-popup-grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 15px)`,
            gridTemplateRows: `repeat(${gridSize}, 15px)`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            return (
              <div
                key={`grid-${row}-${col}`}
                data-index={index}
                aria-label={`Select row ${row + 1}, column ${col + 1}`}
                className={`lexical-table-popup-grid-cell ${
                  row < selectedRows && col < selectedCols ? 'lexical-table-popup-selected' : ''
                }`}
                onMouseOver={() => handleMouseOver(index)}
                onFocus={() => handleMouseOver(index)}
                onClick={handleCellClick}
                onKeyDown={(e) => handleKeyDown(e, index)}
                role="button"
                tabIndex={0}
              />
            );
          })}
        </div>
        <div style={{ textAlign: 'center', padding: 0, margin: 0 }}>
          {selectedRows}
          {' '}
          X
          {selectedCols}
        </div>
      </div>
    )
  );
}

TablePlugin.propTypes = {
  isTablePoppedUp: PropTypes.bool.isRequired,
  setIsTablePoppedUp: PropTypes.func.isRequired,
};

export default TablePlugin;
