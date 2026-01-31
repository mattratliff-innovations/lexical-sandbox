import { DateTime } from 'luxon';

import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { mockComponentApiIntercepts, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { RPCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

describe('userNode', () => {
  beforeEach(() => {
    cy.viewport(1280, 1024);
    mockComponentApiIntercepts();
  });

  const mockedCurrentUser = { rpcode: 'BOND007' }; // Mocked currentUser object
  const variableValueAndName = [{ [RPCODE_SEARCH_TEXT]: mockedCurrentUser.rpcode }];

  it.skip('shows the user variables', () => {
    variableValueAndName.forEach((item) => {
      const key = Object.keys(item)[0]; // Variable Name
      const value = item[key]; // Variable Value
      const testDraft = {
        ...draft,
        sections: [
          {
            id: '64feda2f-1a05-46a5-9198-350aabbdac64',
            draftId: '2a23e42f-3009-465c-8348-28afa146c569',
            text: `<p>
                 <span data-lexical-custom-node-type="user" data-user="${value}" subtype="${key}" style="white-space: pre-wrap;">
                   ${value}
                 </span>
              </p>`,
            order: 0,
            locked: false,
          },
        ],
      };
      renderWithDraft(testDraft, mockedCurrentUser);

      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').contains(value);
      cy.get('@editor').click();
      cy.get('@editor').contains(key);
      cy.get('@editor').click();
      cy.get('@editor').type('{backspace}');
      cy.get('@editor').should('have.value', '');
    });
  });

  it('types in the rpcode variable', () => {
    const testDraft = {
      ...draft,
      sections: [],
    };

    variableValueAndName.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key];
      renderWithDraft(testDraft, mockedCurrentUser);

      cy.get('#addSectionButton').click();
      cy.get('.sectionContainer .lexical-editor-input').as('editor');
      cy.get('@editor').type(key);
      cy.get('#clickableDiv').click();
      cy.get('@editor').contains(value);
    });
  });

  it('hydrates the rpcode variable if the editor is readonly', () => {
    variableValueAndName.forEach((item) => {
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

      renderWithDraft(testDraft, mockedCurrentUser);

      cy.get('.sectionContainer .lexical-editor-input').contains(value);
    });
  });
});
