import React from 'react';
import PropTypes from 'prop-types';
import { DrButton, DrAlert } from '@druid/druid';
import { useNavigate } from 'react-router-dom';
import { BtnContainer } from '../../../components/designedComponents';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import { H1 } from '../../../components/typography';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

export default function AddToOrganizationModal(props) {
  const { showModal, setShowModal, organizationToEdit } = props;
  const navigate = useNavigate();

  const handleClose = (url) => {
    setShowModal(false);
    navigate(url);
  };

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer data-testid="addToOrgModalHeader">
        <H1 className="noMarginHeader">Confirmation Required here!</H1>
        <XCloseBtn handleClose={() => handleClose('/admin/organizations')} />
      </HeaderContainer>

      <DrAlert data-testid="addToOrgAlert" type="success" alert="Organization Successfully Save" noCloseBtn variant="slim" className="mb-3" />

      <Body data-testid="addToOrgModalBody">
        <div className="mb-3">Would you like to add an address and/or signatory to this organization?</div>

        <BtnContainer className="mb-4">
          <DrButton
            variant="primary"
            data-testid="yesButton"
            onClick={() => handleClose(`/admin/organizations/${organizationToEdit}`)}
            className="btn-size">
            Yes
          </DrButton>

          <DrButton variant="secondary" data-testid="noButton" onClick={() => handleClose('/admin/organizations')} className="btn-size">
            No
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

AddToOrganizationModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  organizationToEdit: PropTypes.string.isRequired,
};
