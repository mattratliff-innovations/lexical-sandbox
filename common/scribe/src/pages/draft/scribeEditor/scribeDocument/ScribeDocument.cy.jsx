import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import ScribeDocument from './ScribeDocument';
import { draft } from '../../../../../cypress/fixtures/scribeEditor/draft';
import { renderWithDraft, emptyDraft } from '../../../../../cypress/support/scribeEditor';

function TestableScribeDocumentFunctions({ draftForRender = {} }) {
  const letterEditorRef = useRef(null);
  const resultDivRef = useRef(null);
  return (
    <>
      <div ref={resultDivRef} id="resultDiv" />
      <ScribeDocument ref={letterEditorRef} draft={draftForRender} />
      <button
        type="button"
        id="letterHtml"
        onClick={() => {
          resultDivRef.current.innerHTML = letterEditorRef.current.letterHtml();
        }}>
        Letter HTML
      </button>
      <button
        type="button"
        id="letterDraftData"
        onClick={() => {
          resultDivRef.current.innerHTML = JSON.stringify(letterEditorRef.current.letterDraftData());
        }}>
        Letter Draft Data
      </button>
    </>
  );
}

TestableScribeDocumentFunctions.propTypes = {
  draftForRender: PropTypes.shape({
    row1Col1: PropTypes.string.isRequired,
  }),
};

// const renderForScribeDocumentMethods = (draftForRender) => {
//   cy.mount(<TestableScribeDocumentFunctions draftForRender={draftForRender} />);
// };

describe('<ScribeDocument />', () => {
  it('adds, moves around, and deletes', () => {
    cy.viewport(690, 790);
    renderWithDraft(emptyDraft);

    for (let i = 0; i < 3; i += 1) {
      cy.get('#addSectionButton').click();
    }
    cy.get('.sectionContainer').find('.lexical-editor-container').should('have.length', 3);

    cy.get('.sectionContainer .lexical-editor-container').eq(0).type('one');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).type('two');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).type('three');

    cy.get('.sectionContainer [aria-label="Move Paragraph Up"]').eq(1).click();
    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('two');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('one');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).contains('three');

    cy.get('.sectionContainer [aria-label="Move Paragraph Up"]').eq(0).click();
    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('two');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('one');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).contains('three');

    cy.get('.sectionContainer [aria-label="Move Paragraph Down"]').eq(0).click();
    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('one');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('two');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).contains('three');

    cy.get('.sectionContainer [aria-label="Move Paragraph Down"]').eq(1).click();
    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('one');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('three');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).contains('two');

    cy.get('.sectionContainer').find('.lexical-editor-input').eq(0).click();

    cy.get('.sectionContainer .lexical-editor-container').eq(0).click();
    cy.get('.sectionContainer [title="Delete Paragraph Text"]').eq(0).click();
    cy.get('[data-testid="YesButton"]').shadow().find('button').click({ force: true });
    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('three');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('two');

    cy.get('.sectionContainer').find('.lexical-editor-input').eq(1).click();

    cy.get('.sectionContainer .lexical-editor-container').eq(1).click();
    cy.get('.sectionContainer [title="Delete Paragraph Text"]').eq(1).click();
    cy.get('[data-testid="YesButton"]').shadow().find('button').click({ force: true });

    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('three');
  });

  it("honors the order column even if the array isn't in the correct order", () => {
    const outOfOrderDraft = {
      ...draft,
      sections: [
        {
          id: '3',
          text: '<p>3</p>',
          order: 2,
        },
        {
          id: '2',
          text: '<p>2</p>',
          order: 1,
        },
        {
          id: '1',
          text: '<p>1</p>',
          order: 0,
        },
      ],
    };
    renderWithDraft(outOfOrderDraft);

    cy.get('.sectionContainer .lexical-editor-container').eq(0).contains('1');
    cy.get('.sectionContainer .lexical-editor-container').eq(1).contains('2');
    cy.get('.sectionContainer .lexical-editor-container').eq(2).contains('3');
  });

  it('hydrates the header and puts the values in the correct locations', () => {
    const defaultRowColValue = '<p>[[[RECEIPT_NUMBER]]]';
    const newRowCols = {};
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 2; col += 1) {
        const rowCol = `row${row}Col${col}`;
        newRowCols[rowCol] = `${defaultRowColValue} ${rowCol} </p>`;
      }
    }
    const draftWithRowCols = { ...draft, header: { ...newRowCols } };

    renderWithDraft(draftWithRowCols);

    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 2; col += 1) {
        const rowCol = `row${row}Col${col}`;
        cy.get(`.${rowCol}`).should('have.text', `${draftWithRowCols.registration.receiptNumber} ${rowCol}`);
      }
    }
  });

  it('add tables in correct section', () => {
    const addTableToSectionAndAssert = (sectionPosition, cellIndex, btn) => {
      cy.get('#addSectionButton').click();
      cy.get('.lexical-editor-input').eq(sectionPosition).click();

      cy.get('[title="Format Text"]').eq(btn).click();
      cy.get('[aria-label="Insert Table"]').click();

      cy.get('.lexical-table-popup-grid-cell').then((cells) => {
        cy.wrap(cells[cellIndex]).trigger('mouseover').click();
      });
      cy.get('.lexical-editor-input')
        .eq(sectionPosition)
        .find('table')
        .find('th')
        .should('have.length', cellIndex + 1);
    };

    renderWithDraft(emptyDraft);

    addTableToSectionAndAssert(1, 1, 1); // Add table to section 1
    addTableToSectionAndAssert(2, 2, 2); // Add table to section 2
  });

  // TODO: Refactor and move these tests to Letter.cy.jsx because this used to be letter.jsx. See https://maestro.dhs.gov/jira/browse/DIDIT-63704

  // describe('letterHtml', () => {
  //   it('pulls out the HTML necessary for rendering a PDF', () => {
  //     const receiptNumberP = '<p>[[[RECEIPT_NUMBER]]]</p>';
  //     const newRowCols = {};
  //     for (let row = 1; row <= 3; row += 1) {
  //       for (let col = 1; col <= 2; col += 1) {
  //         const rowCol = `row${row}Col${col}`;
  //         newRowCols[rowCol] = `<p>${rowCol}</p>`;
  //       }
  //     }
  //     const draftForPdfGeneration = {
  //       ...emptyDraft,
  //       header: { ...newRowCols },
  //       startsWith: receiptNumberP,
  //       endsWith: receiptNumberP,
  //     };

  //     renderForScribeDocumentMethods(draftForPdfGeneration);

  //     cy.get('#addSectionButton').click();
  //     cy.get('#addSectionButton').click();

  //     cy.get('.sectionContainer .lexical-editor-container').eq(0).type('one');
  //     cy.get('.sectionContainer .lexical-editor-container').eq(1).type('two');

  //     cy.get('#letterHtml').click();

  //     for (let row = 1; row <= 3; row += 1) {
  //       for (let col = 1; col <= 2; col += 1) {
  //         const rowCol = `row${row}Col${col}`;
  //         cy.get(`#resultDiv .${rowCol}`).should('have.text', rowCol);
  //       }
  //     }

  //     cy.get('#resultDiv [data-testid="startsWithHtml"]').should(
  //       'have.text',
  //       draftForPdfGeneration.registration.receiptNumber
  //     );
  //     cy.get('#resultDiv [data-testid="sectionsHtml"] .editor-paragraph')
  //       .eq(0)
  //       .should('have.text', 'one');
  //     cy.get('#resultDiv [data-testid="sectionsHtml"] .editor-paragraph')
  //       .eq(1)
  //       .should('have.text', 'two');
  //     cy.get('#resultDiv [data-testid="endsWithHtml"]').should(
  //       'have.text',
  //       draftForPdfGeneration.registration.receiptNumber
  //     );
  //     cy.get('#resultDiv [data-testid="signature"]').should(
  //       'contain.text',
  //       'Sincerely'
  //     );
  //   });
  // });

  // describe('letterDraftData', () => {
  //   it('pulls out the data necessary for saving the draft', () => {
  //     cy.viewport(690, 790);
  //     const receiptNumberP = '<p>[[[RECEIPT_NUMBER]]]</p>';
  //     const newRowCols = {};
  //     for (let row = 1; row <= 3; row += 1) {
  //       for (let col = 1; col <= 2; col += 1) {
  //         const rowCol = `row${row}Col${col}`;
  //         newRowCols[rowCol] = `<p>${rowCol}</p>`;
  //       }
  //     }
  //     const draftForSave = {
  //       ...emptyDraft,
  //       ...newRowCols,
  //       ...{ startsWith: receiptNumberP, endsWith: receiptNumberP },
  //       ...{
  //         sections: [
  //           {
  //             id: '64feda2f-1a05-46a5-9198-350aabbdac64',
  //             draftId: '2a23e42f-3009-465c-8348-28afa146c569',
  //             text: '<p>delete</p>',
  //             locked: false,
  //             order: 0,
  //           },
  //         ],
  //       },
  //       ...{ startsWithLocked: false, endsWithLocked: false },
  //     };

  //     renderForScribeDocumentMethods(draftForSave);
  //     cy.get('.sectionContainer').find('.lexical-editor-input').click();
  //     cy.get('.sectionContainer .lexical-editor-container').click();
  //     cy.get('.sectionContainer [title="Delete Paragraph Text"]').click();
  //     cy.get('[data-testid="YesButton"]')
  //       .shadow()
  //       .find('button')
  //       .click({ force: true });
  //     cy.get('#addSectionButton').click();
  //     cy.get('.sectionContainer .lexical-editor-container').type('save');

  //     cy.get('#letterDraftData').click();

  //     cy.get('#resultDiv')
  //       .invoke('text')
  //       .then((text) => {
  //         const resultJson = JSON.parse(text);
  //         for (let row = 1; row <= 3; row += 1) {
  //           for (let col = 1; col <= 2; col += 1) {
  //             const rowCol = `row${row}Col${col}`;
  //             expect(resultJson[rowCol]).include(rowCol);
  //           }
  //         }
  //         expect(resultJson.startsWith).include(
  //           draftForSave.registration.receiptNumber
  //         );
  //         const deleteSection = resultJson.sectionsAttributes.find(
  //           (section) => section.id === '64feda2f-1a05-46a5-9198-350aabbdac64'
  //         );
  //         expect(deleteSection._destroy).equal(1);
  //         const newSection = resultJson.sectionsAttributes.find(
  //           (section) => section.id === null
  //         );
  //         expect(newSection.text).include('save');
  //         expect(resultJson.endsWith).include(
  //           draftForSave.registration.receiptNumber
  //         );
  //       });
  //   });
  // });
});
