import React from 'react';
import PropTypes from 'prop-types';
import { DrButton, DrAlert } from '@druid/druid';
import { useNavigate } from 'react-router-dom';
import { BtnContainer } from '../../../components/designedComponents';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import { H1 } from '../../../components/typography';
import { XCloseBtn, ScribeModal } from '../../../components/ScribeComponents';

export default function AddSnippetToGroupModal({ snippetGroupToEdit = null, showModal, setShowModal }) {
  const navigate = useNavigate();

  const handleClose = (url) => {
    setShowModal(false);
    navigate(url);
  };

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer data-testid="addToSnippetModalHeader">
        <H1 className="noMarginHeader">Confirmation Required!</H1>
        <XCloseBtn handleClose={() => handleClose('/admin/snippets')} />
      </HeaderContainer>

      <DrAlert data-testid="addToSnippetAlert" type="success" alert="Snippet Successfully Saved" noCloseBtn variant="slim" className="mb-3" />

      <Body data-testid="addToOrgModalBody">
        <div className="mb-3">Would you like to add a Snippet Placeholder to this Snippet Group?</div>

        <BtnContainer className="mb-4">
          <DrButton
            variant="primary"
            data-testid="yesButton"
            onClick={() => handleClose(`/admin/snippets/${snippetGroupToEdit.id}`)}
            className="btn-size">
            Yes
          </DrButton>

          <DrButton variant="secondary" data-testid="noButton" onClick={() => handleClose('/admin/snippets')} className="btn-size">
            No
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

AddSnippetToGroupModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  snippetGroupToEdit: PropTypes.shape({
    id: PropTypes.string,
  }),
};
