/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';

import styled from '@emotion/styled';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getTableNodeFromLexicalNodeOrThrow, $isTableCellNode } from '@lexical/table';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { $getNodeByKey } from 'lexical';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

const SliderContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const WidthContainer = styled.form`
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SubmitBtn = styled.button`
  width: fit-content;
  min-width: 100%;
  height: 30px;
  background-color: #336cbc;
  border: 2px solid #336cbc;
  color: #ffffff;
  &:focus-visible {
    outline-offset: 3px;
  }
`;

const WidthInput = styled.input`
  width: 6ch;
  text-align: center;
`;

function AlignTable() {
  return (
    <SliderContainer>
      Align table
      <ChevronRightIcon />
    </SliderContainer>
  );
}

function TableWidth() {
  return (
    <SliderContainer>
      Table width
      <ChevronRightIcon />
    </SliderContainer>
  );
}

export function Width({ cellNodeKey, allClose }) {
  const [editor] = useLexicalComposerContext();
  const [showMaxMsg, setShowMaxMsg] = useState(false);

  const getCurrentTableWidth = () => {
    let defaultWidth = 100;
    if (!cellNodeKey) return defaultWidth;

    try {
      editor.getEditorState().read(() => {
        const cellNode = $getNodeByKey(cellNodeKey);
        if (!cellNode || !$isTableCellNode(cellNode)) return;

        const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (table && table.getType() === 'table') {
          if (table.__width) {
            defaultWidth = table.__width;
          } else {
            const dom = editor.getElementByKey(table.getKey());
            if (dom) {
              const ds = dom.dataset?.widthPercent;
              if (ds && !Number.isNaN(parseInt(ds, 10))) {
                defaultWidth = parseInt(ds, 10);
              } else {
                const editorContainer = dom.closest('[data-lexical-editor]') || dom.parentElement;
                const containerRect = editorContainer?.getBoundingClientRect?.();
                if (containerRect?.width > 0) {
                  const tableRect = dom.getBoundingClientRect();
                  defaultWidth = Math.round((tableRect.width / containerRect.width) * 100);
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn('Error getting table width: ', error);
    }
    return defaultWidth;
  };

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { widthPercent: getCurrentTableWidth() },
    mode: 'onChange',
  });

  const widthPercent = watch('widthPercent');

  const onWidthChange = (e) => {
    const raw = e.target.value;

    if (raw === '') {
      setShowMaxMsg(false);
      setValue('widthPercent', '', { shouldValidate: true });
      return;
    }

    const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10) || 0;
    const clamped = Math.max(1, Math.min(100, n));

    setShowMaxMsg(n > 100);
    setValue('widthPercent', clamped, { shouldValidate: true });
    e.stopPropagation();
  };

  const applyWidth = (percent) => {
    if (!cellNodeKey) {
      console.warn('No cell node key provided');
      return;
    }

    editor.update(() => {
      try {
        const cellNode = $getNodeByKey(cellNodeKey);
        if (!cellNode || !$isTableCellNode(cellNode)) return;

        const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (table && table.getType() === 'table') {
          const existingAlignment = table.__alignment;
          const existingColumnWidths = table.__columnWidths;

          const writable = table.getWritable();
          if (existingAlignment) writable.__alignment = existingAlignment;
          if (existingColumnWidths) writable.__columnWidths = existingColumnWidths;

          writable.__width = percent;

          const dom = editor.getElementByKey(table.getKey());
          if (dom) {
            dom.style.width = `${percent}%`;
            dom.setAttribute('data-width-percent', String(percent));
          }
        }
      } catch (error) {
        console.warn('No table found for width adjustment', error);
      }
    });

    allClose();
  };

  const onSubmit = (data) => {
    if (data.widthPercent) {
      applyWidth(data.widthPercent);
    }
  };

  return (
    <WidthContainer>
      <InputContainer>
        <WidthInput
          id="widthPercent"
          type="number"
          aria-label="width percent"
          inputMode="numeric"
          min={1}
          max={100}
          {...register('widthPercent')}
          value={widthPercent || ''}
          onChange={onWidthChange}
        />
        <label htmlFor="widthPercent">%</label>
      </InputContainer>

      {showMaxMsg && (
        <div aria-live="polite" style={{ fontSize: 12, color: '#d32f2f', marginTop: 4 }}>
          Maximum width is 100%
        </div>
      )}

      <SubmitBtn
        type="button"
        id="updateWidthBtn"
        onClick={(e) => {
          e.preventDefault(); // Prevent the default form submission
          handleSubmit(onSubmit)(e); // Handle the form submission logic
        }}
        disabled={!widthPercent}>
        Submit
      </SubmitBtn>
    </WidthContainer>
  );
}

export function getMenuItems({ isStriped, isColumnsDisabled, actions }) {
  const {
    insertTableRowAtSelection,
    insertTableColumnAtSelection,
    deleteTableColumnAtSelection,
    deleteTableRowAtSelection,
    deleteTableAtSelection,
    toggleTableRowIsHeader,
    toggleTableColumnIsHeader,
    canMergeCells,
    canUnmergeCell,
    mergeTableCellsAtSelection,
    unmergeTableCellsAtSelection,
    alignTable,
    toggleRowStriping,
  } = actions;

  const cellMenuItems = {
    mainMenu: [
      {
        id: 'table-align',
        testId: 'table-align',
        text: <AlignTable />,
      },
      {
        id: 'table-width',
        testId: 'table-width',
        text: <TableWidth />,
      },
      {
        id: 'table-column-widths',
        testId: 'table-column-widths',
        text: 'Set column widths',
      },
      {
        id: 'table-delete-table',
        testId: 'table-delete-table',
        text: 'Delete table',
        onClick: deleteTableAtSelection,
      },
      { id: 'divider-1', type: 'divider', key: 'divider-1' },
      {
        id: 'table-merge-cells',
        testId: 'table-merge-cells',
        disabled: !canMergeCells,
        text: 'Merge cells',
        onClick: mergeTableCellsAtSelection,
      },
      {
        id: 'table-unmerge-cells',
        testId: 'table-unmerge-cells',
        disabled: !canUnmergeCell,
        text: 'Unmerge cells',
        onClick: unmergeTableCellsAtSelection,
      },
      { id: 'divider-2', type: 'divider', key: 'divider-2' },

      {
        id: 'table-insert-row-above',
        testId: 'table-insert-row-above',
        text: 'Insert row above',
        onClick: () => insertTableRowAtSelection(false),
      },
      {
        id: 'table-insert-row-below',
        testId: 'table-insert-row-below',
        text: 'Insert row below',
        onClick: () => insertTableRowAtSelection(true),
      },
      { id: 'divider-3', type: 'divider', key: 'divider-3' },
      {
        id: 'table-insert-column-left',
        testId: 'table-insert-column-left',
        text: 'Insert column left',
        disabled: isColumnsDisabled,
        onClick: () => insertTableColumnAtSelection(false),
      },
      {
        id: 'table-insert-column-right',
        testId: 'table-insert-column-right',
        text: 'Insert column right',
        disabled: isColumnsDisabled,
        onClick: () => insertTableColumnAtSelection(true),
      },
      { id: 'divider-4', type: 'divider', key: 'divider-4' },
      {
        id: 'table-delete-column',
        testId: 'table-delete-column',
        text: 'Delete column',
        onClick: deleteTableColumnAtSelection,
      },
      {
        id: 'table-delete-row',
        testId: 'table-delete-row',
        text: 'Delete row',
        onClick: deleteTableRowAtSelection,
      },
      { id: 'divider-5', type: 'divider', key: 'divider-5 ' },
      {
        id: 'table-toggle-row-header',
        testId: 'table-toggle-row-header',
        text: 'Toggle row header',
        onClick: toggleTableRowIsHeader,
      },
      {
        id: 'table-toggle-column-header',
        testId: 'table-toggle-column-header',
        text: 'Toggle column header',
        onClick: toggleTableColumnIsHeader,
      },
      {
        id: 'table-toggle-row-stripping',
        testId: 'table-toggle-row-stripping',
        text: `Toggle row striping ${isStriped ? 'off' : 'on'}`,
        onClick: toggleRowStriping,
      },
    ],
    alignMenu: [
      {
        id: 'align-table-left',
        align: 'left',
        testId: 'align-table-left',
        text: 'Align table left',
        onClick: () => alignTable('left'),
      },
      {
        id: 'align-table-center',
        align: 'center',
        testId: 'align-table-center',
        text: 'Align table center',
        onClick: () => alignTable('center'),
      },
      {
        id: 'align-table-right',
        align: 'right',
        testId: 'align-table-right',
        text: 'Align table right',
        onClick: () => alignTable('right'),
      },
    ],
  };
  return { cellMenuItems };
}

Width.propTypes = {
  cellNodeKey: PropTypes.string,
  allClose: PropTypes.func.isRequired,
};
