import { DateTime } from 'luxon';

import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { mockComponentApiIntercepts, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { getCalculatedLetterDateFromDraft } from '../../../../../../../components/dateHelpers';
import {
  ASSOCIATED_RECEIPT_NUMBER_SEARCH_TEXT,
  CREATE_USER_NAME_SEARCH_TEXT,
  CREATE_USER_RP_CD_SEARCH_TEXT,
  CURRENT_DATE_SEARCH_TEXT,
  FORM_TYPE_NAME_SEARCH_TEXT,
  LETTER_APPEALED_FORM_SEARCH_TEXT,
  LETTER_LAST_DECISION_DATE_SEARCH_TEXT,
  LETTER_RECEIPT_DATE_SEARCH_TEXT,
  LETTER_RECEIPT_NUMBER_SEARCH_TEXT,
  LETTERHEADER_LETTER_DATE_SEARCH_TEXT,
  LETTERHEADER_RECEIPT_ANUMBER_SEARCH_TEXT,
} from '../../../ScribeDocumentConstants';
import { formatDate } from '../nodeDomSerializers/DraftSerializerUtil';

describe('letter detail variables', () => {
  beforeEach(() => {
    cy.viewport(1280, 1024);
    mockComponentApiIntercepts();
  });
  const testFormTypeName = draft.registration.formTypeName;
  const testReceiptNumber = draft.registration.receiptNumber;
  const primaryAnumber = draft.applicantTypes[0].aNumber;
  const receiptWithAnumber = `${testReceiptNumber}-${primaryAnumber}`;
  const currentDate = DateTime.now().toFormat('MMMM dd, yyyy');
  const testAssocReceiptNumber = draft.registration.associatedReceiptNumber;
  const testReceiptDate = formatDate(draft.registration.receiptDate);
  const letterAppealedFormTypeCode = draft.registration.appealedFormTypeCode;
  const letterLastDecisionDate = formatDate(draft.lastDecisionDate);
  const letterHeaderLetterDate = getCalculatedLetterDateFromDraft(draft);

  const varaibleValueAndName = [
    { [ASSOCIATED_RECEIPT_NUMBER_SEARCH_TEXT]: testAssocReceiptNumber },
    { [FORM_TYPE_NAME_SEARCH_TEXT]: testFormTypeName },
    { [CURRENT_DATE_SEARCH_TEXT]: currentDate },
    { [LETTER_APPEALED_FORM_SEARCH_TEXT]: letterAppealedFormTypeCode },
    { [LETTER_LAST_DECISION_DATE_SEARCH_TEXT]: letterLastDecisionDate },
    { [LETTERHEADER_LETTER_DATE_SEARCH_TEXT]: letterHeaderLetterDate },
    { [LETTER_RECEIPT_DATE_SEARCH_TEXT]: testReceiptDate },
    { [LETTER_RECEIPT_NUMBER_SEARCH_TEXT]: testReceiptNumber },
    { [LETTERHEADER_RECEIPT_ANUMBER_SEARCH_TEXT]: receiptWithAnumber },
    { [CREATE_USER_NAME_SEARCH_TEXT]: `${draft.creator.firstName} ${draft.creator.lastName}` },
    { [CREATE_USER_RP_CD_SEARCH_TEXT]: draft.creator.rpcode },
  ];

  it('shows, imports, and deletes the letter detail variables', () => {
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
      };
      renderWithDraft(testDraft);

      cy.get('.sectionContainer  .lexical-editor-input').contains(value);
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').click();
      cy.get('@editor').contains(key).type('{backspace}');
      cy.get('.lexical-editor-input').should('have.value', '');
    });
  });

  it('types in the letter detail variable', () => {
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

  it('hydrates the letter detail variable if the editor is readonly', () => {
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
