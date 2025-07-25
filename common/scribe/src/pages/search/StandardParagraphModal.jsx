import React from 'react';
import PropTypes from 'prop-types';
import { sanitizedHtml } from '../util/displaySanitizedHtml';
import './StandardParagraphModal.css';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import { H1 } from '../../components/typography';
import { HrNoTopMargin } from '../../components/designedComponents';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

export default function StandardParagraphModal({ showModal, setShowModal, modalParagraph }) {
  return (
    <ScribeModal width="md" showModal={showModal}>
      <HeaderContainer data-testid="standard-paragraph-modal-header">
        <H1 className="noMarginHeader">{modalParagraph.code}</H1>
        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body className="mb-4">
        <div className="col-sm-8">
          <HrNoTopMargin />
        </div>

        <div className="row m-0 mt-4">
          <div className="m-0 mb-2 p-0">Standard Paragraph Content</div>
          <div className="col-lg-4 standard-paragraph-modal-body">{sanitizedHtml(modalParagraph.content)}</div>
        </div>
      </Body>
    </ScribeModal>
  );
}

StandardParagraphModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  modalParagraph: PropTypes.shape({
    code: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  }).isRequired,
};
