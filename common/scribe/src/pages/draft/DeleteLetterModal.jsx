import React from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import './DeleteLetterModal.css';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import { BtnContainer } from '../../components/designedComponents';
import { H1 } from '../../components/typography';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

export default function DeleteLetterModal({ showModal, setShowModal, confirmDeleteLetter }) {
  const {
    formState: { isSubmitting },
  } = useForm({ mode: 'onSubmit' });

  return (
    <ScribeModal width="md" showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="deleteLetterModalHeader">
          Confirmation Required!
        </H1>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body data-testid="confirmDeleteModalBody">
        <div className="my-4">
          Deleting this draft will also delete any edits to the contact information. Are you sure you want to delete this draft?
        </div>

        <BtnContainer className="mt-4 mb-4">
          <DrButton
            variant="primary"
            data-testid="confirmDelete"
            onClick={() => confirmDeleteLetter()}
            isDisabled={isSubmitting}
            className="btn-size">
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelDelete" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

DeleteLetterModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  confirmDeleteLetter: PropTypes.func.isRequired,
};
