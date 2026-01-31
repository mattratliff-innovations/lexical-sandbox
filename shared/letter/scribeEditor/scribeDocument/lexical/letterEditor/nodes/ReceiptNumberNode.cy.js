import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { emptyDraft, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { RECEIPT_NUMBER_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

describe('receipt number variable', () => {
  it('shows, imports, and deletes the receipt number variable', () => {
    const receiptNumber = 'IOE1234567890';
    const receiptDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text:
            `<p><span data-lexical-custom-node-type="receiptNumber" data-receipt-number="${receiptNumber}" ` +
            `style="white-space: pre-wrap;">${receiptNumber}</span></p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(receiptDraft);

    cy.get('.sectionContainer  .lexical-editor-input').contains(receiptNumber);
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').click();
    cy.get('@editor').contains(RECEIPT_NUMBER_SEARCH_TEXT);
    cy.get('@editor').type('{backspace}');
    cy.get('.lexical-editor-input').should('have.value', '');
  });

  it('types in the receipt number variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').type(RECEIPT_NUMBER_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('@editor').contains(emptyDraft.registration.receiptNumber);
  });

  it('types in the receipt number variable in any case', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    const variabeInLowerCase = RECEIPT_NUMBER_SEARCH_TEXT.toLowerCase();
    cy.get('@editor').type(variabeInLowerCase);
    cy.get('#clickableDiv').click();
    cy.get('@editor').contains(emptyDraft.registration.receiptNumber);
  });

  it('hydrates the receipt number variable if the editor is readonly', () => {
    const receiptDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${RECEIPT_NUMBER_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(receiptDraft);

    cy.get('.sectionContainer .lexical-editor-input').contains(receiptDraft.registration.receiptNumber);
  });
});
