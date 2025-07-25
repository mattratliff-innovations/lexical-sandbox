import React from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import './ChangeStatusModal.css';
import { HeaderContainer, Body, Footer } from '../../util/modalDesignComponents';
import { H1 } from '../../../components/typography';
import { HrNoTopMargin, BtnContainer } from '../../../components/designedComponents';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

export default function ChangeStatusModal({ showChangeStatusModal, setShowChangeStatusModal, changeStatus }) {
  const cancelChangeStatus = () => setShowChangeStatusModal(false);

  return (
    <ScribeModal width="md" showModal={showChangeStatusModal}>
      <HeaderContainer data-testid="change-status-modal-header">
        <H1 className="noMarginHeader">Confirmation Required!</H1>

        <XCloseBtn handleClose={cancelChangeStatus} />
      </HeaderContainer>

      <Body>
        <div className="col-sm-10 m-0 p-0">
          <HrNoTopMargin />
        </div>

        <div className="row m-0 mt-4">
          <div className="m-0 p-0">Revert delete status of this letter back to draft status?</div>
        </div>
      </Body>

      <Footer className="justify-content-start">
        <BtnContainer>
          <DrButton variant="primary" data-testid="changeStatus" className="btn-size" onClick={changeStatus}>
            Yes, Revert
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelChangeStatus" onClick={cancelChangeStatus} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Footer>
    </ScribeModal>
  );
}

ChangeStatusModal.propTypes = {
  showChangeStatusModal: PropTypes.bool.isRequired,
  setShowChangeStatusModal: PropTypes.func.isRequired,
  changeStatus: PropTypes.func.isRequired,
};
