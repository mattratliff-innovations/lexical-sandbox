/* eslint-disable no-underscore-dangle */
import React, { useEffect, useMemo, useState } from 'react';

import { DrButton } from '@druid/druid';
import styled from '@emotion/styled';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getTableNodeFromLexicalNodeOrThrow, $isTableCellNode } from '@lexical/table';
import { CheckCircle, Error, ViewColumn } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { $getNodeByKey } from 'lexical';
import PropTypes from 'prop-types';
import { useController, useForm, useWatch } from 'react-hook-form';

import { BtnContainer } from '../../../../../../components/designedComponents';
import { ScribeModal, XCloseBtn } from '../../../../../../components/ScribeComponents';
import { H1 } from '../../../../../../components/typography';
import { Body, HeaderContainer, HeaderLine } from '../../../../../util/modalDesignComponents';

const Note = styled.div`
  color: gray;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WidthInput = styled.input`
  width: 6ch;
  text-align: center;
`;

const IconBtnContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  background: #fff;
  border-radius: 10px;
`;

const IconBtnLabel = styled.label``;

const ColumnInputsContainer = styled.div`
  margin-bottom: 12px;
`;

const ColumnRows = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
`;

const TotalLine = styled.div`
  display: flex;
  margin-bottom: 16px;
  justify-content: center;
  gap: 24px;
`;

const PillContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Pill = styled.div`
  display: flex;
  gap: 8px;
  width: fit-content;
  min-width: 86px;
  align-items: center;
  border-radius: 12px;
  padding: 4px 8px;
  ${(props) => `background: ${props.color}`}
`;

function ToolTipBtn({ message }) {
  return (
    <Tooltip title={message}>
      <Error />
    </Tooltip>
  );
}

function StyledInput({ control, name, colNum, ...props }) {
  const {
    field: { onChange, onBlur: rhfOnBlur, value, ref },
  } = useController({ name, control });

  const [showMinMsg, setShowMinMsg] = useState(false);

  const handleChange = (e) => {
    const raw = e.target.value;

    // Allow empty while typing
    if (raw === '') {
      setShowMinMsg(false);
      onChange('');
      return;
    }

    // Strip non-digits and parse
    const parsed = parseInt(String(raw).replace(/[^\d]/g, ''), 10);

    if (Number.isNaN(parsed)) {
      setShowMinMsg(false);
      onChange('');
      return;
    }

    let clamped = parsed;
    if (clamped > 100) clamped = 100;

    // Show msg whenever current value is 1–9
    if (clamped > 0 && clamped < 10) {
      setShowMinMsg(true);
    } else {
      setShowMinMsg(false);
    }

    onChange(clamped);
  };

  const handleBlur = (e) => {
    let parsed = parseInt(String(value), 10);

    // If user leaves it between 1 and 9, bump to 10
    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 10) {
      parsed = 10;
      onChange(parsed);
    }

    setShowMinMsg(false);

    rhfOnBlur(e);
  };

  return (
    <InputContainer>
      <label htmlFor={`widthPercent${colNum}`}>Column {colNum}</label>
      <div>
        <WidthInput
          aria-label={`${value || 0} percent of column ${colNum}`}
          ref={ref}
          id={`widthPercent${colNum}`}
          type="number"
          min="1"
          max="100"
          value={value ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            borderColor: showMinMsg ? '#d32f2f' : undefined,
            outlineColor: showMinMsg ? '#d32f2f' : undefined,
          }}
          {...props}
        />
        <span style={{ marginLeft: '4px' }}>%</span>
        {showMinMsg && (
          <div aria-live="polite" style={{ fontSize: 12, color: '#d32f2f', marginTop: 2 }}>
            Column width must be at least 10%.
          </div>
        )}
      </div>
    </InputContainer>
  );
}

export default function ColumnWidthsModal({ isOpen, setIsOpen, numOfCols = 8, cellNodeKey }) {
  const [editor] = useLexicalComposerContext();

  const generateDefaultValues = () => {
    const defaultWidth = Math.floor(100 / numOfCols);
    const remainder = 100 % numOfCols;
    const defaults = {};
    for (let i = 0; i < numOfCols; i++) defaults[`column_${i}`] = i < remainder ? defaultWidth + 1 : defaultWidth;
    return defaults;
  };

  const getCurrentWidths = () => {
    let currentWidths = generateDefaultValues();

    if (!cellNodeKey) return currentWidths;

    editor.getEditorState().read(() => {
      try {
        const cellNode = $getNodeByKey(cellNodeKey);
        if (!cellNode || !$isTableCellNode(cellNode)) return;

        const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);
        if (table && table.__columnWidths) {
          const existingWidths = table.__columnWidths;

          if (existingWidths.length === numOfCols) {
            const widthsObject = {};

            existingWidths.forEach((width, idx) => {
              widthsObject[`column_${idx}`] = width;
            });

            currentWidths = widthsObject;
          }
        }
      } catch (error) {
        console.error('Error getting table: ', error);
      }
    });
    return currentWidths;
  };

  const { control, handleSubmit, reset } = useForm({ defaultValues: generateDefaultValues(), mode: 'onChange' });

  const watchedValues = useWatch({ control });
  const total = useMemo(() => Object.values(watchedValues).reduce((sum, value) => sum + (value || 0), 0), [watchedValues]);

  const adjustColumnWidths = (data) => {
    if (!cellNodeKey) {
      console.warn('No cell node key provided');
      return;
    }

    editor.update(() => {
      try {
        const cellNode = $getNodeByKey(cellNodeKey);
        if (!cellNode || !$isTableCellNode(cellNode)) {
          console.warn('Invalid cell node');
          return;
        }

        const table = $getTableNodeFromLexicalNodeOrThrow(cellNode);

        if (table && table.getType() === 'table') {
          const existingAlignment = table.__alignment;
          const existingWidth = table.__width;

          const writable = table.getWritable();

          if (existingAlignment) writable.__alignment = existingAlignment;
          if (existingWidth) writable.__width = existingWidth;

          const columnWidthsArray = Object.values(data);
          writable.__columnWidths = columnWidthsArray;

          const tableDom = editor.getElementByKey(table.getKey());
          if (tableDom) {
            const currentTableWidth = tableDom.offsetWidth;
            tableDom.style.width = `${currentTableWidth}px`;
            tableDom.style.tableLayout = 'fixed';

            const rows = tableDom.querySelectorAll('tr');

            columnWidthsArray.forEach((percentage, idx) => {
              rows.forEach((row) => {
                const cell = row.children[idx];
                cell?.style.removeProperty('width');
                cell?.style.setProperty('width', `${percentage}%`);
              });
            });
          }
        }
      } catch (error) {
        console.warn('Error adjusting column widths', error);
      }
    });
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      reset(getCurrentWidths());
    }
  }, [isOpen, numOfCols, cellNodeKey]);

  const isTotalValid = total === 100;

  return (
    <ScribeModal width="sm" showModal={isOpen}>
      <HeaderContainer>
        <H1>Change Column Widths</H1>
        <XCloseBtn handleClose={() => setIsOpen(false)} />
      </HeaderContainer>
      <HeaderLine className="mb-3" />

      <Body className="mb-4">
        <Note>Note: All columns need to total up to 100%. Minimum column width is 10%.</Note>

        <ColumnInputsContainer>
          {Array.from({ length: Math.ceil(numOfCols / 2) }, (_, rowIdx) => (
            <ColumnRows key={rowIdx}>
              <StyledInput control={control} name={`column_${rowIdx * 2}`} colNum={rowIdx * 2 + 1} />

              {rowIdx * 2 + 1 < numOfCols && <StyledInput control={control} name={`column_${rowIdx * 2 + 1}`} colNum={rowIdx * 2 + 2} />}
            </ColumnRows>
          ))}
        </ColumnInputsContainer>

        <TotalLine>
          <PillContainer>
            <span>Total</span>
            {total === 100 && (
              <Pill color="green">
                {`${total}% `}
                <CheckCircle />
              </Pill>
            )}

            {total < 100 && (
              <Pill color="yellow">
                {`${total}%`}
                <ToolTipBtn message={`Under by: ${100 - total} %`} />
              </Pill>
            )}

            {total > 100 && (
              <Pill aria-live="polite" color="red">
                {`${total}%`}
                <ToolTipBtn message={`Over by: ${total - 100} %`} />
              </Pill>
            )}
          </PillContainer>

          <IconBtnContainer>
            <IconBtn aria-label="Distribute Columns Evenly" id="distributeEvenly" type="button" onClick={() => reset(generateDefaultValues())}>
              <ViewColumn fontSize="medium" />
            </IconBtn>
            <IconBtnLabel htmlFor="distributeEvenly">Distribute Columns Evenly</IconBtnLabel>
          </IconBtnContainer>
        </TotalLine>

        <BtnContainer>
          <DrButton onClick={() => handleSubmit(adjustColumnWidths)()} className="btn-size" variant="primary" isDisabled={!isTotalValid}>
            Modify Letter
          </DrButton>

          <DrButton className="btn-size" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

ColumnWidthsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  numOfCols: PropTypes.number,
  cellNodeKey: PropTypes.string,
};

StyledInput.propTypes = {
  control: PropTypes.shape({}).isRequired,
  name: PropTypes.string.isRequired,
  colNum: PropTypes.number.isRequired,
};

ToolTipBtn.propTypes = { message: PropTypes.string.isRequired };
