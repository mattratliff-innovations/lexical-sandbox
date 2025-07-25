import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { RECIPIENT_ADDRESS_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

describe('address variable', () => {
  it('shows, import, and deletes the address variable', () => {
    const addressDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>
                <span data-contact-first-name="Standard" data-contact-middle-name="Letter"
                      data-contact-last-name="Recipient" data-contact-id="12aee1bf-fee8-4d98-87e3-ecb755ce2bc3"
                      data-recipient-address-street="42 Adams Way" data-recipient-address-city="San Fernando"
                      data-recipient-address-state="CA" data-recipient-address-zip-code="98765"
                      data-recipient-address-foreign-address="false" data-lexical-custom-node-type="addressType"
                      style="white-space: pre-wrap;">
                  Standard Letter Recipient<br>42 Adams Way <br>San Fernando, CA 98765
                </span>
              </p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(addressDraft);

    cy.get('.sectionContainer .lexical-editor-input').as('section');

    cy.get('@section').click();
    cy.get('@section').contains(RECIPIENT_ADDRESS_SEARCH_TEXT);
    cy.get('@section').type('{backspace}');
    cy.get('@section').should('have.value', '');

    cy.get('@section').blur();

    cy.get('@section').contains('Standard Letter Recipient');
    cy.get('@section').contains('42 Adams Way');
    cy.get('.sectionContainer .lexical-editor-input').contains('San Fernando, CA 98765');
  });

  it('types in the address variable', () => {
    renderWithDraft(emptyDraft);

    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(RECIPIENT_ADDRESS_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    cy.get('.sectionContainer .lexical-editor-input').contains('Standard Letter Recipient');
    cy.get('.sectionContainer .lexical-editor-input').contains('42 Adams Way');
    cy.get('.sectionContainer .lexical-editor-input').contains('San Fernando, CA 98765');
  });

  it('hydrates the address variable if the editor is readonly', () => {
    const receiptDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${RECIPIENT_ADDRESS_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };

    renderWithDraft(receiptDraft);

    cy.get('.sectionContainer .lexical-editor-input').contains('Standard Letter Recipient');
    cy.get('.sectionContainer .lexical-editor-input').contains('42 Adams Way');
    cy.get('.sectionContainer .lexical-editor-input').contains('San Fernando, CA 98765');
  });
});
