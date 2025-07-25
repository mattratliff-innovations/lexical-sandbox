import React from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { ScribeModal } from '../../components/ScribeComponents';
import { HeaderContainer, Body, Note } from './modalDesignComponents';
import { BtnContainer } from '../../components/designedComponents';
import { H1 } from '../../components/typography';

export default function DecisionModal({
  showModal,
  setShowModal,
  onSubmitOptionOne = undefined,
  onSubmitOptionTwo = undefined,
  message,
  header,
  optionOneLabel,
  optionTwoLabel,
  note = undefined,
}) {
  const handleOptionOneClick = () => {
    setShowModal(false);
    onSubmitOptionOne();
  };

  const handleOptionTwoClick = () => {
    setShowModal(false);
    onSubmitOptionTwo();
  };

  return (
    <ScribeModal showModal={showModal} width="md">
      <HeaderContainer className="mb-2">
        <H1 className="noMarginHeader" data-testid="decisionModalHeader">
          {header}
        </H1>
      </HeaderContainer>

      <Body data-testid="decisionModalBody" className="mb-4">
        <div className="mb-3">
          <div>{message}</div>
          {note && <Note>{note}</Note>}
        </div>

        <BtnContainer className="mb-4">
          <DrButton variant="primary" data-testid="OptionOneButton" aria-label={optionOneLabel} onClick={handleOptionOneClick} className="btn-size">
            {optionOneLabel}
          </DrButton>

          <DrButton variant="primary" data-testid="OptionTwoButton" aria-label={optionTwoLabel} onClick={handleOptionTwoClick} className="btn-size">
            {optionTwoLabel}
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

DecisionModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmitOptionOne: PropTypes.func,
  onSubmitOptionTwo: PropTypes.func,
  message: PropTypes.string.isRequired,
  header: PropTypes.string.isRequired,
  optionOneLabel: PropTypes.string.isRequired,
  optionTwoLabel: PropTypes.string.isRequired,
  note: PropTypes.string,
};
