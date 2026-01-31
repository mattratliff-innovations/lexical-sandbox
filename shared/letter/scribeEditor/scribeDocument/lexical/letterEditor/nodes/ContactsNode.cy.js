import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { emptyDraft, mockComponentApiIntercepts, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import {
  ALIEN_NUMBER_SEARCH_TEXT,
  PETITIONER_A_NUMBER_SEARCH_TEXT,
  PETITIONER_CITY_SEARCH_TEXT,
  PETITIONER_DOB_SEARCH_TEXT,
  PETITIONER_FIRM_NAME_SEARCH_TEXT,
  PETITIONER_FIRST_NAME_SEARCH_TEXT,
  PETITIONER_IN_CARE_OF_SEARCH_TEXT,
  PETITIONER_LAST_NAME_SEARCH_TEXT,
  PETITIONER_MIDDLE_NAME_SEARCH_TEXT,
  PETITIONER_STATE_SEARCH_TEXT,
  PETITIONER_STREET_SEARCH_TEXT,
  PETITIONER_ZIP_CODE_SEARCH_TEXT,
  PRIMARY_APPLICANT_A_NUMBER_SEARCH_TEXT,
  PRIMARY_APPLICANT_FIRST_NAME_SEARCH_TEXT,
  PRIMARY_APPLICANT_LAST_SEARCH_TEXT,
  PRIMARY_APPLICANT_MIDDLE_NAME_SEARCH_TEXT,
  RECIPIENT_ADDRESS_SEARCH_TEXT,
  REPRESENTATIVE_CITY_SEARCH_TEXT,
  REPRESENTATIVE_COUNTRY_SEARCH_TEXT,
  REPRESENTATIVE_FIRM_NAME_SEARCH_TEXT,
  REPRESENTATIVE_FIRST_NAME_SEARCH_TEXT,
  REPRESENTATIVE_IN_CARE_OF_SEARCH_TEXT,
  REPRESENTATIVE_LAST_NAME_SEARCH_TEXT,
  REPRESENTATIVE_MIDDLE_NAME_SEARCH_TEXT,
  REPRESENTATIVE_POSTAL_CODE_SEARCH_TEXT,
  REPRESENTATIVE_PROVINCE_SEARCH_TEXT,
  REPRESENTATIVE_STATE_SEARCH_TEXT,
  REPRESENTATIVE_STREET1_SEARCH_TEXT,
  REPRESENTATIVE_STREET2_SEARCH_TEXT,
  REPRESENTATIVE_ZIP_CODE_SEARCH_TEXT,
} from '../../../ScribeDocumentConstants';
import { formatAddressLine, primaryApplicant } from '../nodeDomSerializers/DraftSerializerUtil';

// describe('primary applicant city variable', () => {
//   const { city } = primaryApplicant(emptyDraft).address.city;
//   it('shows, imports, and deletes the city variable', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text:
//             `<p><span data-lexical-custom-node-type="contact" data-contact="${primaryApplicant}" subtype="${PRIMARY_APPLICANT_CITY_SEARCH_TEXT}" ` +
//             `style="white-space: pre-wrap;">${city}</span></p>`,
//           order: 0,
//           locked: false,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer  .lexical-editor-input').contains(city);
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').click();
//     cy.get('@editor').contains(PRIMARY_APPLICANT_CITY_SEARCH_TEXT).type('{backspace}');
//     cy.get('.lexical-editor-input').should('have.value', '');
//   });

//   it('types in the primary applicant city variable', () => {
//     renderWithDraft(emptyDraft);

//     cy.get('#addSectionButton').click();
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').type(PRIMARY_APPLICANT_CITY_SEARCH_TEXT);
//     cy.get('#clickableDiv').click();
//     cy.get('@editor').contains(city);
//   });

//   it('hydrates the city variable if the editor is readonly', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text: `<p>${PRIMARY_APPLICANT_CITY_SEARCH_TEXT}</p>`,
//           order: 0,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer .lexical-editor-input').contains(city);
//   });
// });

// describe('primary applicant state variable', () => {
//   const { stateName } = primaryApplicant(emptyDraft).address.state.name;
//   it('shows, imports, and deletes the city variable', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text:
//             `<p><span data-lexical-custom-node-type="contact" data-contact="${primaryApplicant}" subtype="${PRIMARY_APPLICANT_STATE_VARIABLE}" ` +
//             `style="white-space: pre-wrap;">${stateName}</span></p>`,
//           order: 0,
//           locked: false,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer  .lexical-editor-input').contains(stateName);
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').click();
//     cy.get('@editor').contains(PRIMARY_APPLICANT_STATE_VARIABLE).type('{backspace}');
//     cy.get('.lexical-editor-input').should('have.value', '');
//   });

//   it('types in the primary applicant state name variable', () => {
//     renderWithDraft(emptyDraft);

//     cy.get('#addSectionButton').click();
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').type(PRIMARY_APPLICANT_STATE_VARIABLE);
//     cy.get('#clickableDiv').click();
//     cy.get('@editor').contains(stateName);
//   });

//   it('hydrates the state name variable if the editor is readonly', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text: `<p>${PRIMARY_APPLICANT_STATE_VARIABLE}</p>`,
//           order: 0,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer .lexical-editor-input').contains(stateName);
//   });
// });

// describe('primary applicant street variable', () => {
//   const { street } = primaryApplicant(emptyDraft).address.street;
//   it('shows, imports, and deletes the city variable', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text:
//             `<p><span data-lexical-custom-node-type="contact" data-contact="${primaryApplicant}" subtype="${PRIMARY_APPLICANT_STREET_SEARCH_TEXT}" ` +
//             `style="white-space: pre-wrap;">${street}</span></p>`,
//           order: 0,
//           locked: false,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer  .lexical-editor-input').contains(street);
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').click();
//     cy.get('@editor').contains(PRIMARY_APPLICANT_STREET_SEARCH_TEXT).type('{backspace}');
//     cy.get('.lexical-editor-input').should('have.value', '');
//   });

//   it('types in the primary applicant street variable', () => {
//     renderWithDraft(emptyDraft);

//     cy.get('#addSectionButton').click();
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').type(PRIMARY_APPLICANT_STREET_SEARCH_TEXT);
//     cy.get('#clickableDiv').click();
//     cy.get('@editor').contains(street);
//   });

//   it('hydrates the street variable if the editor is readonly', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text: `<p>${PRIMARY_APPLICANT_STREET_SEARCH_TEXT}</p>`,
//           order: 0,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer .lexical-editor-input').contains(street);
//   });
// });

// describe('primary applicant suite apt variable', () => {
//   const { suite } = primaryApplicant(emptyDraft).address.aptSuiteFloor || 'any floor';
//   it('shows, imports, and deletes the suite variable', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text:
//             `<p><span data-lexical-custom-node-type="contact" data-contact="${primaryApplicant}" subtype="${PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT}" ` +
//             `style="white-space: pre-wrap;">${suite}</span></p>`,
//           order: 0,
//           locked: false,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer  .lexical-editor-input').contains(suite);
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').click();
//     cy.get('@editor').contains(PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT).type('{backspace}');
//     cy.get('.lexical-editor-input').should('have.value', '');
//   });

//   it('types in the primary applicant suite variable', () => {
//     renderWithDraft(emptyDraft);

//     cy.get('#addSectionButton').click();
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').type(PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT);
//     cy.get('#clickableDiv').click();
//     cy.get('@editor').contains(suite);
//   });

//   it('hydrates the suite variable if the editor is readonly', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text: `<p>${PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT}</p>`,
//           order: 0,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer .lexical-editor-input').contains(suite);
//   });
// });

// describe('primary applicant zip code variable', () => {
//   const { zipCode } = primaryApplicant(emptyDraft).address.zipCode;
//   it('shows, imports, and deletes the suite variable', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text:
//             `<p><span data-lexical-custom-node-type="contact" data-contact="${primaryApplicant}" subtype="${PRIMARY_APPLICANT_ZIP_SEARCH_TEXT}" ` +
//             `style="white-space: pre-wrap;">${zipCode}</span></p>`,
//           order: 0,
//           locked: false,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer  .lexical-editor-input').contains(zipCode);
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').click();
//     cy.get('@editor').contains(PRIMARY_APPLICANT_ZIP_SEARCH_TEXT).type('{backspace}');
//     cy.get('.lexical-editor-input').should('have.value', '');
//   });

//   it('types in the primary applicant zip code variable', () => {
//     renderWithDraft(emptyDraft);

//     cy.get('#addSectionButton').click();
//     cy.get('.sectionContainer .lexical-editor-input').as('editor');
//     cy.get('@editor').type(PRIMARY_APPLICANT_ZIP_SEARCH_TEXT);
//     cy.get('#clickableDiv').click();
//     cy.get('@editor').contains(zipCode);
//   });

//   it('hydrates the zip code variable if the editor is readonly', () => {
//     const testDraft = {
//       ...draft,
//       sections: [
//         {
//           id: '64feda2f-1a05-46a5-9198-350aabbdac64',
//           draftId: '2a23e42f-3009-465c-8348-28afa146c569',
//           text: `<p>${PRIMARY_APPLICANT_ZIP_SEARCH_TEXT}</p>`,
//           order: 0,
//         },
//       ],
//     };

//     renderWithDraft(testDraft);

//     cy.get('.sectionContainer .lexical-editor-input').contains(zipCode);
//   });
// });

describe('pettioner variables', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
    mockComponentApiIntercepts();
  });

  const petitionerAnumber = 'A-333456788';
  const petitionerCity = 'Pet City';
  const petitonerDob = '2000-10-30';
  const petitionerFirmName = 'abc';
  const petitionerFirstName = 'Frances';
  const petitionerInCareOf = 'Pet in care of';
  const petitionerLastName = 'Pet Last';
  const petitionerMiddleName = 'Pet Middle';
  const petitionerState = 'Pet State';
  const petitionerStreet = 'Pet Street';
  const petitionerZipCode = '12345';

  const varaibleValueAndName = [
    { [PETITIONER_A_NUMBER_SEARCH_TEXT]: petitionerAnumber },
    { [PETITIONER_DOB_SEARCH_TEXT]: '10/30/2000' },
    { [PETITIONER_FIRM_NAME_SEARCH_TEXT]: petitionerFirmName },
    { [PETITIONER_FIRST_NAME_SEARCH_TEXT]: petitionerFirstName },
    { [PETITIONER_LAST_NAME_SEARCH_TEXT]: petitionerLastName },
    { [PETITIONER_MIDDLE_NAME_SEARCH_TEXT]: petitionerMiddleName },
    { [PETITIONER_CITY_SEARCH_TEXT]: petitionerCity },
    { [PETITIONER_IN_CARE_OF_SEARCH_TEXT]: petitionerInCareOf },
    { [PETITIONER_STATE_SEARCH_TEXT]: petitionerState },
    { [PETITIONER_STREET_SEARCH_TEXT]: petitionerStreet },
    { [PETITIONER_ZIP_CODE_SEARCH_TEXT]: petitionerZipCode },
  ];

  const petitioner = {
    id: '38881ede-5081-45e6-bd4a-ec8028021890',
    draftId: '2a23e42f-3009-465c-8348-28afa146c569',
    firstName: petitionerFirstName,
    middleName: petitionerMiddleName,
    lastName: petitionerLastName,
    firmName: petitionerFirmName,
    inCareOf: petitionerInCareOf,
    email: 'standard.l.recipient@gov.gov',
    aNumber: petitionerAnumber,
    sex: 'F',
    ssn: '123456789',
    dateOfBirth: petitonerDob,
    createdAt: '2024-08-09T19:06:48.617Z',
    updatedAt: '2024-08-09T19:06:48.617Z',
    letterRecipient: true,
    primaryApplicant: true,
    mainCopy: true,
    courtesyCopy: false,
    address: {
      id: '79db819a-55e6-408a-ab23-1f468d9b8ffb',
      street: petitionerStreet,
      aptSuiteFloor: null,
      city: petitionerCity,
      state: { id: 'CA1', code: petitionerState, name: petitionerState },
      zipCode: petitionerZipCode,
      province: null,
      postalCode: null,
      country: null,
      createdAt: '2024-08-09T19:06:48.658Z',
      updatedAt: '2024-08-09T19:06:48.658Z',
      preAddress: null,
      nickname: null,
      foreignAddress: false,
      type: 'AddressContactType',
      isMailable: true,
    },
  };

  it('shows, imports, and deletes the petitioner variables', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0]; // Variable Name
      const value = item[key]; // Variable Value
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text:
              `<p><span data-lexical-custom-node-type="contact" data-contact="${value}" subtype="${key}" ` +
              `style="white-space: pre-wrap;">${value}</span></p>`,
            order: 0,
            locked: false,
          },
        ],
        petitionerType: petitioner,
      };
      renderWithDraft(testDraft);

      cy.get('.sectionContainer  .lexical-editor-input').contains(value);
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').click();
      cy.get('@editor').contains(key).type('{backspace}');
      cy.get('.lexical-editor-input').should('have.value', '');
    });
  });

  it('types in the petitoner variable', () => {
    const testDraft = {
      ...draft,
      sections: [],
      petitionerType: petitioner,
    };

    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      renderWithDraft(testDraft);

      cy.get('#addSectionButton').click();
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').type(key);
      cy.get('#clickableDiv').click();
      cy.get('@editor').contains(value);
    });
  });

  it('hydrates the petitoner variable if the editor is readonly', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text: `<p>${key}</p>`,
            order: 0,
          },
        ],
        petitionerType: petitioner,
      };

      renderWithDraft(testDraft);

      cy.get('.sectionContainer .lexical-editor-input').contains(value);
    });
  });
});

describe('representative variables', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
    mockComponentApiIntercepts();
  });

  const representativeCity = 'Rep City';
  const representativeCountry = 'Rep City';
  const representativeFirmName = 'abc';
  const representativeFirstName = 'Frances';
  const representativeInCareOf = 'Rep in care of';
  const representativeLastName = 'Rep Last';
  const representativeMiddleName = 'Rep Middle';
  const representativePostalCode = '55555';
  const representativeProvince = 'Rep Province';
  const representativeState = 'MD';
  const representativeStreet1 = 'Rep Street1';
  const representativeStreet2 = 'Rep Street2';
  const representativeZipCode = '12345';

  const varaibleValueAndName = [
    { [REPRESENTATIVE_FIRM_NAME_SEARCH_TEXT]: representativeFirmName },
    { [REPRESENTATIVE_FIRST_NAME_SEARCH_TEXT]: representativeFirstName },
    { [REPRESENTATIVE_LAST_NAME_SEARCH_TEXT]: representativeLastName },
    { [REPRESENTATIVE_MIDDLE_NAME_SEARCH_TEXT]: representativeMiddleName },
    { [REPRESENTATIVE_CITY_SEARCH_TEXT]: representativeCity },
    { [REPRESENTATIVE_COUNTRY_SEARCH_TEXT]: representativeCountry },
    { [REPRESENTATIVE_IN_CARE_OF_SEARCH_TEXT]: representativeInCareOf },
    { [REPRESENTATIVE_POSTAL_CODE_SEARCH_TEXT]: representativePostalCode },
    { [REPRESENTATIVE_PROVINCE_SEARCH_TEXT]: representativeProvince },
    { [REPRESENTATIVE_STATE_SEARCH_TEXT]: representativeState },
    { [REPRESENTATIVE_STREET1_SEARCH_TEXT]: representativeStreet1 },
    { [REPRESENTATIVE_STREET2_SEARCH_TEXT]: representativeStreet2 },
    { [REPRESENTATIVE_ZIP_CODE_SEARCH_TEXT]: representativeZipCode },
  ];

  const representative = {
    id: '38881ede-5081-45e6-bd4a-ec8028021890',
    draftId: '2a23e42f-3009-465c-8348-28afa146c569',
    firstName: representativeFirstName,
    middleName: representativeMiddleName,
    lastName: representativeLastName,
    firmName: representativeFirmName,
    inCareOf: representativeInCareOf,
    email: 'standard.l.recipient@gov.gov',
    sex: 'F',
    ssn: '123456789',
    createdAt: '2024-08-09T19:06:48.617Z',
    updatedAt: '2024-08-09T19:06:48.617Z',
    letterRecipient: true,
    primaryApplicant: true,
    mainCopy: true,
    courtesyCopy: false,
    address: {
      id: '79db819a-55e6-408a-ab23-1f468d9b8ffb',
      street: representativeStreet1,
      aptSuiteFloor: representativeStreet2,
      city: representativeCity,
      state: { id: 'MD1', code: representativeState, name: representativeState },
      zipCode: representativeZipCode,
      province: representativeProvince,
      postalCode: representativePostalCode,
      country: { id: 'ac', alias: 'CANAD', code: 'CANAD', description: representativeCountry },
      createdAt: '2024-08-09T19:06:48.658Z',
      updatedAt: '2024-08-09T19:06:48.658Z',
      preAddress: null,
      nickname: null,
      foreignAddress: false,
      type: 'AddressContactType',
      isMailable: true,
    },
  };

  it('shows, imports, and deletes the representative variables', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0]; // Variable Name
      const value = item[key]; // Variable Value
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text:
              `<p><span data-lexical-custom-node-type="contact" data-contact="${value}" subtype="${key}" ` +
              `style="white-space: pre-wrap;">${value}</span></p>`,
            order: 0,
            locked: false,
          },
        ],
        representativeType: representative,
      };
      renderWithDraft(testDraft);

      cy.get('.sectionContainer  .lexical-editor-input').contains(value);
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').click();
      cy.get('@editor').contains(key).type('{backspace}');
      cy.get('.lexical-editor-input').should('have.value', '');
    });
  });

  it('types in the petitoner variable', () => {
    const testDraft = {
      ...draft,
      sections: [],
      representativeType: representative,
    };

    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      renderWithDraft(testDraft);

      cy.get('#addSectionButton').click();
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').type(key);
      cy.get('#clickableDiv').click();
      cy.get('@editor').contains(value);
    });
  });

  it('hydrates the petitoner variable if the editor is readonly', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text: `<p>${key}</p>`,
            order: 0,
          },
        ],
        representativeType: representative,
      };

      renderWithDraft(testDraft);

      cy.get('.sectionContainer .lexical-editor-input').contains(value);
    });
  });
});

describe('primary applicant variables', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
    mockComponentApiIntercepts();
  });

  const { address, aNumber, firstName, lastName, middleName } = primaryApplicant(emptyDraft);

  const varaibleValueAndName = [
    { [ALIEN_NUMBER_SEARCH_TEXT]: aNumber },
    { [PRIMARY_APPLICANT_A_NUMBER_SEARCH_TEXT]: aNumber },
    { [PRIMARY_APPLICANT_FIRST_NAME_SEARCH_TEXT]: firstName },
    { [PRIMARY_APPLICANT_LAST_SEARCH_TEXT]: lastName },
    { [PRIMARY_APPLICANT_MIDDLE_NAME_SEARCH_TEXT]: middleName },
    { [RECIPIENT_ADDRESS_SEARCH_TEXT]: formatAddressLine(address) },
  ];

  it('shows, imports, and deletes the primary applicant  variables', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0]; // Variable Name, ex: FIRST_NAME_SEARCH_TEXT
      const value = item[key]; // Variable Value, ex: John
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text:
              `<p><span data-lexical-custom-node-type="contact" data-contact="${value}" subtype="${key}" ` +
              `style="white-space: pre-wrap;">${value}</span></p>`,
            order: 0,
            locked: false,
          },
        ],
      };
      renderWithDraft(testDraft);

      cy.get('.sectionContainer  .lexical-editor-input').contains(value);
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').click();
      cy.get('@editor').contains(key).type('{backspace}');
      cy.get('.lexical-editor-input').should('have.value', '');
    });
  });

  it('types in the primary applicant variable', () => {
    const testDraft = {
      ...draft,
      sections: [],
    };

    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      renderWithDraft(testDraft);

      cy.get('#addSectionButton').click();
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').type(key);
      cy.get('#clickableDiv').click();
      cy.get('@editor').contains(value);
    });
  });

  it('hydrates the primary applicant variable if the editor is readonly', () => {
    varaibleValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text: `<p>${key}</p>`,
            order: 0,
          },
        ],
      };

      renderWithDraft(testDraft);

      cy.get('.sectionContainer .lexical-editor-input').contains(value);
    });
  });
});
