import { renderWithDraft, emptyDraft } from '../../../../../../../cypress/support/scribeEditor';

describe('<LetterEditor />', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
  });

  const oneSectionDraft = {
    ...emptyDraft,
    startsWithLocked: true,
    endsWithLocked: true,
    sections: [
      {
        id: 'testableEditor',
        draftId: '2a23e42f-3009-465c-8348-28afa146c569',
        text: '',
        order: 0,
        locked: false,
      },
    ],
  };

  describe('table', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('allows to select an 8x8 grid table popup', () => {
      const editor = cy.get('#content-editable-editor-testableEditor');
      editor.focus();
      cy.get('[title="Format Text"]').eq(1).click();
      cy.get('[aria-label="Insert Table"]').click();

      cy.get('.lexical-table-popup-grid-cell').then((cells) => {
        cy.wrap(cells[18]).trigger('mouseover').click();
      });

      const tableSelector = '.lexical-editor-input table';
      cy.get(tableSelector).should('exist').find('tr').should('have.length', 3);

      cy.get(tableSelector).find('th').should('have.length', 5); // yes 5 headers:-)
      cy.get(tableSelector).find('td').should('have.length', 4);
    });

    it('inserts 2 tables at each cursor position', () => {
      const editor = cy.get('#content-editable-editor-testableEditor');
      editor.focus();
      cy.get('[title="Format Text"]').eq(1).click();

      cy.get('[aria-label="Insert Table"]').click();

      // create a 2-headers table first
      cy.get('.lexical-table-popup-grid-cell').then((cells) => {
        cy.wrap(cells[1]).trigger('mouseover').click();
      });

      // move cursor to beginning of editor
      editor.type('{downarrow}{downarrow}{downarrow}');
      cy.get('[aria-label="Insert Table"]').click();

      // create a 3-headers table second (at first position)
      cy.get('.lexical-table-popup-grid-cell').then((cells) => {
        cy.wrap(cells[2]).trigger('mouseover').click();
      });

      // two tables in the editor
      cy.get('.lexical-editor-input').find('table').should('have.length', 2);

      // first table (with 2 headers) is now second in the DOM
      cy.get('.lexical-editor-input').find('table').eq(0).find('th').should('have.length', 2);

      // second table (with 3 headers) is now first in the DOM
      cy.get('.lexical-editor-input').find('table').eq(1).find('th').should('have.length', 3);
    });

    it.skip('inserts no table if user did not click a cell and popup closes', () => {
      const editor = cy.get('#content-editable-editor-testableEditor');
      editor.focus();
      cy.get('[title="Format Text"]').eq(1).click();
      cy.get('[aria-label="Insert Table"]').click();

      // shows popup, but do not click into the cell
      cy.get('.lexical-table-popup-grid-cell').then((cells) => {
        cy.wrap(cells[4]).trigger('mouseover');
      });

      // click out of the table popup selector
      editor.click();

      // no table in the editor
      editor.find('table').should('have.length', 0);

      // no popup
      cy.get('.lexical-table-popup').should('have.length', 0);
    });

    describe('Lexcial table actions', () => {
      beforeEach(() => {
        const editor = cy.get('#content-editable-editor-testableEditor');
        editor.focus();
        cy.get('[title="Format Text"]').eq(1).click();
        cy.get('[aria-label="Insert Table"]').click();
        cy.get('.lexical-table-popup-grid-cell').then((cells) => {
          cy.wrap(cells[18]).trigger('mouseover').click();
        });
        cy.get('th').first().click();
        cy.get('.chevron-down').click();
      });

      it('uses a table action to insert a new row above the current row', () => {
        cy.get('tr')
          .its('length')
          .then((initialRowCount) => {
            cy.get('[data-test-id="table-insert-row-above"]').click();
            cy.get('tr')
              .its('length')
              .then((newCount) => {
                expect(newCount).to.be.greaterThan(initialRowCount);
              });
          });
      });

      it('uses a table action to insert a new row below the current row', () => {
        cy.get('tr')
          .its('length')
          .then((initialRowCount) => {
            cy.get('[data-test-id="table-insert-row-below"]').click();
            cy.get('tr')
              .its('length')
              .then((newCount) => {
                expect(newCount).to.be.greaterThan(initialRowCount);
              });
          });
      });

      it('uses a table action to insert a new column to the left of the current column', () => {
        const rowCount = cy.get('tr').first().find('th').its('length');
        rowCount.then((initialRowCount) => {
          cy.get('[data-test-id="table-insert-column-left"]').click();
          const newRowCount = cy.get('tr').first().find('th').its('length');
          newRowCount.then((newCount) => {
            expect(newCount).to.be.greaterThan(initialRowCount);
          });
        });
      });

      it('uses a table action to insert a new column to the right of the current column', () => {
        const rowCount = cy.get('tr').first().find('th').its('length');
        rowCount.then((initialRowCount) => {
          cy.get('[data-test-id="table-insert-column-right"]').click();
          const newRowCount = cy.get('tr').first().find('th').its('length');
          newRowCount.then((newCount) => {
            expect(newCount).to.be.greaterThan(initialRowCount);
          });
        });
      });

      it('uses a table action to delete the current column', () => {
        const rowCount = cy.get('tr').first().find('th').its('length');
        rowCount.then((initialRowCount) => {
          cy.get('[data-test-id="table-delete-column"]').click();
          cy.get('tr')
            .first()
            .find('th')
            .should('have.length', initialRowCount - 1);
        });
      });

      it('uses a table action to delete the current row', () => {
        const colCount = cy.get('tr').its('length');
        colCount.then((initialColCount) => {
          cy.get('[data-test-id="table-delete-row"]').click();
          cy.get('tr').should('have.length', initialColCount - 1);
        });
      });

      it('uses a table action to delete the table', () => {
        cy.get('[data-test-id="table-delete-table"]').click();
        cy.get('.lexical-editor-input').find('table').should('not.exist');
      });

      it('uses a table action to align table center', () => {
        cy.get('[data-test-id="table-align"]').click();
        cy.get('[data-test-id="align-table-center"]').click();
        cy.get('table').should('have.attr', 'data-align', 'center')
      });

      it('uses a table action to align table right', () => {
        cy.get('[data-test-id="table-align"]').click();
        cy.get('[data-test-id="align-table-right"]').click();
        cy.get('table').should('have.attr', 'data-align', 'right')
      });

      it('uses a table action to align table left', () => {
        cy.get('[data-test-id="table-align"]').click();
        cy.get('[data-test-id="align-table-center"]').click();

        cy.get('[data-test-id="align-table-left"]').click();
        cy.get('table').should('have.attr', 'data-align', 'left')
      });

      it('uses a table action to toggle column header', () => {
        cy.get('[data-test-id="table-toggle-column-header"]').click();
        cy.get('table').find('th').should('have.length', 3);
      });
    });

    describe('Lexical table keyboard actions', () => {
      describe('Keyboard Navigation', () => {
        beforeEach(() => {
          const editor = cy.get('#content-editable-editor-testableEditor');
          editor.focus();
          cy.get('[title="Format Text"]').eq(1).click();

          editor.wait(1000).click();
          cy.get('[aria-label="Insert Table"]').click();
          cy.get('.lexical-table-popup-grid-cell').then((cells) => {
            cy.wrap(cells[18]).trigger('mouseover').click();
          });
        });

        it('should activate the table action menu for the given cell', () => {
          cy.get('body').type('{shift+ctrl}').type('{enter}');
          const tableSelector = '.table-actions-dropdown';
          cy.get(tableSelector).should('exist');
        });
      });
    });

    describe('Maximum of eight columns', () => {
      it('should disable the add column buttons if number of columns is 8', () => {
        const editor = cy.get('#content-editable-editor-testableEditor');
        editor.focus();
        cy.get('[title="Format Text"]').eq(1).click();
        cy.get('[aria-label="Insert Table"]').click();

        cy.get('.lexical-table-popup-grid-cell').then((cells) => {
          cy.wrap(cells[7]).trigger('mouseover').click();
        });

        const tableSelector = '.lexical-editor-input table';
        cy.get(tableSelector).should('exist').find('tr').should('have.length', 1);

        cy.get('th').first().click();
        cy.get('.table-cell-action-button').eq(0).click();
        cy.get('[data-test-id="table-insert-column-right"]').should('have.attr', 'aria-disabled');
        cy.get('[data-test-id="table-insert-column-left"]').should('have.attr', 'aria-disabled');
      });
    });
  });
});
