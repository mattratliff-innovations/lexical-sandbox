/* eslint-disable react/jsx-curly-brace-presence */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { HeaderLine } from '../util/modalDesignComponents';

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 24px;
`;

const Content = styled.div`
  margin-bottom: 16px;
`;

const BtnsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
`;

function ConfirmLeave() {
  return (
    <>
      <div>{'Leaving this "contact" form will erase all progress.'}</div>
      <div>Note: This action cannot be undone.</div>
    </>
  );
}

export default function ConfirmContent({ curTitle, contactToEdit = {}, isBlocked, handleConfirm, handleNegative }) {
  const [curContent, setCurContent] = useState('');
  const deleteMessage = `Are you sure you want to delete ${contactToEdit.type} ${contactToEdit.firstName}, ${contactToEdit.lastName}?`;
  const leaveLabel = isBlocked ? 'Leave Page' : 'Leave Form';
  useEffect(() => {
    setCurContent(curTitle === 'Delete Confirmation' ? deleteMessage : <ConfirmLeave />);
  }, [curTitle]);

  return (
    <div>
      <HeaderLine className="mb-2" />

      <BodyWrapper>
        <Content>{curContent}</Content>

        <BtnsContainer>
          <DrButton data-testid="positiveBtn" variant="primary" onClick={handleConfirm} className="btn-size">
            {curTitle === 'Delete Confirmation' ? 'Yes' : leaveLabel}
          </DrButton>

          <DrButton data-testid="negativeBtn" variant="secondary" onClick={handleNegative} className="btn-size">
            {curTitle === 'Delete Confirmation' ? 'No' : 'Cancel'}
          </DrButton>
        </BtnsContainer>
      </BodyWrapper>
    </div>
  );
}

ConfirmContent.propTypes = {
  curTitle: PropTypes.string.isRequired,
  handleConfirm: PropTypes.func.isRequired,
  handleNegative: PropTypes.func.isRequired,
  isBlocked: PropTypes.func.isRequired,
  contactToEdit: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }),
};
