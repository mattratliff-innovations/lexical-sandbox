import React from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { v4 as uuidv4 } from 'uuid';
import './PrintPreviewErrorsModal.css';
import { H1, BodyRegular } from '../../components/typography';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

export default function PrintPreviewErrorModal({ draft = null, linguisticErrors = [], showModal, setShowModal }) {
  const linguisticErrorCount = () => linguisticErrors?.map((error) => error.errors.length).reduce((partialSum, a) => partialSum + a, 0);
  const contactErrors = () => {
    const result = [];

    const contactsWithErrors = draft?.contacts?.filter((contact) => contact.errors?.print) || [];
    if (contactsWithErrors.length === 0) return result;

    contactsWithErrors.forEach((contactWithError) => result.push(...contactWithError.errors.print));
    return result;
  };
  const addressErrors = () => {
    const result = [];

    const contactsWithAddressErrors = draft?.contacts?.filter((contact) => contact?.address?.errors?.print) || [];
    if (contactsWithAddressErrors.length === 0) return result;

    contactsWithAddressErrors.forEach((contactWithAddressErrors) => result.push(...contactWithAddressErrors.address.errors.print));
    return result;
  };

  const draftErrors = () => {
    const result = [];
    if (!draft?.errors?.print) return result;

    result.push(...draft.errors.print);
    return result;
  };

  const allErrors = () => [...draftErrors(), ...addressErrors(), ...contactErrors()];
  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader">Errors Found!</H1>
        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body className="mb-4">
        <BodyRegular>You must resolve the following errors before finalizing the letter:</BodyRegular>
        <ul className="errorList">
          {allErrors().map((error) => (
            <li key={uuidv4()}>{error}</li>
          ))}
          {linguisticErrorCount() > 0 && <li>{`${linguisticErrorCount()} Spelling/Grammar Error(s)`}</li>}
        </ul>

        <BodyRegular>
          <i>Note: Spelling and grammar errors are optional.</i>
        </BodyRegular>

        <DrButton data-testid="printPreviewErrorModalYes" onClick={() => setShowModal(false)} className="btn-size">
          Yes
        </DrButton>
      </Body>
    </ScribeModal>
  );
}

PrintPreviewErrorModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  draft: PropTypes.shape({
    errors: PropTypes.shape({ print: PropTypes.arrayOf(PropTypes.string) }),
    contacts: PropTypes.arrayOf(
      PropTypes.shape({
        errors: PropTypes.shape({ print: PropTypes.arrayOf(PropTypes.string) }),
        address: PropTypes.shape({
          errors: PropTypes.shape({
            print: PropTypes.arrayOf(PropTypes.string),
          }),
        }),
      })
    ),
  }),
  linguisticErrors: PropTypes.arrayOf(PropTypes.shape({ errors: PropTypes.arrayOf(PropTypes.string) })),
};
