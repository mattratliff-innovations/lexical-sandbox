import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { ALIEN_NUMBER_BARCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

describe('alien number barcode variable', () => {
  it('shows, import, and deletes the alien number barcode variable', () => {
    const addressDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text:
            '<p><span data-lexical-custom-node-type="alienNumberBarcode" data-alien-number="A-223456788">' +
            '<img alt="Alien Number Barcode - A-223456788" src="data:image/png;base64,iVBORw0K"/></span></p>',
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(addressDraft);
    cy.get('.lexical-editor-input span[data-alien-number="A-223456788"]').should('have.attr', 'data-lexical-custom-node-type', 'alienNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
    cy.get('.sectionContainer .lexical-editor-input').click({ force: true });
    cy.get('.sectionContainer .lexical-editor-input').click({ force: true });
    cy.get('.sectionContainer .lexical-editor-input').contains(ALIEN_NUMBER_BARCODE_SEARCH_TEXT);
    cy.get('.sectionContainer .lexical-editor-input').type('{backspace}');
    cy.get('.sectionContainer .lexical-editor-input').should('have.value', '');
  });

  it('types in the alien number barcode variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(ALIEN_NUMBER_BARCODE_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('.sectionContainer .lexical-editor-input').click();
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-lexical-custom-node-type', 'alienNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-alien-number', 'A-223456788');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('hydrates the address variable if the editor is readonly', () => {
    const receiptDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${ALIEN_NUMBER_BARCODE_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(receiptDraft);

    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-lexical-custom-node-type', 'alienNumberBarcode');
    cy.get('.sectionContainer .lexical-editor-input span').should('have.attr', 'data-alien-number', 'A-223456788');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('shows the search text if there is no applicant alien number to find', () => {
    const noANumberDraft = {
      ...draft,
      applicantTypes: [],
      contacts: [],
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          // eslint-disable-next-line max-len
          text: '<p class="editor-paragraph"><span data-lexical-custom-node-type="alienNumberBarcode" data-alien-number="[[[A_NUMBER_BARCODE]]]"><span>[[[A_NUMBER_BARCODE]]]</span></span></p>',
          // eslint-enable-next-line max-len
          order: 0,
        },
      ],
    };

    renderWithDraft(noANumberDraft);

    cy.get('.sectionContainer .lexical-editor-input span').contains(ALIEN_NUMBER_BARCODE_SEARCH_TEXT);
  });

  it('does not show the search/barcode in the header if there is no applicant alien number to find', () => {
    const noANumberDraft = {
      ...draft,
      applicantTypes: [],
      contacts: [],
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          order: 0,
        },
      ],
    };

    renderWithDraft(noANumberDraft);

    cy.get('.letterheader-container').find('img.img-a-number_barcode').should('not.exist');
    cy.get('.letterheader-container').contains(ALIEN_NUMBER_BARCODE_SEARCH_TEXT).should('not.exist');
  });
});
