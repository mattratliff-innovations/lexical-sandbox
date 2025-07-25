/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Button from 'react-bootstrap/Button';
import { CaretDownFill, CaretUpFill, TrashFill } from 'react-bootstrap-icons';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ReactComponent as FormatText } from '../../../../../assets/format-text.svg';

const UpdatedBtn = styled(Button)`
  background-color: #707070;
  color: #ffffff;
  border-color: #eeeeee;
  border-radius: 4px;
  height: 18px;
  width: 18px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.isdisabled ? 0.6 : 1)};
`;

const WingButton = React.forwardRef(({ action = () => {}, isDisabled = false, type = '' }, ref) => {
  const [editor] = useLexicalComposerContext();

  const [testId, setTestId] = useState('');

  const handleClick = () => {
    if (isDisabled) return;

    // editor needs to regain focus if toolbar button
    if (type === 'Format Text') editor.focus();
    action();
  };

  useEffect(() => {
    if (type === 'Format Text') setTestId();
  }, [type]);

  return (
    <UpdatedBtn
      ref={ref}
      isdisabled={isDisabled ? 1 : 0}
      aria-disabled={isDisabled}
      data-testid={testId}
      variant="custom"
      onClick={handleClick}
      title={type}
      aria-label={type}>
      {type === 'Format Text' && <FormatText />}
      {type === 'Delete Paragraph Text' && <TrashFill />}
      {type === 'Move Paragraph Up' && <CaretUpFill />}
      {type === 'Move Paragraph Down' && <CaretDownFill />}
    </UpdatedBtn>
  );
});
export default WingButton;
