import React from 'react';
import PropTypes from 'prop-types';
import { formatAddressLine1, formatAddressLine2, isInternationalAddress, formatContactDate } from './ContactUtils';
import ContactCardErrorMessage from './ContactCardErrorMessage';

export default function PetitionerContact(props) {
  const { contact } = props;

  return (
    <div className="row">
      <div className="col-lg-6">
        <div>
          <b>Full Name: </b>
          {contact.firstName} {contact.middleName} {contact.lastName}
        </div>
        <div>
          <b>Firm Name:</b> {contact.firmName}
        </div>
        <div>
          <b>In Care Of:</b> {contact.inCareOf}
        </div>
        <div>
          <b>A Number:</b> {contact.aNumber}
        </div>
        <div>
          <b>Date of Birth:</b> {formatContactDate(contact.dateOfBirth)}
        </div>
      </div>
      <div className="col-lg-6">
        <div>
          <b>Street Address:</b>
        </div>
        <ContactCardErrorMessage contact={contact} />
        {contact?.contactAddressXref?.address && (
          <>
            <div>{formatAddressLine1(contact?.contactAddressXref?.address)}</div>
            <div>{formatAddressLine2(contact?.contactAddressXref?.address)}</div>
            {isInternationalAddress(contact?.contactAddressXref?.address) && <div>{contact?.contactAddressXref?.address?.country}</div>}
          </>
        )}
      </div>
    </div>
  );
}

PetitionerContact.propTypes = {
  contact: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    middleName: PropTypes.string,
    firmName: PropTypes.string,
    inCareOf: PropTypes.string,
    aNumber: PropTypes.string,
    dateOfBirth: PropTypes.string,
    contactAddressXref: PropTypes.shape({
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
    }),
    errors: PropTypes.shape({
      print: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};
