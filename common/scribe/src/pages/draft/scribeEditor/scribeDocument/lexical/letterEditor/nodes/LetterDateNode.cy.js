import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { LETTER_DATE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { getCalculatedLetterDateFromDraft } from '../../../../../../../components/dateHelpers';

describe('letter date variable', () => {
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
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.click();
    editor.contains(LETTER_DATE_SEARCH_TEXT);
    editor.type('{backspace}');
    cy.get('.lexical-editor-input').should('have.value', '');
  });

  it('types in the letter date variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(LETTER_DATE_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    editor.contains(letterDate);
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

    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.contains(letterDate);
  });
});
