import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import Lexical4Admin from './Lexical4Admin';

export default function TestableLexical4AdminForm() {
  const containerRef = useRef(null);
  const { handleSubmit, control } = useForm({ mode: 'all' });

  const onSubmit = async (data) => {
    containerRef.current.innerHTML = data.testEditor;
  };

  const handleButtonClick = (ev) => {
    ev.preventDefault();
    handleSubmit(onSubmit)();
  };

  return (
    <>
      <form>
        <Lexical4Admin id="testEditor" name="testEditor" control={control} />
        <button onClick={handleButtonClick} id="submitButton" type="button">
          Submit
        </button>
      </form>
      <div id="testContainer" ref={containerRef} />
    </>
  );
}

describe('<Lexical4Admin />', () => {
  const mockSnippetGroupData = [
    {
      id: 'SG1ID',
      name: 'Snippet Group 1',
      snippets: [{ id: 'S1', name: 'Snippet 1', content: 'the test content' }],
    },
  ];

  const mockStandardParagraphData = [
    {
      id: 'f4015ccf-a91a-4d4b-8aa8-1b4d2c19d71d',
      code: 'STANDARDPARAGRAPH1',
      description: 'Standard Paragraph description 1',
      active: true,
      locked: false,
      content: '<p>Standard Paragraph content 1</p>',
    },
    {
      id: 'a9f2319c-eebf-4e1a-aa65-afa1e4c2b71d',
      code: 'STANDARDPARAGRAPH2',
      description: 'Standard Paragraph description 2',
      active: true,
      locked: true,
      content: '<p>Standard Paragraph content 2</p>',
    },
  ];

  beforeEach(() => {
    cy.mount(<TestableLexical4AdminForm />);
    cy.intercept({ method: 'GET', url: '/api/scribe/v1/snippet_groups' }, mockSnippetGroupData).as('draftGET');
    cy.intercept(
      {
        method: 'GET',
        url: '/api/scribe/v1/snippet_groups/snippet_groups_for_letter_type*',
      },
      mockSnippetGroupData
    ).as('draftGET');
    cy.intercept(
      {
        method: 'GET',
        url: '/api/scribe/v1/standard_paragraphs/available_standard_paragraphs_form_letter_type*',
      },
      mockStandardParagraphData
    ).as('getAvailableStandardParagraphs');
  });
  it('renders Admin Editor with toggle able tool bar', () => {
    const editor = cy.get('.lexical-editor-input');
    editor.type('regular');
    const showToolBarBtn = cy.get('[title="Show Tool Bar"]');
    showToolBarBtn.click();

    const hideToolBarBtn = cy.get('[title="Hide Tool Bar"]');
    hideToolBarBtn.click();

    cy.get('#submitButton').click();

    cy.get('#testContainer').contains('regular');
  });
});
