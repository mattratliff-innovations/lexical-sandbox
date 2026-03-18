import { DrAlert, DrButton, DrCard } from '@druid/druid';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';

import './ContactSideBar.css';
import { H2 } from '../../components/typography';
import {
  formatOtherContactAddress,
  formatRecipientAddress,
  isOtherContacts,
  letterRecipients,
  sortedApplicantContacts,
  sortedMainContacts,
} from '../contacts/ContactUtils';

export default function ContactSideBar({
  showManageContacts = false,
  useRecipientCards = false,
  contacts = [],
  uuid,
  handleCardOnClick = () => {},
  selectedRecipientId = '',
  allowedToIncludeRecipients = true,
  sendUpdateDraft = () => {},
  markAllClean = () => {},
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
            <Eye className="contact-side-bar__icon" data-testid={`eye-icon-${recipient.id}`} />
          ) : (
            <EyeSlash className="contact-side-bar__icon" data-testid={`eye-slash-icon-${recipient.id}`} />
          )}
          {formatFunction(recipient)}
        </div>
      </DrCard>
    </div>
  );

  return (
    <div data-testid="contactsSidebar" className="side-menu contacts ps-2 p-2 mb-4">
      {allowedToIncludeRecipients && (
        <>
          <H2>Letter Recipients</H2>
          {letterRecipients(contacts).length === 0 && (
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
        </>
      )}

      {letterRecipients(contacts).map((recipient) => (
        <div className="recipient" key={recipient.id}>
          {useRecipientCards
            ? recipientCard(recipient, {
                formatFunction: formatRecipientAddress,
                toggled: selectedRecipientId === recipient.id,
              })
            : formatRecipientAddress(recipient)}
          {!recipient?.address?.isMailable && <div className="missing-address-msg">{ADDRESS_MISSING_MSG}</div>}
        </div>
      ))}

      {isOtherContacts(contacts) && <H2>Other&nbsp;Contacts</H2>}

      {sortedMainContacts(contacts).map((mainContact) => (
        <div className="recipient" key={mainContact.id}>
          {formatRecipientAddress(mainContact)}
        </div>
      ))}

      <div className="recipient">
        {sortedApplicantContacts(contacts)
          .slice(0, MAX_APPLICANT_DISPLAY)
          .map((applicant) => formatOtherContactAddress(applicant))}

        {sortedApplicantContacts(contacts).length > MAX_APPLICANT_DISPLAY && (
          <Button id="viewContactsButton" variant="btn btn-link" onClick={() => redirect(`/contacts/${uuid}`)}>
            View More
          </Button>
        )}
      </div>

      {showManageContacts && (
        <DrButton
          className="contact-side-bar__action-button"
          data-testid="manageContactsButton"
          id="manageContactsButton"
          title="Manage Contacts"
          aria-label="Manage Contacts"
          onClick={() => sendUpdateDraft(`/contacts/${uuid}`, markAllClean)}>
          Manage Contacts
        </DrButton>
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
        country: PropTypes.shape({
          id: PropTypes.string,
          code: PropTypes.string,
          description: PropTypes.string,
        }),
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
  allowedToIncludeRecipients: PropTypes.bool,
  sendUpdateDraft: PropTypes.func,
  markAllClean: PropTypes.func,
};
