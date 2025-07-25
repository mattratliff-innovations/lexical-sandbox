import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { RECEIPT_NUMBER_BARCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

describe('receipt number barcode variable', () => {
  it('shows, import, and deletes the receipt number barcode variable', () => {
    const receiptNumberDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text:
            '<p><span data-lexical-custom-node-type="receiptNumberBarcode" data-receipt-number="IOE1234567890">' +
            '<img alt="Receipt Number Barcode - IOE1234567890" src="data:image/png;base64,iVBORw0K"/></span></p>',
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(receiptNumberDraft);
    cy.get('.lexical-editor-input span[data-receipt-number="IOE1234567890"]').should(
      'have.attr',
      'data-lexical-custom-node-type',
      'receiptNumberBarcode'
    );
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
    cy.get('.sectionContainer .lexical-editor-input').click({ force: true });
    cy.get('.sectionContainer .lexical-editor-input').click({ force: true });
    cy.get('.sectionContainer .lexical-editor-input').contains(RECEIPT_NUMBER_BARCODE_SEARCH_TEXT);
    cy.get('.sectionContainer .lexical-editor-input').type('{backspace}');
    cy.get('.sectionContainer .lexical-editor-input').should('have.value', '');
  });

  it('types in the receipt number barcode variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(RECEIPT_NUMBER_BARCODE_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-lexical-custom-node-type', 'receiptNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-receipt-number', 'IOE1234567890');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('types in the receipt number barcode in any case variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    const variabeInLowerCase = RECEIPT_NUMBER_BARCODE_SEARCH_TEXT.toLowerCase();
    editor.type(variabeInLowerCase);
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-lexical-custom-node-type', 'receiptNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-receipt-number', 'IOE1234567890');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('hydrates the receipt number barcode variable if the editor is readonly', () => {
    const receiptNumberDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${RECEIPT_NUMBER_BARCODE_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(receiptNumberDraft);

    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-lexical-custom-node-type', 'receiptNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-receipt-number', 'IOE1234567890');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('shows variable if there is no receipt number to find', () => {
    const noReceiptNumberDraft = {
      ...draft,
      registration: {},
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${RECEIPT_NUMBER_BARCODE_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(noReceiptNumberDraft);

    cy.get('.sectionContainer .lexical-editor-input span').contains(RECEIPT_NUMBER_BARCODE_SEARCH_TEXT);
  });
});
