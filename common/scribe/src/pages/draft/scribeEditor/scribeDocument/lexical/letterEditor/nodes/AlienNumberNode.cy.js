import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { ALIEN_NUMBER_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

describe('alien number variable', () => {
  it('shows, imports, and deletes the alien number variable', () => {
    const alienNumber = '223456788';
    const aNumberDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text:
            `<p><span data-lexical-custom-node-type="alienNumber" data-alien-number="${alienNumber}" ` +
            `style="white-space: pre-wrap;">${alienNumber}</span></p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(aNumberDraft);

    cy.get('.sectionContainer  .lexical-editor-input').contains(alienNumber);
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.click();
    editor.contains(ALIEN_NUMBER_SEARCH_TEXT);
    editor.type('{backspace}');
    cy.get('.lexical-editor-input').should('have.value', '');
  });

  it('types in the alien number variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(ALIEN_NUMBER_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    editor.contains(emptyDraft.applicantTypes[0].aNumber);
  });

  it('hydrates the alien number variable if the editor is readonly', () => {
    const aNumberDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${ALIEN_NUMBER_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(aNumberDraft);

    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.contains(emptyDraft.applicantTypes[0].aNumber);
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

    cy.get('.letterheader-container').contains(ALIEN_NUMBER_SEARCH_TEXT).should('not.exist');
  });
});
