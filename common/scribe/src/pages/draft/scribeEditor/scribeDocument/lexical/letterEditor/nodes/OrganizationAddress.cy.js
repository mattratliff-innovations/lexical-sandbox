import { renderWithDraft, emptyDraft } from '../../../../../../../../cypress/support/scribeEditor';
import { ORGANIZATION_ADDRESS_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

describe('organization_address variable', () => {
  it('shows, import, and deletes the address variable', () => {
    const addressDraft = {
      ...draft,
      sections: [
        {
          id: '007bond2f-1a05-46a5-9198-350aabbdac64',
          draftId: '1a23e45f-3009-465c-8348-28afa146c569',
          text: `<p>
                  <span data-lexical-custom-node-type="organizationAddressType" />
                </p>`,
          order: 0,
          locked: false,
        },
      ],
    };

    renderWithDraft(addressDraft);
    const editor = cy.get('.sectionContainer .lexical-editor-input');

    // editor.contains('Nick Name').contains('Pre Address').contains('42 Adams Way');
    // .contains('San Fernando, CA 98765');
    editor.click().contains(ORGANIZATION_ADDRESS_SEARCH_TEXT);
    editor.type('{backspace}').should('have.value', '');
  });

  it('types in the organization_address variable', () => {
    renderWithDraft(emptyDraft);
    const defaultOrgAddress = emptyDraft.organization.organizationAddressXrefs.find((org) => org.default === true).address;
    cy.get('#addSectionButton').click();
    const editor = cy.get('.sectionContainer .lexical-editor-input');
    editor.type(ORGANIZATION_ADDRESS_SEARCH_TEXT);
    cy.get('#clickableDiv').click();
    editor
      .contains(defaultOrgAddress.nickname)
      .contains(defaultOrgAddress.preAddress)
      .contains(defaultOrgAddress.street)
      .contains(`${defaultOrgAddress.city}, ${defaultOrgAddress.state.code} ${defaultOrgAddress.zipCode}`);
  });

  it('hydrates organization_address variable for header and readonly section', () => {
    const orgAddressDraft = {
      ...draft,
      sections: [
        {
          id: '64feda2f-1a05-46a5-9198-350aabbdac64',
          draftId: '2a23e42f-3009-465c-8348-28afa146c569',
          text: `<p>${ORGANIZATION_ADDRESS_SEARCH_TEXT}</p>`,
          order: 0,
        },
      ],
    };
    const defaultOrgAddress = orgAddressDraft.organization.organizationAddressXrefs.find((org) => org.default === true).address;

    renderWithDraft(orgAddressDraft);

    cy.get('.sectionContainer .lexical-editor-input')
      .contains(defaultOrgAddress.nickname)
      .contains(defaultOrgAddress.preAddress)
      .contains(defaultOrgAddress.street)
      .contains(`${defaultOrgAddress.city}, ${defaultOrgAddress.state.code} ${defaultOrgAddress.zipCode}`);

    cy.get('.letterheader-container .row1Col2')
      .contains(defaultOrgAddress.nickname)
      .contains(defaultOrgAddress.preAddress)
      .contains(defaultOrgAddress.street)
      .contains(`${defaultOrgAddress.city}, ${defaultOrgAddress.state.code} ${defaultOrgAddress.zipCode}`);
  });

  it('hydrates organization_address variable in header for foreign address', () => {
    const foreignAddressDraft = {
      ...draft,
      organization: {
        organizationSignatures: draft.organization.organizationSignatures,
        organizationAddressXrefs: [
          {
            default: true,
            address: {
              nickname: 'Saigon',
              preAddress: 'US Embassy of Saigon',
              street: '1975 Ho Chi Minh Road',
              city: 'Ho Chi Minh City',
              province: 'North Province',
              postalCode: '899000',
              country: 'VIETNAM',
              foreignAddress: 'true',
              type: 'AddressOrganizationType',
            },
          },
        ],
      },
    };
    const defaultOrgAddress = foreignAddressDraft.organization.organizationAddressXrefs.find((org) => org.default === true).address;

    renderWithDraft(foreignAddressDraft);

    cy.get('.letterheader-container .row1Col2')
      .contains(defaultOrgAddress.nickname)
      .contains(defaultOrgAddress.preAddress)
      .contains(defaultOrgAddress.street)
      .contains(`${defaultOrgAddress.city} ${defaultOrgAddress.province} ${defaultOrgAddress.postalCode}`)
      .contains(defaultOrgAddress.country);
  });
});
