const DRAFT_ID = 'a433d51b-7e03-4569-be85-0aca400aaacb';

export const usAddress = {
  foreignAddress: false,
  street: '100 Main Street',
  aptSuiteFloor: 'apt 2B',
  city: 'Richmond',
  state: { id: 'ANY', code: 'VA', name: 'Virginia' },
  country: 'USA',
  zipCode: '30165',
};

export const internationalAddress = {
  foreignAddress: true,
  street: '500 Elm Street',
  aptSuiteFloor: 'floor 7',
  city: 'Lexington',
  country: 'Canada',
  postalCode: '99999',
  province: 'Montreal',
};

export const mockLetterRecipientRepresentativeData = [
  {
    type: 'RepresentativeType',
    letterRecipient: true,
    primaryApplicant: false,
    id: '6b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: DRAFT_ID,
    firstName: 'First',
    middleName: 'Mid',
    lastName: 'Last',
    email: 'rep1@gov.com',
    firmName: 'Rep1 Firm',
    inCareOf: 'The Rep',
    createdAt: '2023-08-23T14:16:39.757Z',
    updatedAt: '2023-08-23T14:16:39.757Z',
    errors: {},
    contactAddressXref: { address: usAddress },
  },
  {
    type: 'RepresentativeType',
    letterRecipient: true,
    primaryApplicant: false,
    id: '5b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'aaa',
    middleName: 'ccccc',
    lastName: 'bbb',
    email: 'rep2@gov.com',
    firmName: 'Rep2 Firm',
    inCareOf: 'The Rep2',
    createdAt: '2023-08-23T14:16:39.757Z',
    updatedAt: '2023-08-23T14:16:39.757Z',
    errors: {},
    contactAddressXref: { address: internationalAddress },
  },
];

export const mockLetterRecipientPetitionerData = [
  {
    type: 'PetitionerType',
    letterRecipient: true,
    primaryApplicant: false,
    id: '6b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'First',
    middleName: 'A',
    lastName: 'Last',
    aNumber: 'A-224567890',
    dateOfBirth: '1995-10-12',
    email: 'pettioner1@gov.com',
    firmName: 'Petitioner Firm',
    inCareOf: 'icoPetitioner',
    createdAt: '2023-08-23T14:16:39.757Z',
    updatedAt: '2023-08-23T14:16:39.757Z',
    contactAddressXref: {
      address: internationalAddress,
    },
  },
];

export const mockLetterRecipientPrimaryApplicantData = [
  {
    type: 'ApplicantType',
    letterRecipient: true,
    primaryApplicant: true,
    id: '7b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'First',
    middleName: 'A',
    lastName: 'Last',
    email: 'rep1@gov.com',
    aNumber: 'A-123456789',
    dateOfBirth: '1995-10-11',
    sex: { id: 'abc', code: 'M', name: 'Male' },
    ssn: '123456789',
    contactAddressXref: {
      address: internationalAddress,
    },
  },
];

export const mockLetterRecipientNonPrimaryApplicantData = [
  {
    type: 'ApplicantType',
    letterRecipient: true,
    primaryApplicant: false,
    id: '7b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'First',
    middleName: 'A',
    lastName: 'Last',
    email: 'app1@gov.com',
    aNumber: 'A-123456789',
    dateOfBirth: '1994-10-11',
    sex: { id: 'abc', code: 'M', name: 'Male' },
    ssn: '777456781',
    contactAddressXref: {
      address: usAddress,
    },
  },
  {
    type: 'ApplicantType',
    letterRecipient: true,
    primaryApplicant: false,
    id: '8b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'qqq',
    middleName: 'rrr',
    lastName: 'sss',
    email: 'app2@gov.com',
    aNumber: 'A-444456789',
    dateOfBirth: '1995-07-12',
    sex: { id: 'def', code: 'F', name: 'Female' },
    ssn: '888456782',
    contactAddressXref: {
      address: internationalAddress,
    },
  },
];

export const mockOtherContactNonPrimaryApplicant = [
  {
    type: 'ApplicantType',
    letterRecipient: false,
    primaryApplicant: false,
    id: '7b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'First',
    middleName: 'A',
    lastName: 'Last',
    email: 'rep1@gov.com',
    aNumber: 'A-123456789',
    dateOfBirth: '1995-11-12',
    sex: { id: 'abc', code: 'M', name: 'Male' },
    ssn: '123456783',
    contactAddressXref: {
      address: usAddress,
    },
  },
];

export const mockOtherContactPetitionerData = [
  {
    type: 'PetitionerType',
    letterRecipient: false,
    primaryApplicant: false,
    id: '6b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: 'fff',
    middleName: 'ggg',
    lastName: 'jjj',
    aNumber: 'A-553367890',
    dateOfBirth: '1997-10-20',
    firmName: 'Old Firm',
    inCareOf: 'ico',
    createdAt: '2023-08-23T14:16:39.757Z',
    updatedAt: '2023-08-23T14:16:39.757Z',
    contactAddressXref: {
      address: internationalAddress,
    },
  },
];

export const mockBlankContactData = [
  {
    type: 'ApplicantType',
    letterRecipient: true,
    primaryApplicant: true,
    id: '7b2ac546-535d-4e03-b20b-2727249f0f16',
    draftId: '5966c446-51aa-49be-b0db-afcdee71e1ba',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    aNumber: '',
    dateOfBirth: '',
    sex: '',
    ssn: '',
  },
];

export const mockContactNoAddress = {
  type: 'ApplicantType',
  letterRecipient: true,
  primaryApplicant: true,
  id: '2bafc655-f5c1-47ea-a1f6-ceb9bd6bda1f',
  draftId: DRAFT_ID,
  firstName: 'No',
  middleName: 'Address',
  lastName: 'Human',
  email: 'no.human@thisaddress.com',
  aNumber: '',
  dateOfBirth: '',
  sex: '',
  ssn: '',
  errors: {
    print: ['Recipient does not have an address.'],
  },
};
