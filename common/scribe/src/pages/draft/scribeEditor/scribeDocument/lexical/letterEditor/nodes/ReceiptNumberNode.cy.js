import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { RECEIPT_NUMBER_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

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
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.click();
    editor.contains(RECEIPT_NUMBER_SEARCH_TEXT);
    editor.type('{backspace}');
    cy.get('.lexical-editor-input').should('have.value', '');
  });

  it('types in the receipt number variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(RECEIPT_NUMBER_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    editor.contains(emptyDraft.registration.receiptNumber);
  });

  it('types in the receipt number variable in any case', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    const variabeInLowerCase = RECEIPT_NUMBER_SEARCH_TEXT.toLowerCase();
    editor.type(variabeInLowerCase);
    cy.get('#clickableDiv').click();
    editor.contains(emptyDraft.registration.receiptNumber);
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

    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.contains(receiptDraft.registration.receiptNumber);
  });
});
