import { emptyDraft, renderWithDraft } from '../../../../../../cypress/support/scribeEditor';

const testToolList = [
  'undo',
  'redo',
  'blockType',
  'bold',
  'italic',
  'underline',
  'indent',
  'outdent',
  'lists',
  'alignMenu',
  'cut',
  'copy',
  'paste',
  'horizontalrule',
  'clipboardMenu',
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
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

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

      cy.get('@lexicalEditor').type('{enter}before hr');
      cy.get('[title="Horizontal Rule"]').as('hrButton');
      cy.get('@hrButton').click();
      cy.get('@lexicalEditor').type('after hr');

      cy.get('[aria-label="Align Menu"]').as('alignMenuButton');

      cy.get('@alignMenuButton').click();
      cy.get('[id="alignleft"]').as('leftAlignButton');
      cy.get('@leftAlignButton').click();
      cy.get('@lexicalEditor').type('left{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@leftAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[id="aligncenter"]').as('centerAlignButton');
      cy.get('@centerAlignButton').click();
      cy.get('@lexicalEditor').type('center{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@centerAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[id="alignright"]').as('rightAlignButton');
      cy.get('@rightAlignButton').click();
      cy.get('@lexicalEditor').type('right{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@rightAlignButton').click();

      cy.get('@alignMenuButton').click();
      cy.get('[id="alignjustify"]').as('justifyButton');
      cy.get('@justifyButton').click();
      cy.get('@lexicalEditor').type('justify{enter}');
      cy.get('@alignMenuButton').click();
      cy.get('@justifyButton').click();

      // Use combined lists dropdown for bulleted list
      cy.get('[aria-label="Insert List"]').as('listsButton');
      cy.get('@listsButton').click();
      cy.get('[id="bulleted"]').click();
      cy.get('@lexicalEditor').type('bul1{enter}');
      cy.get('@lexicalEditor').type('bul2{enter}{enter}{enter}');

      // Use combined lists dropdown for numbered list
      cy.get('@listsButton').click();
      cy.get('[id="numbered"]').click();
      cy.get('@lexicalEditor').type('num1{enter}');
      cy.get('@lexicalEditor').type('num2{enter}{enter}{enter}');

      // Use lists dropdown for another bulleted list
      cy.get('@listsButton').click();
      cy.get('[id="bulleted"]').click();

      cy.get('@lexicalEditor').type('outdent');
      cy.get('[aria-label="Indent"]').as('indent');
      cy.get('@indent').click();
      cy.get('@lexicalEditor').type('{enter}{enter}{enter}');

      cy.get('@listsButton').click();
      cy.get('[id="bulleted"]').click();

      cy.get('@lexicalEditor').type('out then in ');
      cy.get('@indent').click();
      cy.get('@indent').click();
      cy.get('[aria-label="Outdent"]').as('outdent');
      cy.get('@outdent').click();
      cy.get('@outdent').click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(800);
      cy.get('@lexicalEditor').get('span').contains('regular');
      cy.get('@lexicalEditor').get('strong').contains('bold');
      cy.get('@lexicalEditor').get('em').contains('italic');
      cy.get('@lexicalEditor').get('span.editor-text-underline').contains('underline');
      cy.get('@lexicalEditor').get('[style*="text-align: center;"]').contains('center');
      cy.get('@lexicalEditor').get('[style*="text-align: right;"]').contains('right');
      cy.get('@lexicalEditor').get('[style*="text-align: left;"]').contains('left');
      cy.get('@lexicalEditor').get('[style*="text-align: justify;"]').contains('justify');
      cy.get('@lexicalEditor').get('ul.editor-list-ul').contains('bul1');
      cy.get('@lexicalEditor').get('ol.editor-list-ol').contains('num1');
      cy.get('@lexicalEditor').get('ul.editor-list-ul ul.editor-list-ul').contains('outdent');
      cy.get('@lexicalEditor').get('ul.editor-list-ul').contains('out then in');
      cy.get('@lexicalEditor').get('hr').should('exist');
    });

    describe('List Style Dropdown - New List Types', () => {
      beforeEach(() => {
        renderWithDraft(oneSectionDraft);
        cy.get('[class="lexical-editor-input "]').as('lexicalEditor');
        cy.get('@lexicalEditor').realClick();
        cy.get('[title="Format Text"]').eq(1).should('be.visible');
        cy.get('[aria-label="Insert List"]').as('listsButton');
      });

      it('applies lowercase Roman numeral list style', () => {
        cy.get('@listsButton').click();
        cy.get('[id="lowerRoman"]').click();

        cy.get('@lexicalEditor').type('First item{enter}');
        cy.get('@lexicalEditor').type('Second item{enter}');
        cy.get('@lexicalEditor').type('Third item{enter}{enter}{enter}');

        cy.get('ol[type="i"]').should('exist');
        cy.get('ol').should('have.css', 'list-style-type', 'lower-roman');

        cy.get('ol').contains('First item');
        cy.get('ol').contains('Second item');
        cy.get('ol').contains('Third item');
      });

      it('applies uppercase Roman numeral list style', () => {
        cy.get('@listsButton').click();
        cy.get('[id="upperRoman"]').click();

        cy.get('@lexicalEditor').type('Item one{enter}');
        cy.get('@lexicalEditor').type('Item two{enter}');
        cy.get('@lexicalEditor').type('Item three{enter}{enter}{enter}');

        cy.get('ol[type="I"]').should('exist');
        cy.get('ol').should('have.css', 'list-style-type', 'upper-roman');

        cy.get('ol').contains('Item one');
        cy.get('ol').contains('Item two');
      });

      it('applies lowercase alphabetical list style', () => {
        cy.get('@listsButton').click();
        cy.get('[id="lowerAlpha"]').click();

        cy.get('@lexicalEditor').type('Alpha item{enter}');
        cy.get('@lexicalEditor').type('Beta item{enter}');
        cy.get('@lexicalEditor').type('Gamma item{enter}{enter}{enter}');

        cy.get('ol[type="a"]').should('exist');
        cy.get('ol').should('have.css', 'list-style-type', 'lower-alpha');

        cy.get('ol').contains('Alpha item');
        cy.get('ol').contains('Beta item');
      });

      it('applies uppercase alphabetical list style', () => {
        cy.get('@listsButton').click();
        cy.get('[id="upperAlpha"]').click();

        cy.get('@lexicalEditor').type('First letter{enter}');
        cy.get('@lexicalEditor').type('Second letter{enter}');
        cy.get('@lexicalEditor').type('Third letter{enter}{enter}{enter}');

        cy.get('ol[type="A"]').should('exist');
        cy.get('ol').should('have.css', 'list-style-type', 'upper-alpha');

        cy.get('ol').contains('First letter');
        cy.get('ol').contains('Second letter');
      });
    });

    describe('Multiple Lists with Different Styles', () => {
      beforeEach(() => {
        renderWithDraft(oneSectionDraft);
        cy.get('[class="lexical-editor-input "]').as('lexicalEditor');
        cy.get('@lexicalEditor').realClick();
        cy.get('[title="Format Text"]').eq(1).should('be.visible');
        cy.get('[aria-label="Insert List"]').as('listsButton');
      });

      it('creates multiple lists with different styles in same editor', () => {
        cy.get('@listsButton').click();
        cy.get('[id="lowerRoman"]').click();
        cy.get('@lexicalEditor').type('Roman one{enter}Roman two{enter}{enter}{enter}');

        cy.get('@lexicalEditor').type('Normal text between lists{enter}{enter}');

        cy.get('@listsButton').click();
        cy.get('[id="upperAlpha"]').click();
        cy.get('@lexicalEditor').type('Alpha A{enter}Alpha B{enter}{enter}{enter}');

        cy.get('ol[type="i"]').should('exist').and('contain', 'Roman one');
        cy.get('ol[type="A"]').should('exist').and('contain', 'Alpha A');

        cy.get('p').should('contain', 'Normal text between lists');
      });
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

      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('@lexicalEditor').focus();
      cy.get('@lexicalEditor').should('be.focused');

      const toolListArray = testToolList.reverse();

      for (let i = 0; i < toolListArray.length; i += 1) {
        const buttonId = toolListArray[i];

        cy.realPress(['Shift', 'Tab']);

        cy.focused().should('have.attr', 'id', buttonId);
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
      cy.get('#lexical-toolbar-editor-ends-with-editor').should('not.exist');
    });
  });

  // TYPE INTO THE EDITOR
  describe('Content Editing', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('should allow typing text', () => {
      cy.get('[class="lexical-editor-input "]').as('editor');

      cy.get('@editor').focus();

      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('@editor').realClick();

      cy.get('@editor').type('Hello, World!');
      cy.get('@editor').should('contain.text', 'Hello, World!');
    });

    it('should maintain content after blur', () => {
      cy.get('[class="lexical-editor-input "]').as('editor');

      cy.get('@editor').focus();

      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('@editor').realClick();

      cy.get('@editor').type('Persistent content');
      cy.get('@editor').blur();
      cy.get('@editor').should('contain.text', 'Persistent content');
    });
  });

  // TOGGLE THE TOOLBAR
  describe('Toolbar Interaction', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('should show toolbar by default, hide on click, then show again', () => {
      cy.get('#content-editable-editor-testableEditor1').should('be.visible').focus();

      cy.get('[title="Format Text"]').eq(1).should('be.visible');
      cy.get('[id^="lexical-toolbar-"]').should('be.visible');

      cy.get('[title="Format Text"]').eq(1).realClick();
      cy.get('[id^="lexical-toolbar-"]').should('not.exist');

      cy.get('[title="Format Text"]').eq(1).realClick();
      cy.get('[id^="lexical-toolbar-"]').should('be.visible');
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
      cy.get('#content-editable-editor-testableEditor1').as('editor1');

      cy.get('#content-editable-editor-testableEditor2').as('editor2');

      cy.get('@editor1').focus();

      cy.get('[title="Format Text"]').eq(1).should('be.visible').click();

      cy.get('@editor1').type('{selectAll}');

      cy.get('@editor1').get('#lexical-toolbar-editor-testableEditor1 #bold').should('be.visible').realClick();

      cy.get('@editor1').get('#lexical-toolbar-editor-testableEditor1 #copy').realClick();

      cy.get('@editor2').focus();

      cy.get('[title="Format Text"]').eq(2).click();

      cy.get('@editor2').type(' ');

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      cy.get('@editor2').get('#lexical-toolbar-editor-testableEditor2 #paste').realClick();

      cy.get('@editor2').get('strong').contains('editor 1');
    });
  });

  // CUT TOOLBAR OPTION
  describe('cut', () => {
    const oneSectionDraftWithText = {
      ...emptyDraft,
      ...oneSectionDraft,
      sections: [
        {
          id: 'testableEditor1',
          text: '<p>JamesBond007</p>',
          order: 0,
          locked: false,
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
      cy.get('#content-editable-editor-testableEditor1').click();

      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('#content-editable-editor-testableEditor1').type('{selectAll}');

      cy.get('#cut').should('be.visible').realClick();
      cy.get('p').should('not.contain', 'JamesBond007');
      cy.get('#paste').realClick();
      cy.get('p').should('contain', 'JamesBond007');
    });
  });

  describe('Block Type dropdown', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
    });

    it('opens Paragraph Style menu and shows heading options', () => {
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();

      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('#blockType').should('be.visible').and('have.attr', 'aria-label', 'Paragraph Style').click();

      cy.get('[role="menu"]', { timeout: 10000 }).should('exist');

      cy.get('[role="menu"]').then(($menu) => {
        if ($menu.length > 0) {
          cy.get('[role="menu"]').within(() => {
            cy.contains('Paragraph').should('exist');
            cy.contains('Header 1').should('exist');
            cy.contains('Header 2').should('exist');
            cy.contains('Header 3').should('exist');
            cy.contains('Header 4').should('exist');
          });
        }
      });

      cy.realPress('Escape');
    });
  });

  // TABLES AND BORDERS
  const insertTable = () => {
    cy.get('#table').click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('[aria-label="Select row 3, column 3"]').should('be.visible').trigger('mouseover').trigger('mousedown').trigger('mouseup').click();
    cy.get('.scribe_lexical_table').should('exist');
  };

  const openTableMenu = () => {
    // 1. Force focus on the text node to trigger Lexical's selection state
    cy.get('.scribe_lexical_tableCell').first().find('p').click({ force: true });
    // 2. Hover the cell to mount the chevron button
    cy.get('.scribe_lexical_tableCell').first().realHover();
    // 3. Force click the chevron
    cy.get('button.table-cell-action-button').should('exist').click({ force: true });
    // 4. Verify it opened
    cy.get('#table-cell-menu').should('be.visible');
  };

  const toggleBorders = () => {
    cy.get('[data-test-id="table-toggle-borders"]').click();
  };

  describe('Table Borders Toggle', () => {
    const tableDraft = {
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

    beforeEach(() => {
      renderWithDraft(tableDraft);
      cy.get('[class="lexical-editor-input "]').as('lexicalEditor');
      cy.get('@lexicalEditor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      insertTable();
      openTableMenu();
    });

    it('shows "Toggle table borders on" by default', () => {
      cy.get('[data-test-id="table-toggle-borders"]').should('be.visible').and('contain.text', 'Toggle table borders on');
    });

    it('toggles borders on and updates DOM attribute', () => {
      toggleBorders();
      cy.get('.scribe_lexical_table').should('have.attr', 'data-table-borders', 'on');
    });

    it('shows "Toggle table borders off" after toggling on', () => {
      toggleBorders();
      openTableMenu();
      cy.get('[data-test-id="table-toggle-borders"]').should('contain.text', 'Toggle table borders off');
    });

    it('toggles borders off and updates DOM attribute', () => {
      toggleBorders();
      openTableMenu();
      toggleBorders();
      cy.get('.scribe_lexical_table').should('have.attr', 'data-table-borders', 'off');
    });

    it('borders persist after clicking outside the editor', () => {
      toggleBorders();
      cy.get('body').click(0, 0);
      cy.get('.scribe_lexical_table').should('have.attr', 'data-table-borders', 'on');
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
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('[aria-label="Insert standard paragraph, snippet, or variable"]').click();

      // Insert Snippet content from the Modal
      cy.get('[id="add-content-modal"]').should('be.visible');

      cy.get('[data-testid="addSnippetButton"]').shadow().find('button').click({ force: true, multiple: true });
      // Click on the Snippet Group
      cy.get('[data-testid="SG1ID"]').shadow().find('button').click({ force: true, multiple: true });
      // Click on the Snippet
      cy.get('[data-testid="S1"]').click({ force: true, multiple: true });
      cy.get('[data-testid="addButton"]').shadow().find('button').click({ force: true, multiple: true });
      cy.get('@editor').contains(mockSnippetGroupData[0].snippets[0].content);
    });

    it('inserts locked=false standard-paragraph content into the editor', () => {
      const textBetweenPTags = (text) => /<p>(.*?)<\/p>/.exec(text)[1];
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('[aria-label="Insert standard paragraph, snippet, or variable"]').click(); // click to open modal

      // Insert paragraph content from the Modal into Editor
      cy.get('[data-testid="addStandardParagraphButton"]').shadow().find('button').click({ force: true, multiple: true });
      cy.get('[data-testid="f4015ccf-a91a-4d4b-8aa8-1b4d2c19d71d"]').click({ force: true, multiple: true }); // click first paragraph
      cy.get('[data-testid="addButton"]').shadow().find('button').click({ force: true, multiple: true });

      cy.get('@editor').contains(textBetweenPTags(mockStandardParagraphData[0].content)); // shows first paragraph in editor

      // The test for locked=true requires testing feature outside the editor; therefore, it is in cypress/e2e/drafts/draft.cy.js
      // as 'inserts locked standard-paragraph as new section'
    });
  });

  // CLIPBOARD MENU
  describe('Clipboard menu', () => {
    const oneSectionDraftWithText = {
      ...emptyDraft,
      ...oneSectionDraft,
      sections: [{ id: 'testableEditor1', text: '<p>JamesBond007</p>', order: 0, locked: false }],
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
      cy.get('[class="lexical-editor-input "]').as('lexicalEditor');
      cy.get('@lexicalEditor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
      cy.get('[aria-label="Access Clipboard Functions"]').as('clipBoardButton');
    });

    it('cut and paste from clipboard menu', () => {
      cy.get('#content-editable-editor-testableEditor1').click();
      cy.get('#content-editable-editor-testableEditor1').type('{selectAll}');
      cy.get('@clipBoardButton').click();
      cy.get('[id="cut"]').eq(1).click();
      cy.get('p').should('not.contain', 'JamesBond007');
      cy.get('@clipBoardButton').click();
      cy.get('[id="paste"]').eq(1).click();
      cy.get('p').should('contain', 'JamesBond007');
    });

    it('copy and paste from clipboard menu', () => {
      cy.get('#content-editable-editor-testableEditor1').click();
      cy.get('#content-editable-editor-testableEditor1').type('{selectAll}');
      cy.get('@clipBoardButton').click();
      cy.get('[id="copy"]').eq(1).click();
      cy.get('#content-editable-editor-testableEditor1').click();
      cy.get('@clipBoardButton').click();
      cy.get('[id="paste"]').eq(1).click();
      cy.get('p').should('contain', 'JamesBond007JamesBond007');
    });
  });
});
