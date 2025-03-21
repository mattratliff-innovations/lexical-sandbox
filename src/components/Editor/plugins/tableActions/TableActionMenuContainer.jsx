/* eslint-disable jsx-a11y/control-has-associated-label */
// eslint-disable-next-line react/prop-types
import React, {
  useCallback, useEffect, useRef, useState, memo,
} from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getTableCellNodeFromLexicalNode,
} from '@lexical/table';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import TableActionMenu from './TableActionMenu';

const useTableCellNode = (editor) => {
  const [tableCellNode, setTableCellNode] = useState(null);

  const moveMenu = useCallback(() => {
    const selection = $getSelection();
    const nativeSelection = window.getSelection();
    const { activeElement } = document;
    const rootElement = editor.getRootElement();

    if (!selection || !rootElement || !nativeSelection) {
      setTableCellNode(null);
      return;
    }

    if ($isRangeSelection(selection)
        && rootElement.contains(nativeSelection.anchorNode)) {
      const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());

      if (!cellNode) {
        setTableCellNode(null);
        return;
      }

      const cellNodeDOM = editor.getElementByKey(cellNode.getKey());
      if (!cellNodeDOM) {
        setTableCellNode(null);
        return;
      }

      setTableCellNode(cellNode);
    } else if (!activeElement) {
      setTableCellNode(null);
    }
  }, [editor]);

  useEffect(() => editor.registerUpdateListener(() => {
    editor.getEditorState().read(() => {
      moveMenu();
    });
  }), [editor, moveMenu]);

  return tableCellNode;
};

const useMenuPosition = (menuButtonRef, tableCellNode, editor, anchorElem) => {
  useEffect(() => {
    const menuButton = menuButtonRef.current;
    if (!menuButton || !tableCellNode) return;

    const tableCellDOM = editor.getElementByKey(tableCellNode.getKey());
    if (!tableCellDOM) {
      menuButton.style.opacity = '0';
      menuButton.style.transform = 'translate(-10000px, -10000px)';
      return;
    }

    const calculatePosition = () => {
      const tableCellRect = tableCellDOM.getBoundingClientRect();
      const menuRect = menuButton.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();

      const zoomLevel = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;

      let top = tableCellRect.top - anchorRect.top + 8;
      let left = tableCellRect.right - menuRect.width - 3 - anchorRect.left;

      // Adjust for zoom levels
      if (zoomLevel <= 1.0) {
        top *= 0.69;
        left *= 0.69;
      } else if (zoomLevel <= 1.1) {
        top *= 0.74;
        left *= 0.74;
      } else if (zoomLevel <= 1.15) {
        top *= 0.79;
        left *= 0.79;
      } else if (zoomLevel <= 1.25) {
        top *= 0.83;
        left *= 0.83;
      } else {
        top = tableCellRect.top - anchorRect.top + 6;
      }

      return { top, left };
    };

    const position = calculatePosition();
    menuButton.style.opacity = '1';
    menuButton.style.transform = `translate(${position.left}px, ${position.top}px)`;

    const handleResize = () => {
      const newPosition = calculatePosition();
      menuButton.style.transform = `translate(${newPosition.left}px, ${newPosition.top}px)`;
    };

    window.addEventListener('resize', handleResize);
    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, [menuButtonRef, tableCellNode, editor, anchorElem]);
};

const useKeyboardShortcuts = (setIsMenuOpen) => {
  const keysPressedRef = useRef(new Set());

  useEffect(() => {
    const handleKeyDown = (event) => {
      keysPressedRef.current.add(event.key);

      if (keysPressedRef.current.has('Control')
          && keysPressedRef.current.has('Shift')) {
        const chevron = document.getElementById('chevron-down');
        if (chevron) {
          chevron.focus();
          event.preventDefault();
        }
      }

      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const handleKeyUp = (event) => {
      keysPressedRef.current.delete(event.key);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsMenuOpen]);
};

// eslint-disable-next-line react/prop-types
const ChevronButton = memo(({ onClick, menuRootRef }) => (
  <button
    type="button"
    data-testid="chevron-down"
    id="chevron-down"
    aria-label="Activate table actions"
    tabIndex={0}
    className="table-cell-action-button chevron-down"
    onClick={onClick}
    ref={menuRootRef}
  >
    <i className="chevron-down" />
  </button>
));

// eslint-disable-next-line react/prop-types
function TableCellActionMenuContainer({ anchorElem, cellMerge }) {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef(null);
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tableCellNode = useTableCellNode(editor);
  useMenuPosition(menuButtonRef, tableCellNode, editor, anchorElem);
  useKeyboardShortcuts(setIsMenuOpen);

  // Close menu when cell changes
  const prevTableCellRef = useRef(tableCellNode);
  useEffect(() => {
    if (prevTableCellRef.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellRef.current = tableCellNode;
  }, [tableCellNode]);

  if (!tableCellNode) return null;

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
      <ChevronButton
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        menuRootRef={menuRootRef}
      />
      {isMenuOpen && (
        <TableActionMenu
          contextRef={menuRootRef}
          setIsMenuOpen={setIsMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          tableCellNode={tableCellNode}
          cellMerge={cellMerge}
        />
      )}
    </div>
  );
}

export default memo(TableCellActionMenuContainer);
