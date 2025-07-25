import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { ORGANIZATION_NAME_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

const organizationName = 'California Service Center';
const orgNameDraft = {
  ...draft,
  startsWithLocked: true,
  endsWithLocked: true,
  sections: [
    {
      id: '64feda2f-1a05-46a5-9198-350aabbdac64',
      draftId: '2a23e42f-3009-465c-8348-28afa146c569',
      text:
        `<p><span data-lexical-custom-node-type="organizationName" data-organization-name="${organizationName}" ` +
        `style="white-space: pre-wrap;">${organizationName}</span></p>`,
      order: 0,
      locked: false,
    },
  ],
};

describe('organization_name variable', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
  });

  it('shows, imports, and deletes the organization_name variable', () => {
    renderWithDraft(orgNameDraft);

    cy.get('.sectionContainer .lexical-editor-input').as('editorInput');
    cy.get('@editorInput').contains(organizationName);
    cy.get('@editorInput').click().contains(ORGANIZATION_NAME_SEARCH_TEXT);
    cy.get('@editorInput').type('{backspace}');
    cy.get('@editorInput').should('have.value', '');
  });

  it('types in the organization_name variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(ORGANIZATION_NAME_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    editor.contains(emptyDraft.organization.name);
  });

  it('bolds, italicizes, underlines the organization_name variable', () => {
    renderWithDraft(orgNameDraft);

    const editor = cy.get('[class="lexical-editor-input "]');
    editor.focus();
    cy.get('[title="Format Text"]').eq(1).should('be.visible').click();

    cy.get('[aria-label="Format Bold"]').eq(0).click();
    cy.get('[aria-label="Format Italic"]').eq(0).click();
    cy.get('[aria-label="Format Underline"]').eq(0).click();
  });

  it('hydrates the organization_name variable if the editor is readonly', () => {
    renderWithDraft(orgNameDraft);

    cy.get('.sectionContainer .lexical-editor-input').contains(orgNameDraft.organization.name);
  });
});
