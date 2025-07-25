import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';

describe('snippets node', () => {
  it('allows snippet groups to be selected, autocompleted, and snippets to be selected', () => {
    const draft = {
      ...emptyDraft,
      sections: [
        {
          id: 'asdf123',
          text: '<p></p>',
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(draft);

    cy.get('.sectionContainer .lexical-editor-input').type('\\');
    // NOTE: the below values are arbitrary since this is mocked data...
    cy.get('.snippet-group ul').find('li').should('have.length', 10);
    cy.get('.sectionContainer .lexical-editor-input').type('snippet2');
    cy.get('.snippet-group ul').find('li').should('have.length', 1);
    cy.get('#typeahead-item-0').click();
    cy.get('select').select('s1g2');
    cy.get('.sectionContainer .lexical-editor-container').contains('Snippet 1 from group 2');
  });
});
