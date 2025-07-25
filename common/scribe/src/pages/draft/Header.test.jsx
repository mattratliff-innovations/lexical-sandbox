import * as React from 'react';
import { render } from '@testing-library/react';
import deepCamelCase from '../../../testSetup/util';
import { draftDataNoSectionsNoContact } from './LetterTestData';
import Header, {
  getEnvelopeType,
  getCustomCss,
  US_LETTER,
  LOCAL_US_LETTER_LEFT,
  LOCAL_US_LETTER_TOP,
  CENTRAL_US_LETTER_LEFT,
  CENTRAL_US_LETTER_TOP,
  SIX_BY_NINE,
  LOCAL_SIX_BY_NINE_LEFT,
  LOCAL_SIX_BY_NINE_TOP,
  CENTRAL_SIX_BY_NINE_LEFT,
  CENTRAL_SIX_BY_NINE_TOP,
  FLAT,
  LOCAL_FLAT_LEFT,
  LOCAL_FLAT_TOP,
  CENTRAL_FLAT_LEFT,
  CENTRAL_FLAT_TOP,
} from './Header';
import { convertInchesToPixels } from './LetterUtil';

const containerAndColumnClasses = ['.letterheader-container', '.letterheader-left-column', '.letterheader-right-column'];
const rowColClasses = ['.row1Col1', '.row1Col2', '.row2Col1', '.row2Col2', '.row3Col1', '.row3Col2'];

const camelCasedDraft = deepCamelCase(draftDataNoSectionsNoContact);

const mockDraftText = {
  row1Col1: 'Column 1, Row 1',
  row1Col2: 'Column 2, Row 1',
  row2Col1: 'Column 1, Row 2',
  row2Col2: 'Column 2, Row 2',
  row3Col1: 'Column 1, Row 3',
  row3Col2: 'Column 2, Row 3',
};

const mockedDraft = Object.keys(mockDraftText).reduce(
  (accumulator, key) => ({
    ...accumulator,
    [key]: `<p>${mockDraftText[key]}</p>`,
  }),
  camelCasedDraft
);

const renderComponent = (draft, printType = undefined, totalPageCount = 0, options = {}) => {
  render(<Header draft={draft} printType={printType} totalPageCount={totalPageCount} options={options} />);
};

describe('Letter Header', () => {
  it('shows correct classes for container and right/left columns', () => {
    renderComponent(mockedDraft);

    containerAndColumnClasses.forEach((className) => {
      const element = document.querySelector(className);
      expect(element).toHaveClass(className.slice(1));
    });
  });

  it('shows correct classes rows and columns', () => {
    renderComponent(mockedDraft);

    rowColClasses.forEach((className) => {
      const element = document.querySelector(className);
      expect(element).toHaveClass(className.slice(1));
    });
  });

  it('shows correct values', () => {
    renderComponent(mockedDraft);

    rowColClasses.forEach((className) => {
      const element = document.querySelector(className);
      expect(element.textContent).toContain(mockDraftText[className.slice(1)]);
    });
  });

  describe('getCustomCss', () => {
    const draftWithCalculatedMargins = {
      ...mockedDraft,
      marginTop: convertInchesToPixels(0),
      marginLeft: convertInchesToPixels(0),
    };

    describe('with invalid printType', () => {
      it('uses local US Standard Letter by default', () => {
        const result = getCustomCss(-1, draftWithCalculatedMargins, 'SomeRandoValue');

        expect(result).toContain(LOCAL_US_LETTER_TOP.toString());
        expect(result).toContain(LOCAL_US_LETTER_LEFT.toString());
      });
    });

    describe('local print', () => {
      const local = 'local';

      describe('with pages < 0', () => {
        it('uses US Standard Letter by default', () => {
          const result = getCustomCss(-1, draftWithCalculatedMargins, local);

          expect(result).toContain(LOCAL_US_LETTER_TOP.toString());
          expect(result).toContain(LOCAL_US_LETTER_LEFT.toString());
        });
      });

      describe('with pages = 0', () => {
        it('uses US Standard Letter by default', () => {
          const result = getCustomCss(0, draftWithCalculatedMargins, local);

          expect(result).toContain(LOCAL_US_LETTER_TOP.toString());
          expect(result).toContain(LOCAL_US_LETTER_LEFT.toString());
        });
      });

      describe('with pages 1 - 3', () => {
        it('uses US Standard Letter', () => {
          for (let i = 1; i <= 3; i += 1) {
            const result = getCustomCss(i, draftWithCalculatedMargins, local);
            expect(result).toContain(LOCAL_US_LETTER_TOP.toString());
            expect(result).toContain(LOCAL_US_LETTER_LEFT.toString());
          }
        });
      });

      describe('with pages 4 - 7', () => {
        it('uses 6x9', () => {
          for (let i = 4; i <= 7; i += 1) {
            const result = getCustomCss(i, draftWithCalculatedMargins, local);
            expect(result).toContain(LOCAL_SIX_BY_NINE_TOP.toString());
            expect(result).toContain(LOCAL_SIX_BY_NINE_LEFT.toString());
          }
        });
      });

      describe('with pages >= 8', () => {
        it('uses Flat Envelope', () => {
          const result = getCustomCss(8, draftWithCalculatedMargins, local);
          expect(result).toContain(LOCAL_FLAT_LEFT.toString());
          expect(result).toContain(LOCAL_FLAT_TOP.toString());
        });
      });
    });

    describe('central print', () => {
      const central = 'central';

      describe('with pages < 0', () => {
        it('uses US Standard Letter by default', () => {
          const result = getCustomCss(-1, draftWithCalculatedMargins, central);

          expect(result).toContain(CENTRAL_US_LETTER_TOP.toString());
          expect(result).toContain(CENTRAL_US_LETTER_LEFT.toString());
        });
      });

      describe('with pages = 0', () => {
        it('uses US Standard Letter by default', () => {
          const result = getCustomCss(0, draftWithCalculatedMargins, central);

          expect(result).toContain(CENTRAL_US_LETTER_TOP.toString());
          expect(result).toContain(CENTRAL_US_LETTER_LEFT.toString());
        });
      });

      describe('with pages 1 - 3', () => {
        it('uses US Standard Letter', () => {
          for (let i = 1; i <= 3; i += 1) {
            const result = getCustomCss(i, draftWithCalculatedMargins, central);
            expect(result).toContain(CENTRAL_US_LETTER_TOP.toString());
            expect(result).toContain(CENTRAL_US_LETTER_LEFT.toString());
          }
        });
      });

      describe('with pages 4 - 7', () => {
        it('uses 6x9', () => {
          for (let i = 4; i <= 7; i += 1) {
            const result = getCustomCss(i, draftWithCalculatedMargins, central);
            expect(result).toContain(CENTRAL_SIX_BY_NINE_TOP.toString());
            expect(result).toContain(CENTRAL_SIX_BY_NINE_LEFT.toString());
          }
        });
      });

      describe('with pages >= 8', () => {
        it('uses Flat Envelope', () => {
          const result = getCustomCss(8, draftWithCalculatedMargins, central);
          expect(result).toContain(CENTRAL_FLAT_LEFT.toString());
          expect(result).toContain(CENTRAL_FLAT_TOP.toString());
        });
      });
    });
  });

  describe('getEnvelopeType', () => {
    it('with pages as a negative value returns us letter', () => {
      const pages = -1;
      const result = getEnvelopeType(pages);

      expect(result).toEqual(US_LETTER);
    });

    it('with pages as 0-3 returns us letter', () => {
      for (let i = 0; i < 4; i += 1) {
        const result = getEnvelopeType(i);
        expect(result).toEqual(US_LETTER);
      }
    });

    it('with pages as 4-8 returns 6x9', () => {
      for (let i = 4; i < 8; i += 1) {
        const result = getEnvelopeType(i);
        expect(result).toEqual(SIX_BY_NINE);
      }
    });

    it('with pages > 8 returns flat', () => {
      for (let i = 8; i < 9; i += 1) {
        const result = getEnvelopeType(i);
        expect(result).toEqual(FLAT);
      }
    });
  });
});
