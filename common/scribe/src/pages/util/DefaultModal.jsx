import React from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';
import { HeaderContainer, Body, Note } from './modalDesignComponents';
import { BtnContainer } from '../../components/designedComponents';

export default function DefaultModal({
  showModal,
  setShowModal,
  onSubmit = undefined,
  defaultMessage,
  informationalOnly = false,
  defaultHeader = 'Confirmation Required',
  confirmButton = 'Yes',
  declineButton = 'No',
  defaultNote = undefined,
}) {
  const handleConfirmClick = () => {
    if (informationalOnly) setShowModal(false);
    else onSubmit();
  };

  return (
    <ScribeModal showModal={showModal} width="md">
      <HeaderContainer>
        <h4 className="noMarginHeader" data-testid="defaultModalHeader">
          {defaultHeader}
        </h4>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body data-testid="defaultModalBody" className="mb-4">
        <div className="mb-3">
          <div>{defaultMessage}</div>
          {defaultNote && <Note>{defaultNote}</Note>}
        </div>

        <BtnContainer>
          <DrButton
            variant="primary"
            data-testid="YesButton"
            aria-label={informationalOnly ? 'OK' : confirmButton}
            onClick={handleConfirmClick}
            className="btn-size">
            {informationalOnly ? 'OK' : confirmButton}
          </DrButton>

          {onSubmit && (
            <DrButton variant="secondary" data-testid="noButton" aria-label="No" onClick={() => setShowModal(false)} className="btn-size">
              {declineButton}
            </DrButton>
          )}
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

DefaultModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  defaultMessage: PropTypes.string.isRequired,
  defaultHeader: PropTypes.string,
  informationalOnly: PropTypes.bool,
  confirmButton: PropTypes.string,
  declineButton: PropTypes.string,
  defaultNote: PropTypes.string,
};
