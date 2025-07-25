import React from 'react';
import PropTypes from 'prop-types';
import { DrButton, DrAlert } from '@druid/druid';
import { useNavigate } from 'react-router-dom';
import { BtnContainer } from '../../../components/designedComponents';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import { H1 } from '../../../components/typography';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

export default function AddContentToDocumentModal({ supportingDocumentToEdit, showModal, setShowModal }) {
  const navigate = useNavigate();

  const handleClose = (url) => {
    setShowModal(false);
    navigate(url);
  };

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer data-testid="addToDocumentModalHeader">
        <H1 className="noMarginHeader">Confirmation Required!</H1>
        <XCloseBtn handleClose={() => handleClose('/admin/supportingdocument')} />
      </HeaderContainer>

      <DrAlert
        data-testid="addToContentAlert"
        type="success"
        alert="Supporting Document Successfully Saved"
        noCloseBtn
        variant="slim"
        className="mb-3"
      />

      <Body data-testid="addToContentModalBody">
        <div className="mb-3">Would you like to add content to this document?</div>

        <BtnContainer className="mb-4">
          <DrButton
            variant="primary"
            data-testid="yesButton"
            onClick={() => handleClose(`/admin/supportingdocuments/content/${supportingDocumentToEdit.id}`)}
            className="btn-size">
            Yes
          </DrButton>

          <DrButton variant="secondary" data-testid="noButton" onClick={() => handleClose('/admin/supportingdocuments')} className="btn-size">
            No
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

AddContentToDocumentModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  supportingDocumentToEdit: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};
