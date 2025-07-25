import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import styled from '@emotion/styled';
import { formatAddressLine1, formatAddressLine2, isInternationalAddress, formatContactDate, isPrimaryApplicant, maskedSsn } from './ContactUtils';
import ContactCardErrorMessage from './ContactCardErrorMessage';

export const ContactCardStyle = styled.div`
  height: 200px;
`;

export const PrimaryApplicantStyle = styled.div`
  height: 35px;
  align-content: center;
`;

export default function ApplicantContact(props) {
  const { contact, makePrimaryContact } = props;

  const showApplicantAddress = (applicant) => applicant.primaryApplicant === true || applicant.letterRecipient === true;

  return (
    <div className="row">
      <ContactCardStyle className={showApplicantAddress(contact) ? 'col-lg-6' : 'col-lg-12'}>
        <div>
          <div>
            <b>Full Name: </b>
            {contact.firstName} {contact.middleName} {contact.lastName}
          </div>

          <div>
            <b>A Number:</b> {contact.aNumber}
          </div>

          <div>
            <b>Social Security Number:</b> {maskedSsn(contact.ssn)}
          </div>
          <div>
            <b>Date of Birth:</b> {formatContactDate(contact.dateOfBirth)}
          </div>
          <div>
            <b>Sex:</b> {contact?.sex?.name}
          </div>
        </div>
      </ContactCardStyle>
      {showApplicantAddress(contact) && (
        <ContactCardStyle className="col-lg-6">
          <div>
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
            <div className="mt-4">
              <b>Email Address:</b> {contact.email}
            </div>
          </div>
        </ContactCardStyle>
      )}
      <PrimaryApplicantStyle className="col-lg-12 text-end">
        <div>
          {isPrimaryApplicant(contact) ? (
            <span className="fw-bold opacity-50">Primary Applicant &nbsp;&nbsp;</span>
          ) : (
            <Button
              className="fw-bold"
              data-testid="primaryApplicantButton"
              variant="link"
              id="primaryApplicantButton"
              onClick={() => {
                makePrimaryContact(contact);
              }}>
              Make Primary
            </Button>
          )}
        </div>
      </PrimaryApplicantStyle>
    </div>
  );
}

ApplicantContact.propTypes = {
  contact: PropTypes.shape({
    letterRecipient: PropTypes.bool,
    primaryApplicant: PropTypes.bool,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    middleName: PropTypes.string,
    aNumber: PropTypes.string,
    ssn: PropTypes.string,
    dateOfBirth: PropTypes.string,
    sex: PropTypes.string,
    email: PropTypes.string,
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
  makePrimaryContact: PropTypes.func.isRequired,
};
