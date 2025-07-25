import { DateTime } from 'luxon';
import React from 'react';
import { H3 } from '../../components/typography';

export const formatAddressLine1 = (address) => `${address?.street || ''}${address?.aptSuiteFloor ? `, ${address?.aptSuiteFloor}` : ''}`;

export const formatAddressLine2 = (address) => {
  if (address.foreignAddress) {
    return `${address?.province || ''} ${address?.postalCode || ''}`;
  }
  return `${address?.city ? `${address.city}, ` : ''}${address?.state?.code || ''} ${address?.zipCode || ''}`;
};

export const isInternationalAddress = (address) => address?.foreignAddress;

export const CONTACT_TYPE_REPRESENTATIVE = 'RepresentativeType';
export const CONTACT_TYPE_APPLICANT = 'ApplicantType';
export const CONTACT_TYPE_PETITIONER = 'PetitionerType';
export const PETITIONER_DISPLAY_NAME = 'Petitioner';
export const APPLICANT_DISPLAY_NAME = 'Applicant/Beneficiary';
export const PRIMARY_APPLICANT_DISPLAY_NAME = 'Primary Applicant/Beneficiary';
export const REPRESENTATIVE_DISPLAY_NAME = 'Representative';

export const CONTACT_ADDRESS_TYPE = 'AddressContactType';

// *NOTE* - all methods are used by both the Letter Page (side bar) and the Contacts Page
// New methods will need to be created if sorting or formatting changes on either page

export const isRepresentative = (contactType) => contactType === CONTACT_TYPE_REPRESENTATIVE;
export const isPetitioner = (contactType) => contactType === CONTACT_TYPE_PETITIONER;
export const isApplicant = (contactType) => contactType === CONTACT_TYPE_APPLICANT;
export const isPrimaryApplicant = (contact) => isApplicant(contact.type) && contact.primaryApplicant === true;
export const isMainContact = (contact) => isRepresentative(contact.type) || isPetitioner(contact.type) || isPrimaryApplicant(contact);

export const formatContactType = (contact) => {
  if (isApplicant(contact.type)) {
    return contact.primaryApplicant === true ? PRIMARY_APPLICANT_DISPLAY_NAME : APPLICANT_DISPLAY_NAME;
  }

  if (isPetitioner(contact.type)) {
    return PETITIONER_DISPLAY_NAME;
  }

  if (isRepresentative(contact.type)) {
    return REPRESENTATIVE_DISPLAY_NAME;
  }
  return contact.type;
};

export const formatOtherContactAddress = (contact) => (
  <p key={contact.id}>
    <b>
      {contact.firstName} {contact.lastName}
    </b>{' '}
    | <H3 className="recipientRole">{formatContactType(contact)}</H3>
  </p>
);

export const sortContacts = (arrayToSort) => {
  const contactTypeSortOrder = [CONTACT_TYPE_REPRESENTATIVE, CONTACT_TYPE_PETITIONER, CONTACT_TYPE_APPLICANT];
  const applicantSortOrder = ['true', 'false'];

  return arrayToSort.sort((a, b) => {
    if (a.type === b.type) {
      if (a.type === CONTACT_TYPE_APPLICANT) {
        // primary applicant first
        return (
          applicantSortOrder.indexOf(a.primaryApplicant.toString()) - applicantSortOrder.indexOf(b.primaryApplicant.toString()) ||
          a.lastName.localeCompare(b.lastName)
        );
      }
      return a.lastName.localeCompare(b.lastName);
    }
    return contactTypeSortOrder.indexOf(a.type) - contactTypeSortOrder.indexOf(b.type);
  });
};

export const formatContactDate = (dateStr) => (dateStr ? DateTime.fromISO(dateStr).toLocaleString(Date.SHORT) : dateStr);
export const formatPrimaryMessage = (app) => `Are you sure you want to make ${app.firstName} ${app.lastName} the primary applicant/beneficiary?`;

// All Letter Recipients includes (Representatives, Petitioners, Primary Applicants, and Applicants)
export const letterRecipients = (contacts) => sortContacts(contacts?.filter((contact) => contact.letterRecipient));

//  Non letter recipients - Only Reps, Petitioners & Primary Applicants
export const sortedMainContacts = (contacts) => sortContacts(contacts?.filter((contact) => !contact.letterRecipient && isMainContact(contact)));

// Non letter recipeints Non Primary Applicants - (are formatted different)
export const sortedApplicantContacts = (contacts) => sortContacts(contacts?.filter((contact) => !contact.letterRecipient && !isMainContact(contact)));

export const formatRecipientAddress = (contact) => {
  const { address } = contact;
  return (
    <>
      <p>
        <b>
          {contact.firstName} {contact.lastName}
        </b>
      </p>
      <p className="recipientRole">
        <b>{isPrimaryApplicant(contact) ? contact.aNumber : formatContactType(contact)}</b>
      </p>
      {isPrimaryApplicant(contact) && <p>{PRIMARY_APPLICANT_DISPLAY_NAME}</p>}
      <p>{contact.firmName}</p>
      <p>{address?.street}</p>
      {address?.aptSuiteFloor ? <p>{address?.aptSuiteFloor}</p> : ''}
      <p>
        {address?.city ? `${address?.city}, ` : ''} {address?.state?.code ?? address?.province} {address?.zipCode ?? address?.postalCode}{' '}
        {address?.country}{' '}
      </p>
    </>
  );
};

export const isOtherContacts = (contacts) => {
  const otherContact = contacts.find((contact) => !contact.letterRecipient);
  return otherContact !== undefined;
};

export const contactTypeList = [
  {
    id: CONTACT_TYPE_APPLICANT,
    name: APPLICANT_DISPLAY_NAME,
  },
  {
    id: CONTACT_TYPE_PETITIONER,
    name: PETITIONER_DISPLAY_NAME,
  },
  {
    id: CONTACT_TYPE_REPRESENTATIVE,
    name: REPRESENTATIVE_DISPLAY_NAME,
  },
];

export const maskedSsn = (ssn) => (ssn && ssn.length === 9 ? ssn.replace(/(\d{5})(\d{4})/, '*****$2') : ssn);
