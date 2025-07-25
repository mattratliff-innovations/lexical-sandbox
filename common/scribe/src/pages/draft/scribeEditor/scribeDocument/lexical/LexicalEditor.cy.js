import { renderWithDraft, emptyDraft } from '../../../../../../cypress/support/scribeEditor';

const testToolList = [
  'undo',
  'redo',
  'bold',
  'italic',
  'underline',
  'indent',
  'outdent',
  'numlist',
  'bullist',
  'alignMenu',
  'cut',
  'copy',
  'paste',
  'table',
  'insert',
];

describe('<LexicalEditor />', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);
  });

  const oneSectionDraft = {
    ...emptyDraft,
    startsWithLocked: true,
    endsWithLocked: true,
    sections: [
      {
        id: 'testableEditor1',
        draftId: '2a23e42f-3009-465c-8348-28afa146c569',
        text: '',
        order: 0,
        locked: false,
      },
    ],
  };

  const unlockedAndLockedBeginsEnds = {
    ...emptyDraft,
    startsWithLocked: false,
    endsWithLocked: true,
    sections: [],
  };

  const twoSectionsDraft = {
    ...emptyDraft,
    startsWithLocked: true,
    endsWithLocked: true,
    sections: [
      {
        id: 'testableEditor1',
        draftId: '2a23e42f-3009-465c-8348-28afa146c569',
        text: `<p>editor 1</p>`,
        order: 0,
        locked: false,
      },
      {
        id: 'testableEditor2',
        draftId: '3a23e42f-3009-465c-8348-28afa146c569',
        text: `<p>editor 2</>`,
        order: 1,
        locked: false,
      },
    ],
  };

  describe('with no initial value', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('renders content with different formats', () => {
      // same selector as in components/lexical/LexicalEditor.jsx
      cy.get('[class="lexical-editor-input "]').as('lexicalEditor');
      cy.get('@lexicalEditor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();

      cy.get('@lexicalEditor').type('regular ');
      cy.get('[aria-label="Format Bold"]').as('boldButton');
      cy.get('@boldButton').click();
      cy.get('@lexicalEditor').type('bold ');
      cy.get('@boldButton').click();

      cy.get('[aria-label="Format Italic"]').as('italicButton');
      cy.get('@italicButton').click();
      cy.get('@lexicalEditor').type('italic ');
      cy.get('@italicButton').click();

      cy.get('[aria-label="Format Underline"]').as('underlineButton');
      cy.get('@underlineButton').click();
      cy.get('@lexicalEditor').type('underline{enter}');
      cy.get('@underlineButton').click();

      cy.get('[aria-label="Align Menu"]').as('alignMenuButton');

      cy.get('@alignMenuButton').click();
      cy.get('[title="Align Left"]').as('leftAlignButton');
      cy.get('@leftAlignButton').click();
      cy.get('@lexicalEditor').type('left{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@leftAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[title="Align Center"]').as('centerAlignButton');
      cy.get('@centerAlignButton').click();
      cy.get('@lexicalEditor').type('center{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@centerAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[title="Align Right"]').as('rightAlignButton');
      cy.get('@rightAlignButton').click();
      cy.get('@lexicalEditor').type('right{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@rightAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[title="Justify"]').as('justifyButton');
      cy.get('@justifyButton').click();
      cy.get('@lexicalEditor').type('justify{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@justifyButton').click();

      cy.get('[aria-label="Bulleted List"]').as('bulletButton');
      cy.get('@bulletButton').click();
      cy.get('@lexicalEditor').type('bul1{enter}');
      cy.get('@lexicalEditor').type('bul2{enter}{enter}{enter}');

      cy.get('[aria-label="Numbered List"]').as('numberButton');
      cy.get('@numberButton').click();
      cy.get('@lexicalEditor').type('num1{enter}');
      cy.get('@lexicalEditor').type('num2{enter}{enter}{enter}');

      cy.get('@bulletButton').click();

      cy.get('@lexicalEditor').type('outdent');
      cy.get('[aria-label="Indent"]').as('indent');
      cy.get('@indent').click();
      cy.get('@lexicalEditor').type('{enter}{enter}{enter}');

      cy.get('@bulletButton').click();
      cy.get('@lexicalEditor').type('out then in ');
      cy.get('@indent').click();
      cy.get('@indent').click();
      cy.get('[aria-label="Outdent"]').as('outdent');
      cy.get('@outdent').click();
      cy.get('@outdent').click();

      cy.wait(800);
      cy.get('@lexicalEditor').get('span').contains('regular');
      cy.get('@lexicalEditor').get('strong').contains('bold');
      cy.get('@lexicalEditor').get('em').contains('italic');
      cy.get('@lexicalEditor').get('span.editor-text-underline').contains('underline');
      cy.get('@lexicalEditor').get('[style="text-align: center;"]').contains('center');
      cy.get('@lexicalEditor').get('[style="text-align: right;"]').contains('right');
      cy.get('@lexicalEditor').get('[style="text-align: left;"]').contains('left');
      cy.get('@lexicalEditor').get('[style="text-align: justify;"]').contains('justify');
      cy.get('@lexicalEditor').get('ul.editor-list-ul').contains('bul1');
      cy.get('@lexicalEditor').get('ol.editor-list-ol').contains('num1');
      cy.get('@lexicalEditor').get('ul.editor-list-ul ul.editor-list-ul').contains('outdent');
      cy.get('@lexicalEditor').get('ul.editor-list-ul').contains('out then in');
    });

    describe('Initialization', () => {
      beforeEach(() => {
        renderWithDraft(oneSectionDraft);
      });

      it('should render the editor container', () => {
        cy.get('.lexical-editor-container').should('exist');
        cy.get('.lexical-editor-input').should('exist');
      });
    });

    it('allows keyboard tabbing', () => {
      cy.get('#content-editable-editor-testableEditor1').as('lexicalEditor');

      cy.get('@lexicalEditor').realClick();
      cy.get('[title="Format Text"]').eq(1).realClick();

      cy.get('[title="Format Text"]').eq(1).should('not.be.focused');
      cy.focused().as('undo');
      cy.get(`@undo`).should('have.attr', 'id', `undo`);
      cy.get('#lexical-toolbar-editor-testableEditor1').as('toolbar');
      cy.get('@lexicalEditor').realClick();
      cy.get('@lexicalEditor').should('be.focused');

      const toolListArray = testToolList.reverse();

      // Shift Tab through all the buttons in the toolbar.
      for (let i = 0; i < toolListArray.length; i++) {
        const buttonId = toolListArray[i];
        cy.realPress(['Shift', 'Tab']); // native tab click switches the focus
        cy.focused().as(buttonId);
        cy.get(`@${buttonId}`).should('have.attr', 'id', `${buttonId}`);
      }

      cy.realPress(['Shift', 'Tab']);
      cy.get(`#${toolListArray[toolListArray.length - 1]}`).should('not.be.focused');
    });
  });

  describe('starts and ends with Editing', () => {
    it('should click on unlocked starts with section and verify toolbar button is present', () => {
      renderWithDraft(unlockedAndLockedBeginsEnds);
      cy.get('#content-editable-editor-starts-with-editor').as('lexicalEditor');
      cy.get('@lexicalEditor').click();
      cy.get('[title="Format Text"]').eq(0).should('be.visible');
    });

    it('should click on locked end with section and verify toolbar button is not enabled', () => {
      renderWithDraft(unlockedAndLockedBeginsEnds);
      cy.get('#content-editable-editor-ends-with-editor').as('lexicalEditor');
      cy.get('@lexicalEditor').click();
      cy.get('[title="Format Text"]').eq(0);
      cy.get('[id^="lexical-toolbar-"]').should('not.exist');
    });
  });

  // TYPE INTO THE EDITOR
  describe('Content Editing', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('should allow typing text', () => {
      cy.get('[class="lexical-editor-input "]').focus().type('Hello, World!');
      cy.get('[class="lexical-editor-input "]').should('contain.text', 'Hello, World!');
    });

    it('should maintain content after blur', () => {
      cy.get('[class="lexical-editor-input "]').focus().type('Persistent content').blur();
      cy.get('[class="lexical-editor-input "]').should('contain.text', 'Persistent content');
    });
  });

  // TOGGLE THE TOOLBAR
  describe('Toolbar Interaction', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('should show toolbar by clicking on format-text-button', () => {
      cy.get('[class="lexical-editor-input "]').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();
      cy.get('[id^="lexical-toolbar-"]').should('be.visible');

      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();
      cy.get('[id^="lexical-toolbar-"]').should('not.exist');
    });
  });

  // COPY/PASTE TOOLBAR OPTION
  describe('copy/paste', () => {
    beforeEach(() => {
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      });
      renderWithDraft(twoSectionsDraft);
    });

    it('copy pastes formatting to another editor', () => {
      const editor1 = cy.get('#content-editable-editor-testableEditor1');
      const editor2 = cy.get('#content-editable-editor-testableEditor2');

      editor1.focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();
      editor1.type('{selectAll}');
      editor1.get('#lexical-toolbar-editor-testableEditor1 #bold').should('be.visible').realClick();
      editor1.get('#lexical-toolbar-editor-testableEditor1 #copy').realClick();

      editor2.focus();
      cy.get('[title="Format Text"]').eq(2).click();
      editor2.type(' ');
      cy.wait(500);
      editor2.get('#lexical-toolbar-editor-testableEditor2 #paste').realClick();
      editor2.get('strong').contains('editor 1');
    });
  });

  // CUT TOOLBAR OPTION
  describe('cut', () => {
    const oneSectionDraftWithText = {
      ...emptyDraft,
      ...oneSectionDraft,
      sections: [
        {
          text: '<p>JamesBond007</p>',
        },
      ],
    };

    beforeEach(() => {
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      });
      renderWithDraft(oneSectionDraftWithText);
    });

    it('cuts and paste back editor text', () => {
      const editor = cy.get('[class="lexical-editor-input "]');
      editor.click();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();
      editor.type('{selectAll}');
      editor.get('#cut').realClick();
      editor.get('p').should('not.contain', 'JamesBond007');
      editor.get('#paste').realClick();
      editor.get('p').should('contain', 'JamesBond007');
    });
  });

  // INSERT TOOLBAR OPTION
  describe('insert content', () => {
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
      cy.viewport(1000, 1200); // due to lack of modal the modal will appear below the main editor
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

      renderWithDraft(oneSectionDraft);
    });

    it('inserts snippet content into the editor', () => {
      const editor = cy.get('#content-editable-editor-testableEditor1');
      editor.focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();

      const insertToolbarButton = cy.get('[aria-label="Insert Text"]');
      insertToolbarButton.click();

      // Insert Snippet content from the Modal
      cy.contains('Add Content').should('be.visible');
      cy.get('[data-testid="addSnippetButton"]').shadow().find('button').click({ force: true });
      // Click on the Snippet Group
      cy.get('[data-testid="SG1ID"]').shadow().find('button').click({ force: true });
      // Click on the Snippet
      cy.get('[data-testid="S1"]').click();
      cy.get('[data-testid="addButton"]').shadow().find('button').click({ force: true });
      editor.contains(mockSnippetGroupData[0].snippets[0].content);
    });

    it('inserts locked=false standard-paragraph content into the editor', () => {
      const textBetweenPTags = (text) => /<p>(.*?)<\/p>/.exec(text)[1];
      const editor = cy.get('#content-editable-editor-testableEditor1');
      editor.focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();

      cy.get('[aria-label="Insert Text"]').click(); // click to open modal

      // Insert paragraph content from the Modal into Editor
      cy.get('[data-testid="addStandardParagraphButton"]').shadow().find('button').click({ force: true });
      cy.get('[data-testid="f4015ccf-a91a-4d4b-8aa8-1b4d2c19d71d"]').click(); // click first paragraph
      cy.get('[data-testid="addButton"]').shadow().find('button').click({ force: true });

      editor.contains(textBetweenPTags(mockStandardParagraphData[0].content)); // shows first paragraph in editor

      // The test for locked=true requires testing feature outside the editor; therefore, it is in cypress/e2e/drafts/draft.cy.js
      // as 'inserts locked standard-paragraph as new section'
    });
  });
});
