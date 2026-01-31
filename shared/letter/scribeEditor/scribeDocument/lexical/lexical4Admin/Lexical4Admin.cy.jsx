import React, { useRef } from 'react';

import { useForm } from 'react-hook-form';

import Lexical4Admin from './Lexical4Admin';
import { FeatureFlagsProvider } from '../../../../../admin/flag/FeatureFlagsProvider';

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
    <FeatureFlagsProvider>
      <form>
        <Lexical4Admin id="testEditor" name="testEditor" control={control} />
        <button onClick={handleButtonClick} id="submitButton" type="button">
          Submit
        </button>
      </form>
      <div id="testContainer" ref={containerRef} />
    </FeatureFlagsProvider>
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
    cy.get('.lexical-editor-input').type('regular');
    cy.get('[title="Show Tool Bar"]').click();
    cy.get('[title="Hide Tool Bar"]').click();
    cy.get('#submitButton').click();
    cy.get('#testContainer').contains('regular');
  });

  // SOURCE CODE FEATURE TESTS
  // describe('Source Code Feature', () => {
  //   it('should display source code button in admin toolbar', () => {
  //     cy.get('.lexical-editor-input').as('editor');
  //     cy.get('@editor').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').should('be.visible');
  //   });

  //   it('should toggle between WYSIWYG and source code view', () => {
  //     cy.get('.lexical-editor-input').as('editor');
  //     cy.get('@editor').type('Test content');

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').should('be.visible');
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').should('contain.value', 'Test content');

  //     cy.get('[title="Switch to Editor View"]').click();
  //     cy.get('@editor').should('be.visible');
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').should('not.exist');
  //   });

  //   it('should display clean HTML without Lexical attributes', () => {
  //     cy.get('.lexical-editor-input').type('Clean text');
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]')
  //       .invoke('val')
  //       .then((html) => {
  //         expect(html).not.to.include('data-lexical');
  //         expect(html).not.to.include('contenteditable');
  //         expect(html).not.to.include('class="');
  //       });
  //   });

  //   it('should allow editing HTML and persist changes', () => {
  //     cy.get('.lexical-editor-input').as('editor');
  //     cy.get('@editor').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').clear();
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').type('<p>Custom <strong>HTML</strong> content</p>', {
  //       parseSpecialCharSequences: false,
  //     });

  //     cy.get('[title="Switch to Editor View"]').click();

  //     cy.get('@editor').should('contain.text', 'Custom HTML content');
  //     cy.get('@editor').find('strong').should('contain', 'HTML');
  //   });

  //   it('should wrap loose text in paragraph tags', () => {
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').clear();
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').type('Unwrapped text', { parseSpecialCharSequences: false });

  //     cy.get('[title="Switch to Editor View"]').click();

  //     // Ensure we're back in editor mode and toolbar is ready
  //     cy.get('.lexical-editor-input').should('be.visible').and('not.be.disabled');
  //     cy.get('.lexical-editor-input').click();

  //     // Check if toolbar needs to be opened (may already be open)
  //     cy.get('body').then(($body) => {
  //       if ($body.find('[title="Show Tool Bar"]').length > 0) {
  //         cy.get('[title="Show Tool Bar"]').click();
  //       }
  //     });

  //     cy.get('[title="Switch to Source Code View"]').should('be.visible').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').should('contain.value', '<p>Unwrapped text</p>');
  //   });

  //   it('should sanitize dangerous HTML', () => {
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').clear();
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').type('<p>Safe</p><script>alert("xss")</script>', { parseSpecialCharSequences: false });

  //     cy.get('[title="Switch to Editor View"]').click();

  //     // Ensure we're back in editor mode and toolbar is ready
  //     cy.get('.lexical-editor-input').should('be.visible').and('not.be.disabled');
  //     cy.get('.lexical-editor-input').click();

  //     // Check if toolbar needs to be opened (may already be open)
  //     cy.get('body').then(($body) => {
  //       if ($body.find('[title="Show Tool Bar"]').length > 0) {
  //         cy.get('[title="Show Tool Bar"]').click();
  //       }
  //     });

  //     cy.get('[title="Switch to Source Code View"]').should('be.visible').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]')
  //       .invoke('val')
  //       .then((html) => {
  //         expect(html).not.to.include('<script>');
  //         expect(html).to.include('Safe');
  //       });
  //   });

  //   it('should handle empty content gracefully', () => {
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').clear();
  //     cy.get('[title="Switch to Editor View"]').click();

  //     cy.get('.lexical-editor-input').should('exist');
  //   });

  //   it('should show warning header', () => {
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.contains('HTML Source Code').should('be.visible');
  //     cy.contains('⚠ Invalid HTML may break formatting').should('be.visible');
  //   });

  //   it('should support Ctrl+Enter keyboard shortcut', () => {
  //     cy.get('.lexical-editor-input').click();

  //     cy.get('[title="Show Tool Bar"]').click();
  //     cy.get('[title="Switch to Source Code View"]').click();

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').clear();
  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').type('<p>Shortcut test</p>', { parseSpecialCharSequences: false });

  //     cy.get('textarea[aria-label="HTML Source Code Editor"]').type('{ctrl}{enter}');

  //     cy.get('.lexical-editor-input').should('be.visible');
  //     cy.get('.lexical-editor-input').should('contain.text', 'Shortcut test');
  //   });
  // });
});
