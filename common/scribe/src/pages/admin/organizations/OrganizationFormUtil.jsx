import React from 'react';

export const RETRIEVING_HEADERS_ERRORS = 'Encountered an unknown error retrieving headers.';
export const CREATE_ACTION = 'Create';
export const DEFAULT_SIGNATURE = 'Signature';
export const DEFAULT_ADDRESS = 'Address';
export const MISSING_DEFAULT_SIGNATURE_MSG = 'Default signatory missing. Organization signatures will not be populated by default';
export const MISSING_DEFAULT_ADDRESS_MSG = 'Default address missing. Organization address variables will not be populated by default.';

export const formatDefaultMessage = (message, type) => (
  <>
    Are you sure you want to make {message} the Default {type}
    ?
    <br />
    Note: This will change the organization&apos;s {type.toLowerCase()} on all drafts for users in this organization.
  </>
);

// Address
export const formatAddressLine1 = (address) => `${address?.street}${address?.aptSuiteFloor ? `, ${address?.aptSuiteFloor}` : ''}`;

export const formatAddressLine2 = (address) => `${address?.city}, ${address?.state?.code} ${address?.zipCode}`;

export const isExistingDefaultAddress = (adminFormData) => {
  const defaultAddress = adminFormData?.organizationAddressXrefs?.find((address) => address.default === true);
  return !(defaultAddress === undefined || defaultAddress.length === 0);
};

export const isOrgAddress = (adminFormData) => adminFormData?.organizationAddressXrefs?.length > 0;

export const isOrgSignature = (adminData) => adminData?.organizationSignatures?.length > 0;

// Signature
export const isExistingDefaultSignature = (adminFormData) => {
  const defaultSignature = adminFormData?.organizationSignatures?.find((signature) => signature.default === true);
  return !(defaultSignature === undefined || defaultSignature.length === 0);
};

export const makeDefaultSignature = (adminFormData, currentSignatureId) => {
  const existingDefaultSignature = adminFormData?.organizationSignatures?.find((signature) => signature.default === true);
  if (existingDefaultSignature === undefined || existingDefaultSignature.id === currentSignatureId) {
    return true; // a default doesn't exist OR this is the default signature
  }
  return false;
};
