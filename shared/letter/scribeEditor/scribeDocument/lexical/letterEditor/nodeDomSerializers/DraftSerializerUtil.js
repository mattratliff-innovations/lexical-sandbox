import { DateTime } from 'luxon';

export const primaryApplicant = (draft) => {
  const primaryApplicants = draft.applicantTypes?.filter((contact) => contact.primaryApplicant);
  return primaryApplicants?.length > 0 ? primaryApplicants[0] : null;
};

export const primaryAddress = (draft) => primaryApplicant(draft)?.address;

export const isShowPetitionerAnumber = (draft) => {
  const draftFormType = draft?.registration?.formTypeName;
  const availableFormTypes = draft?.letterType?.formTypes;

  return availableFormTypes?.some(
    (formType) =>
      // Check for form match and show petitoner flag is true
      formType.code === draftFormType && formType.showPetitionerAnumber === true
  );
};

export const getApplicantOrPetitionerAnumber = (draft) => {
  let alienNumber = primaryApplicant(draft)?.aNumber;
  if (!alienNumber && isShowPetitionerAnumber(draft)) {
    alienNumber = draft?.petitionerType?.aNumber;
  }
  return alienNumber;
};

export const getReceiptNumberWithAnumber = (draft) => {
  const receiptNumber = draft?.registration?.receiptNumber;
  const alienNumber = getApplicantOrPetitionerAnumber(draft);
  return (receiptNumber || '') + (receiptNumber && alienNumber ? '-' : '') + (alienNumber || '');
};

const formatAddressLine1 = (address) => `${address?.street || ''}${address?.aptSuiteFloor ? `, ${address?.aptSuiteFloor}` : ''}`;

const formatAddressLine2 = (address) => {
  if (address?.foreignAddress) {
    return `${address?.province || ''} ${address?.postalCode || ''}`;
  }
  return `${address?.city ? `${address.city}, ` : ''}${address?.state?.code || ''} ${address?.zipCode || ''}`;
};

export const formatAddressLine = (address) => `${formatAddressLine1(address)}, ${formatAddressLine2(address)}`;

export const formatDate = (dateStr) => (dateStr ? DateTime.fromISO(dateStr).toLocaleString(Date.SHORT) : dateStr);
