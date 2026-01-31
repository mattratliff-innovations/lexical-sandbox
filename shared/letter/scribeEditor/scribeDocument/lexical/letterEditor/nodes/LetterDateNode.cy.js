import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { emptyDraft, mockComponentApiIntercepts, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { getCalculatedLetterDateFromDraft } from '../../../../../../../components/dateHelpers';
import { LETTER_DATE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

describe('letter date variable', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
    mockComponentApiIntercepts();
  });

  const letterDate = getCalculatedLetterDateFromDraft(draft);

  it('shows, imports, and deletes the letter date variable', () => {
    const letterDateDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text:
            `<p><span data-lexical-custom-node-type="letterDate" data-letter-date="${letterDate}" ` +
            `style="white-space: pre-wrap;">${letterDate}</span></p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(letterDateDraft);

    cy.get('.sectionContainer  .lexical-editor-input').contains(letterDate);
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').click();
    cy.get('@editor').contains(LETTER_DATE_SEARCH_TEXT);
    cy.get('@editor').type('{backspace}');
    cy.get('.lexical-editor-input').should('have.value', '');
  });

  it('types in the letter date variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').type(LETTER_DATE_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('@editor').contains(letterDate);
  });

  it('hydrates the letter date variable if the editor is readonly', () => {
    const letterDateDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${LETTER_DATE_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(letterDateDraft);

    cy.get('.sectionContainer .lexical-editor-input').contains(letterDate);
  });
});
