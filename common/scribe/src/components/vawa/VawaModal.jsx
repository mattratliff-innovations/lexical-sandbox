import React from 'react';
import styled from '@emotion/styled';
import { DrButton } from '@druid/druid';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { XCloseBtn, ScribeModal } from '../ScribeComponents';
import { H1 } from '../typography';
import { HeaderContainer } from '../../pages/util/modalDesignComponents';

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 24px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 48px;
`;

const Content1 = styled.div`
  display: flex;
  font-weight: 800;
`;

const Content2 = styled.div`
  display: flex;
`;

const BtnsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
`;

export default function VawaModal({ showModal, setShowModal, redirectTarget = '' }) {
  const ContentLine1 = '8 USC 1367 Protected Information - Disclosure and Use Restrictions Apply.';
  const ContentLine2 = 'The information on this case is sensitive and can only be accessed by authorized individuals.';
  const redirect = useNavigate();

  const handleAcknowledgementOrClose = () => {
    setShowModal(false);
    if (redirectTarget) {
      redirect(`/${redirectTarget}`);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    redirect('/');
  };

  return (
    <ScribeModal dataTestId="VawaModal" showModal={showModal}>
      <>
        <HeaderContainer>
          <H1 className="noMarginHeader">Acknowledgement Required!</H1>

          <XCloseBtn handleClose={handleAcknowledgementOrClose} />
        </HeaderContainer>

        <BodyWrapper>
          <ContentContainer>
            <Content1>{ContentLine1}</Content1>
            <Content2>{ContentLine2}</Content2>
          </ContentContainer>

          <BtnsContainer>
            <DrButton data-testid="positiveBtn" variant="primary" onClick={handleAcknowledgementOrClose} className="btn-size">
              Acknowledge
            </DrButton>

            <DrButton data-testid="negativeBtn" variant="secondary" onClick={handleCancel} className="btn-size">
              Cancel
            </DrButton>
          </BtnsContainer>
        </BodyWrapper>
      </>
    </ScribeModal>
  );
}

VawaModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  redirectTarget: PropTypes.string,
};
