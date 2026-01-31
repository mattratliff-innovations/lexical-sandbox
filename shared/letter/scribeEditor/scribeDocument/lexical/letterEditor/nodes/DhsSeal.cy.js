import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { emptyDraft, mockComponentApiIntercepts, renderWithDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { LETTERHEADER_CIS_SEAL_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

describe('dhs seal variable', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
    mockComponentApiIntercepts();
  });

  it('shows, import, and deletes the dhs seal variable', () => {
    const dhsSealDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>
                <span data-lexical-custom-node-type="dhsSeal"
                  data-dhs-seal="/__cypress/src/static/media/uscis-seal.5ffdc18103bee156f6859b043f8d6632.svg">
                  <img alt="US Department of Homeland Security seal, US Citizenship and Immigration Services" src="data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"/>
                </span>
               </p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(dhsSealDraft);
    cy.get('.letterheader-container').find('img.img-dhs-seal').should('exist'); // in header
    cy.get('.lexical-editor-input span[data-dhs-seal="/__cypress/src/static/media/uscis-seal.5ffdc18103bee156f6859b043f8d6632.svg"]').should(
      'have.attr',
      'data-lexical-custom-node-type',
      'dhsSeal'
    );
    cy.get('.sectionContainer .lexical-editor-input img').should('exist'); // in editor
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').click({ force: true });
    cy.get('@editor').contains(LETTERHEADER_CIS_SEAL_SEARCH_TEXT);
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').type('{backspace}');
    cy.get('@editor').should('have.value', '');
  });

  it('types in the dhs seal variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    cy.get('.sectionContainer .lexical-editor-input').as('editor');
    cy.get('@editor').type(LETTERHEADER_CIS_SEAL_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('@editor').click();
    cy.get('.sectionContainer .lexical-editor-input span')
      .should('have.attr', 'data-lexical-custom-node-type', 'dhsSeal')
      .and('have.attr', 'data-dhs-seal', '/__cypress/src/src/assets/uscis-seal.svg');
    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('hydrates the dhs seal variable if the editor is readonly', () => {
    const dhsSealDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${LETTERHEADER_CIS_SEAL_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(dhsSealDraft);

    cy.get('.sectionContainer .lexical-editor-input span')
      .should('have.attr', 'data-lexical-custom-node-type', 'dhsSeal')
      .and('have.attr', 'data-dhs-seal', '/__cypress/src/src/assets/uscis-seal.svg');

    cy.get('.sectionContainer .lexical-editor-input img').should('exist');
  });

  it('shows no DHS Seal if variable not in header or editor', () => {
    const noDhsSealDraft = {
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

    renderWithDraft(noDhsSealDraft);

    cy.get('.sectionContainer .lexical-editor-input img').should('not.exist');
    cy.get('.letterheader-container').find('img.img-dhs-seal').should('not.exist');
  });
});
