import React from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { startLogin } from '../../oidc/Authentication';
import { H1 } from '../../components/typography';
import { ScribeModal, ScribeBtn, XCloseBtn } from '../../components/ScribeComponents';
import { HeaderContainer, Body } from './modalDesignComponents';
import { BtnContainer, StyledHr } from '../../components/designedComponents';

function ExitBody({ name, handleYes, handleNo }) {
  return (
    <Body>
      <div>{`Leaving this "${name}" form will erase all progress.`}</div>
      <div className="mb-4">Note: This action cannot be undone.</div>

      <BtnContainer className="mb-4">
        <DrButton variant="primary" onClick={handleYes} className="btn-size">
          Leave Page
        </DrButton>

        <DrButton data-testid="exitModalCancel" variant="secondary" onClick={handleNo} className="btn-size">
          Cancel
        </DrButton>
      </BtnContainer>
    </Body>
  );
}

function LogOutBody() {
  return (
    <Body>
      <div>Due to a period of inactivity, you have been logged out.</div>
      <div className="mb-3">
        {`Click the "`}
        <b>Sign Back In</b>
        {`" button to pick up right where you left off.`}
      </div>

      <BtnContainer className="mb-4">
        <ScribeBtn onClick={startLogin} dataTestId="signInButton">
          Sign Back In
        </ScribeBtn>
      </BtnContainer>
    </Body>
  );
}

export default function UtilityModal({ isOpen, setIsOpen = () => {}, blocker = {}, name = '', type = '' }) {
  const handleYes = () => {
    setIsOpen(false);
    blocker.proceed();
  };

  const handleNo = () => {
    setIsOpen(false);
    blocker.reset();
  };

  return (
    <ScribeModal type={type} width="md" showModal={isOpen}>
      <HeaderContainer>
        <H1 className="noMarginHeader">{type === 'logout' ? "You've Been Logged Out." : 'Warning!'}</H1>

        {type !== 'logout' && <XCloseBtn handleClose={handleNo} />}
      </HeaderContainer>

      <div className="col-sm-6 ms-3">
        <StyledHr />
      </div>

      {type === 'logout' ? <LogOutBody /> : <ExitBody handleNo={handleNo} handleYes={handleYes} name={name} />}
    </ScribeModal>
  );
}

UtilityModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func,
  type: PropTypes.string,
  name: PropTypes.string,
  blocker: PropTypes.shape({ proceed: PropTypes.func, reset: PropTypes.func }),
};

ExitBody.propTypes = {
  name: PropTypes.string.isRequired,
  handleYes: PropTypes.func.isRequired,
  handleNo: PropTypes.func.isRequired,
};
