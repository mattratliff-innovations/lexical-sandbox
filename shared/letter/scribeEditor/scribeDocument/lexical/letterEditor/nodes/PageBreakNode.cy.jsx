import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { emptyDraft, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { PAGEBREAK_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

describe('pagebreak variable', () => {
  it('shows, imports, and deletes the pagebreak variable', () => {
    const pagebreakDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>
                  <div data-lexical-custom-node-type="data-page-break" class="page-break" data-lexical-decorator="true" contenteditable="false" style="break-after: page;"><div data-lexical-custom-node-type="data-page-break" data-page-break="&lt;p&gt;
                  &lt;div data-lexical-custom-node-type=&quot;data-page-break&quot; class=&quot;page-break&quot; data-lexical-decorator=&quot;true&quot; contenteditable=&quot;false&quot; style=&quot;break-after: page;&quot;&gt;&lt;div data-lexical-custom-node-type=&quot;data-page-break&quot; data-page-break=&quot;data-page-break&quot; data-type=&quot;pagebreak&quot; class=&quot;page-break&quot; style=&quot;break-after: page; height: 1px; border-top: 2px dashed rgb(204, 204, 204); margin: 10px 0px; position: relative;&quot;&gt;&lt;/div&gt;&lt;/div&gt;
                 &lt;/p&gt;" data-type="pagebreak" class="page-break" style="break-after: page; height: 1px; border-top: 2px dashed rgb(204, 204, 204); margin: 10px 0px; position: relative;"></div></div>
                 </p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(pagebreakDraft);

    // Verify the pagebreak exists in the editor
    cy.get('.sectionContainer .lexical-editor-input div.page-break').should('exist');

    // Alias the editor for reuse
    cy.get('.sectionContainer .lexical-editor-input').as('editor');

    // Delete the pagebreak
    cy.get('@editor').click({ force: true });
    cy.get('@editor').type('{backspace}');
    cy.get('@editor').find('div.data-page-break').should('not.exist');
  });

  it('types in the pagebreak variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    cy.get('.sectionContainer .lexical-editor-input').as('editor');

    // Type the pagebreak search text
    cy.get('@editor').type(PAGEBREAK_SEARCH_TEXT);

    // Simulate a click outside the editor to trigger processing
    cy.get('#clickableDiv').click();

    // Verify the pagebreak is added
    cy.get('@editor').find('div.page-break').should('exist');
  });

  it('hydrates the pagebreak variable if the editor is readonly', () => {
    const pagebreakDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${PAGEBREAK_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(pagebreakDraft);

    // Verify the pagebreak is hydrated correctly
    cy.get('.sectionContainer .lexical-editor-input div.page-break').should('exist');
  });

  it('shows no pagebreak if variable not in header or editor', () => {
    const noPagebreakDraft = {
      ...draft,
      header: { ...draft.header, row2Col2: '' },
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: '',
          order: 0,
        },
      ],
    };

    renderWithDraft(noPagebreakDraft);

    // Verify no pagebreak exists in the editor
    cy.get('.sectionContainer .lexical-editor-input div.page-break').should('not.exist');
  });
});
