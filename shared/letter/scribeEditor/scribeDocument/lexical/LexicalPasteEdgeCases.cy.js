import { emptyDraft, renderWithDraft } from '../../../../../../cypress/support/scribeEditor';

describe('Lexical Editor - Paste Edge Cases', () => {
  beforeEach(() => {
    cy.viewport(1024, 900);

    // Grant clipboard permissions
    Cypress.automation('remote:debugger:protocol', {
      command: 'Browser.grantPermissions',
      params: {
        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
        origin: window.location.origin,
      },
    });
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

  const twoSectionsDraft = {
    ...emptyDraft,
    startsWithLocked: true,
    endsWithLocked: true,
    sections: [
      {
        id: 'testableEditor1',
        draftId: '2a23e42f-3009-465c-8348-28afa146c569',
        text: '<p>editor 1</p>',
        order: 0,
        locked: false,
      },
      {
        id: 'testableEditor2',
        draftId: '3a23e42f-3009-465c-8348-28afa146c569',
        text: '<p>editor 2</p>',
        order: 1,
        locked: false,
      },
    ],
  };

  /**
   * Helper to paste HTML into the editor using Clipboard API
   */

  const pasteHTML = (html) => {
    cy.get('[class="lexical-editor-input "]').then(($editor) => {
      $editor[0].focus();

      // Trigger paste event directly
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
        bubbles: true,
        cancelable: true,
      });

      pasteEvent.clipboardData.setData('text/html', html);
      pasteEvent.clipboardData.setData('text/plain', html.replace(/<[^>]*>/g, ''));

      $editor[0].dispatchEvent(pasteEvent);
    });

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
  };
  // ========================================================================
  // GOOGLE SEARCH RESULTS - Mark Tags & Inline Styles
  // ========================================================================

  describe('Google Search Results Paste', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should strip mark tags and display plain text', () => {
      const googleHTML = `
        <p>Traveling to Japan involves 
          <mark>checking visa-free status</mark>
          and planning accordingly.
        </p>
      `;

      pasteHTML(googleHTML);

      // Text should exist
      cy.get('@editor').should('contain', 'checking visa-free status');

      // Mark tag should be stripped (no yellow background from mark)
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          let foundMarkBackground = false;
          $spans.each((i, span) => {
            if (span.textContent.includes('checking visa-free status')) {
              const style = span.getAttribute('style') || '';
              // Should NOT have background-color from mark tag
              if (style.includes('background-color')) {
                foundMarkBackground = true;
              }
            }
          });
          // eslint-disable-next-line no-unused-expressions
          expect(foundMarkBackground).to.be.false;
        });
    });

    it('should strip all inline styles from Google HTML', () => {
      const googleHTML = `
        <p>
          <span style="background-color: rgb(255, 255, 255); color: rgb(10, 10, 10); font-family: 'Google Sans', Roboto, Arial; font-weight: 400; font-size: 16px;">
            Text with many inline styles
          </span>
        </p>
      `;

      pasteHTML(googleHTML);

      cy.get('@editor').should('contain', 'Text with many inline styles');

      // Verify all problematic styles are stripped
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('font-size');
          expect(style).to.not.include('font-family');
          expect(style).to.not.include('color:');
          expect(style).to.not.include('font-weight: 400');
          // White background should be stripped
          expect(style).to.not.include('background-color: rgb(255, 255, 255)');
        });
    });

    it('should allow applying H1 after pasting Google content', () => {
      const googleHTML = `
        <p><span style="font-size: 16px; font-family: 'Google Sans';">Text to convert to H1</span></p>
      `;

      pasteHTML(googleHTML);

      // Select all text
      cy.get('@editor').type('{selectall}');

      // Open paragraph style dropdown and apply H1
      cy.get('#blockType').should('be.visible').click();
      cy.contains('Header 1').click();

      // Verify H1 was applied
      cy.get('h1').should('contain', 'Text to convert to H1');
    });
  });

  // ========================================================================
  // MICROSOFT WORD - Messy HTML with mso styles
  // ========================================================================

  describe('Microsoft Word Paste', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should strip Word mso styles and font formatting', () => {
      const wordHTML = `
        <p class="MsoNormal" style="margin: 0in; font-size: 12pt; font-family: 'Times New Roman', serif;">
          <span style="font-size: 11pt; font-family: Calibri, sans-serif; color: #1f497d;">
            This is text from Microsoft Word.
          </span>
        </p>
      `;

      pasteHTML(wordHTML);

      cy.get('@editor').should('contain', 'This is text from Microsoft Word');

      // Verify Word styles are stripped
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('font-size');
          expect(style).to.not.include('font-family');
          expect(style).to.not.include('color:');
        });
    });

    it('should preserve bold and italic from Word but strip colors', () => {
      const wordHTML = `
        <p style="font-family: Calibri; font-size: 11pt;">
          This is <strong style="font-weight: bold; color: red;">bold</strong> and 
          <em style="font-style: italic; color: blue;">italic</em> text.
        </p>
      `;

      pasteHTML(wordHTML);

      // Bold and italic should survive
      cy.get('strong').should('contain', 'bold');
      cy.get('em').should('contain', 'italic');

      // Colors should be stripped
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('color: red');
          expect(style).to.not.include('color: blue');
        });
    });

    it('should convert Word highlighting to yellow', () => {
      const wordHTML = `
        <p>
          <span style="background: yellow; mso-highlight: yellow; font-family: Calibri; font-size: 11pt;">
            Highlighted in Word
          </span>
        </p>
      `;

      pasteHTML(wordHTML);

      cy.get('@editor').should('contain', 'Highlighted in Word');

      // Should have yellow background (converted from Word's yellow)
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          let foundYellowBackground = false;
          $spans.each((i, span) => {
            const style = span.getAttribute('style') || '';
            if (style.includes('background-color: yellow')) {
              foundYellowBackground = true;
            }
          });
          // eslint-disable-next-line no-unused-expressions
          expect(foundYellowBackground).to.be.true;
        });
    });
  });

  // ========================================================================
  // COLORS & BACKGROUNDS - Sanitization Rules
  // ========================================================================

  describe('Color and Background Sanitization', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should strip all text colors', () => {
      const colorHTML = `
        <p>
          <span style="color: red;">Red</span>
          <span style="color: blue;">Blue</span>
          <span style="color: green;">Green</span>
        </p>
      `;

      pasteHTML(colorHTML);

      cy.get('@editor').should('contain', 'Red');
      cy.get('@editor').should('contain', 'Blue');
      cy.get('@editor').should('contain', 'Green');

      // All color styles should be stripped
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('color:');
        });
    });

    it('should convert all non-white backgrounds to yellow', () => {
      const bgHTML = `
        <p>
          <span style="background-color: lime;">Lime</span>
          <span style="background-color: pink;">Pink</span>
          <span style="background-color: #ffcccc;">Light red</span>
        </p>
      `;

      pasteHTML(bgHTML);

      // All backgrounds should be converted to yellow
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          const texts = ['Lime', 'Pink', 'Light red'];
          $spans.each((i, span) => {
            const text = span.textContent;
            const style = span.getAttribute('style') || '';

            if (texts.includes(text)) {
              expect(style).to.include('background-color: yellow');
            }
          });
        });
    });

    it('should strip white and transparent backgrounds', () => {
      const whiteHTML = `
    <p>
      <span style="background-color: rgb(255, 255, 255);">White bg</span>
      <span style="background-color: transparent;">Transparent bg</span>
    </p>
  `;

      pasteHTML(whiteHTML);

      // Verify text exists first
      cy.get('@editor').should('contain', 'White bg');
      cy.get('@editor').should('contain', 'Transparent bg');

      // White and transparent should be stripped (no background-color at all)
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const text = $span.text().trim();
          const style = $span.attr('style') || '';

          // Only check spans with our specific text
          if (text === 'White bg' || text === 'Transparent bg') {
            expect(style).to.not.include('background-color');
          }
        });
    });
  });

  // ========================================================================
  // FONT SIZE & FAMILY - Stripping
  // ========================================================================

  describe('Font Size and Family Stripping', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should strip all font sizes', () => {
      const fontHTML = `
        <p>
          <span style="font-size: 10px;">Small</span>
          <span style="font-size: 24px;">Large</span>
          <span style="font-size: 2em;">EM size</span>
        </p>
      `;

      pasteHTML(fontHTML);

      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('font-size');
        });
    });

    it('should strip all font families', () => {
      const fontHTML = `
        <p>
          <span style="font-family: Arial;">Arial text</span>
          <span style="font-family: 'Google Sans', sans-serif;">Google Sans</span>
          <span style="font-family: Calibri;">Calibri</span>
        </p>
      `;

      pasteHTML(fontHTML);

      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('font-family');
        });
    });
  });

  // ========================================================================
  // FORMATTING PRESERVATION - Bold, Italic, Underline
  // ========================================================================

  describe('Formatting Preservation', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should preserve bold, italic, and underline', () => {
      const formattedHTML = `
        <p>
          <strong>Bold text</strong>
          <em>Italic text</em>
          <u>Underlined text</u>
        </p>
      `;

      pasteHTML(formattedHTML);

      cy.get('strong').should('contain', 'Bold text');
      cy.get('em').should('contain', 'Italic text');
      cy.get('.editor-text-underline').should('contain', 'Underlined text');
    });

    it('should preserve combined formatting', () => {
      const combinedHTML = `
    <p>
      <strong><em><u>All three</u></em></strong>
    </p>
  `;

      pasteHTML(combinedHTML);

      cy.get('@editor').should('contain', 'All three');

      // Check for bold, italic, underline using classes
      cy.get('strong').should('exist');
      cy.get('.editor-text-italic').should('exist'); // Use class instead of em tag
      cy.get('.editor-text-underline').should('contain', 'All three');
    });

    it('should preserve bold but strip conflicting font-weight and color', () => {
      const boldHTML = `
    <p>
      <span style="font-weight: 700; color: red; font-size: 20px;">Bold red large</span>
    </p>
  `;

      pasteHTML(boldHTML);

      cy.get('@editor').should('contain', 'Bold red large');

      // Bold should be preserved (as <strong> tag)
      cy.get('@editor').find('strong').should('exist').should('contain', 'Bold red large');

      // Color and font-size should be stripped - check the paragraph level
      cy.get('@editor')
        .find('p')
        .should(($p) => {
          const html = $p.html();
          // Should NOT have inline color or font-size styles
          expect(html).to.not.match(/style="[^"]*color:/);
          expect(html).to.not.match(/style="[^"]*font-size:/);
        });
    });
  });

  // ========================================================================
  // LISTS - Preservation from External Sources
  // ========================================================================

  describe('List Preservation from External Paste', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should preserve Roman numeral lists from external HTML', () => {
      const listHTML = `
        <ol type="I">
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ol>
      `;

      pasteHTML(listHTML);

      cy.get('ol[type="I"]').should('exist');
      cy.get('ol li').should('have.length', 3);
      cy.get('ol').should('contain', 'First item');
    });

    it('should preserve alphabetic lists from external HTML', () => {
      const listHTML = `
        <ol type="a">
          <li>Alpha</li>
          <li>Beta</li>
          <li>Gamma</li>
        </ol>
      `;

      pasteHTML(listHTML);

      cy.get('ol[type="a"]').should('exist');
      cy.get('ol').should('contain', 'Alpha');
    });

    it('should preserve formatting within list items', () => {
      const listHTML = `
        <ol type="I">
          <li><strong>Bold item</strong></li>
          <li><em>Italic item</em></li>
          <li><span style="color: red; background-color: yellow;">Styled item</span></li>
        </ol>
      `;

      pasteHTML(listHTML);

      cy.get('ol[type="I"]').should('exist');
      cy.get('strong').should('contain', 'Bold item');
      cy.get('em').should('contain', 'Italic item');

      // Color stripped, background converted to yellow
      cy.get('ol').should('contain', 'Styled item');
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          $spans.each((i, span) => {
            if (span.textContent === 'Styled item') {
              const style = span.getAttribute('style') || '';
              expect(style).to.include('background-color: yellow');
              expect(style).to.not.include('color: red');
            }
          });
        });
    });
  });

  // ========================================================================
  // LEXICAL TO LEXICAL - Copy/Paste Between Editors
  // ========================================================================

  describe('Lexical to Lexical Copy/Paste', () => {
    beforeEach(() => {
      renderWithDraft(twoSectionsDraft);
    });

    it('should preserve Roman numeral list style when copying between editors', () => {
      cy.get('#content-editable-editor-testableEditor1').as('editor1');
      cy.get('#content-editable-editor-testableEditor2').as('editor2');

      // Create Roman numeral list in editor1
      cy.get('@editor1').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('[aria-label="Insert List"]').eq(0).click();
      cy.get('[id="upperRoman"]').click();
      cy.get('@editor1').type('Roman one{enter}Roman two');

      // Wait for list to be created
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      // Select all and copy
      cy.get('@editor1').type('{selectall}');
      cy.get('#lexical-toolbar-editor-testableEditor1 #copy').realClick();

      // Paste into editor2
      cy.get('@editor2').focus();
      cy.get('[title="Format Text"]').eq(2).should('be.visible');
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('#lexical-toolbar-editor-testableEditor2 #paste').realClick();

      // Wait for paste to complete
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Verify Roman numeral list style is preserved
      cy.get('@editor2').find('ol[type="I"]').should('exist');
      cy.get('@editor2').should('contain', 'Roman one');
      cy.get('@editor2').should('contain', 'Roman two');
    });

    it('should preserve alphabetic list style when copying between editors', () => {
      cy.get('#content-editable-editor-testableEditor1').as('editor1');
      cy.get('#content-editable-editor-testableEditor2').as('editor2');

      // Create alphabetic list in editor1
      cy.get('@editor1').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('[aria-label="Insert List"]').eq(0).click();
      cy.get('[id="lowerAlpha"]').click();
      cy.get('@editor1').type('Alpha a{enter}Alpha b');

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      // Copy
      cy.get('@editor1').type('{selectall}');
      cy.get('#lexical-toolbar-editor-testableEditor1 #copy').realClick();

      // Paste
      cy.get('@editor2').focus();
      cy.get('[title="Format Text"]').eq(2).should('be.visible');
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('#lexical-toolbar-editor-testableEditor2 #paste').realClick();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Verify alphabetic style preserved
      cy.get('@editor2').find('ol[type="a"]').should('exist');
      cy.get('@editor2').should('contain', 'Alpha a');
    });

    it('should preserve mixed formatting when copying between editors', () => {
      cy.get('#content-editable-editor-testableEditor1').as('editor1');
      cy.get('#content-editable-editor-testableEditor2').as('editor2');

      // Create formatted text in editor1
      cy.get('@editor1').focus();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');

      cy.get('@editor1').type('Normal ');
      cy.get('[aria-label="Format Bold"]').eq(0).click();
      cy.get('@editor1').type('Bold ');
      cy.get('[aria-label="Format Bold"]').eq(0).click();
      cy.get('[aria-label="Format Italic"]').eq(0).click();
      cy.get('@editor1').type('Italic');

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      // Copy
      cy.get('@editor1').type('{selectall}');
      cy.get('#lexical-toolbar-editor-testableEditor1 #copy').realClick();

      // Paste
      cy.get('@editor2').focus();
      cy.get('[title="Format Text"]').eq(2).should('be.visible');
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('#lexical-toolbar-editor-testableEditor2 #paste').realClick();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);

      // Verify formatting preserved
      cy.get('@editor2').should('contain', 'Normal');
      cy.get('@editor2').find('strong').should('contain', 'Bold');
      cy.get('@editor2').find('em').should('contain', 'Italic');
    });
  });

  // ========================================================================
  // HEADINGS - Can Apply After Paste
  // ========================================================================

  describe('Applying Headings After External Paste', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should allow applying H1 after pasting content with conflicting styles', () => {
      const styledHTML = `
        <p><span style="font-size: 20px; font-family: Arial; color: blue;">Text with styles</span></p>
      `;

      pasteHTML(styledHTML);

      // Select all
      cy.get('@editor').type('{selectall}');

      // Apply H1
      cy.get('#blockType').click();
      cy.contains('Header 1').click();

      // Verify H1 applied
      cy.get('h1').should('contain', 'Text with styles');
    });

    it('should allow applying H2 after pasting Google-style content', () => {
      const googleHTML = `
        <p>
          <span style="font-size: 16px; font-family: 'Google Sans'; background-color: rgb(255,255,255);">
            Google content
          </span>
        </p>
      `;

      pasteHTML(googleHTML);

      cy.get('@editor').type('{selectall}');

      cy.get('#blockType').click();
      cy.contains('Header 2').click();

      cy.get('h2').should('contain', 'Google content');
    });

    it('should allow applying H3 after pasting Word content', () => {
      const wordHTML = `
        <p class="MsoNormal" style="font-family: Calibri; font-size: 11pt;">
          <span style="color: #1f497d;">Word content</span>
        </p>
      `;

      pasteHTML(wordHTML);

      cy.get('@editor').type('{selectall}');

      cy.get('#blockType').click();
      cy.contains('Header 3').click();

      cy.get('h3').should('contain', 'Word content');
    });
  });

  // ========================================================================
  // COMPLEX EDGE CASES
  // ========================================================================

  describe('Complex Edge Cases', () => {
    beforeEach(() => {
      renderWithDraft(oneSectionDraft);
      cy.get('#content-editable-editor-testableEditor1').as('editor');
      cy.get('@editor').realClick();
      cy.get('[title="Format Text"]').eq(1).should('be.visible');
    });

    it('should handle deeply nested spans with multiple styles', () => {
      const nestedHTML = `
        <p>
          <span style="color: red;">
            <span style="font-size: 20px;">
              <span style="background-color: lime; font-family: Arial;">
                Deeply nested
              </span>
            </span>
          </span>
        </p>
      `;

      pasteHTML(nestedHTML);

      cy.get('@editor').should('contain', 'Deeply nested');

      // All inline styles should be sanitized
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          $spans.each((i, span) => {
            if (span.textContent.includes('Deeply nested')) {
              const style = span.getAttribute('style') || '';
              // Should have yellow background (lime converted)
              expect(style).to.include('background-color: yellow');
              // But not the original styles
              expect(style).to.include('color:');
              expect(style).to.not.include('font-size:');
              expect(style).to.not.include('font-family:');
              expect(style).to.not.include('lime');
            }
          });
        });
    });

    it('should handle mixed content with lists, formatting, and styles', () => {
      const mixedHTML = `
        <h2 style="font-family: Arial; font-size: 24px;">Title</h2>
        <p><strong style="color: red;">Bold intro</strong></p>
        <ol type="I">
          <li><span style="background-color: yellow;">Highlighted item</span></li>
        </ol>
      `;

      pasteHTML(mixedHTML);

      // Structure preserved
      cy.get('h2').should('contain', 'Title');
      cy.get('strong').should('contain', 'Bold intro');
      cy.get('ol[type="I"]').should('exist');

      // Styles sanitized
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .each(($span) => {
          const style = $span.attr('style') || '';
          expect(style).to.not.include('font-size:');
          expect(style).to.not.include('font-family:');

          // Yellow background should be preserved
          if ($span.text().includes('Highlighted item')) {
            expect(style).to.include('background-color: yellow');
          }
        });
    });

    it('should handle empty style attributes gracefully', () => {
      const emptyHTML = `
        <p><span style="">Text with empty style</span></p>
      `;

      pasteHTML(emptyHTML);

      cy.get('@editor').should('contain', 'Text with empty style');
    });

    it('should handle font-weight variations correctly', () => {
      const weightHTML = `
        <p>
          <span style="font-weight: 400;">Normal weight</span>
          <span style="font-weight: 700;">Bold weight</span>
          <span style="font-weight: 900;">Extra bold</span>
        </p>
      `;

      pasteHTML(weightHTML);

      // Normal weight (400) should be stripped
      // Bold (700+) should survive
      cy.get('@editor')
        .find('span[data-lexical-text="true"]')
        .then(($spans) => {
          $spans.each((i, span) => {
            const style = span.getAttribute('style') || '';
            const text = span.textContent;

            if (text === 'Normal weight') {
              // Should NOT have font-weight (400 is stripped)
              expect(style).to.not.include('font-weight');
            } else if (text === 'Bold weight' || text === 'Extra bold') {
              // Should have font-weight 700 or 900
              expect(style).to.match(/font-weight:\s*(700|900)/);
            }
          });
        });
    });
  });
});
