import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { GearFill, Eye, EyeSlash } from 'react-bootstrap-icons';
import './Letter.css';
import { DrAlert, DrCard } from '@druid/druid';
import ActionButton from '../../components/actionButton/ActionButton';
import * as Util from '../contacts/ContactUtils';
import { H2 } from '../../components/typography';

export default function ContactSideBar({
  showManageContacts = false,
  useRecipientCards = false,
  contacts = [],
  uuid,
  handleCardOnClick = () => {},
  selectedRecipientId = '',
}) {
  const redirect = useNavigate();
  const MAX_APPLICANT_DISPLAY = 3;
  const ADDRESS_MISSING_MSG = 'Address Information Missing';

  const recipientCard = (recipient, { formatFunction = null, toggled = false }) => (
    <div className="recipient card" key={recipient.id}>
      <DrCard
        interactive={!toggled}
        orientation="vertical"
        toggled={toggled}
        className=""
        data-testid={`dr-card-${recipient.id}`}
        onClick={
          toggled
            ? undefined
            : () => {
                handleCardOnClick(recipient.id);
              }
        }>
        <div data-testid={`recipient-card-${recipient.id}`}>
          {toggled ? (
            <Eye className="contact-draft-preview-icon" data-testid={`eye-icon-${recipient.id}`} />
          ) : (
            <EyeSlash className="contact-draft-preview-icon" data-testid={`eye-slash-icon-${recipient.id}`} />
          )}
          {formatFunction(recipient)}
        </div>
      </DrCard>
    </div>
  );

  return (
    <div data-testid="contactsSidebar" className="side-menu contacts ps-2 p-2 mb-4">
      <H2>Letter Recipients</H2>

      {Util.letterRecipients(contacts).length === 0 && (
        <>
          <DrAlert type="error" noCloseBtn>
            <div className="small">
              <strong>Recipient Required:</strong>
              <br />
              A letter recipient is required in order to finalize a letter draft.
              <br />
              Click Manage to add one.
            </div>
          </DrAlert>
          <br />
        </>
      )}

      {Util.letterRecipients(contacts).map((recipient) => (
        <div className="recipient" key={recipient.id}>
          {useRecipientCards
            ? recipientCard(recipient, {
                formatFunction: Util.formatRecipientAddress,
                toggled: selectedRecipientId === recipient.id,
              })
            : Util.formatRecipientAddress(recipient)}
          {!recipient?.address?.isMailable && <div className="missing-address-msg">{ADDRESS_MISSING_MSG}</div>}
        </div>
      ))}

      {Util.isOtherContacts(contacts) && <H2>Other&nbsp;Contacts</H2>}

      {Util.sortedMainContacts(contacts).map((mainContact) => (
        <div className="recipient" key={mainContact.id}>
          {Util.formatRecipientAddress(mainContact)}
        </div>
      ))}

      <div className="recipient">
        {Util.sortedApplicantContacts(contacts)
          .slice(0, MAX_APPLICANT_DISPLAY)
          .map((applicant) => Util.formatOtherContactAddress(applicant))}

        {Util.sortedApplicantContacts(contacts).length > MAX_APPLICANT_DISPLAY && (
          <Button id="viewContactsButton" variant="btn btn-link" onClick={() => redirect(`/contacts/${uuid}`)}>
            View More
          </Button>
        )}
      </div>

      {showManageContacts && (
        <div className="side-menu-option ms-0 m-2">
          <ActionButton
            data-testid="manageContactsButton"
            id="manageContactsButton"
            title="Manage Contacts"
            aria-label="Manage Contacts"
            onClick={() => redirect(`/contacts/${uuid}`)}
            icon={GearFill}
            text="Manage Contacts"
          />
        </div>
      )}
    </div>
  );
}

ContactSideBar.propTypes = {
  uuid: PropTypes.string.isRequired,
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      middleName: PropTypes.string,
      firmName: PropTypes.string,
      inCareOf: PropTypes.string,
      aNumber: PropTypes.string,
      dateOfBirth: PropTypes.string,
      address: PropTypes.shape({
        street: PropTypes.string,
        aptSuiteFloor: PropTypes.string,
        city: PropTypes.string,
        zipCode: PropTypes.string,
        province: PropTypes.string,
        postalCode: PropTypes.string,
        country: PropTypes.string,
        state: PropTypes.shape({
          id: PropTypes.string,
          code: PropTypes.string,
          name: PropTypes.string,
        }),
      }),
    })
  ),
  showManageContacts: PropTypes.bool,
  useRecipientCards: PropTypes.bool,
  selectedRecipientId: PropTypes.string,
  handleCardOnClick: PropTypes.func,
};
