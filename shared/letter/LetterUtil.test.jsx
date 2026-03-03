import { render, screen } from '@testing-library/react';

import { defaultSignature, draftDataNoSectionsNoContact } from './LetterTestData';
import {
  convertInchesToPixels,
  findOrganizationSignature,
  GeneratePdfObject,
  generateSignatureContent,
  LETTER_CLOSING,
  setHeaderData,
  sortSectionsByOrder,
} from './LetterUtil';
import deepCamelCase from '../../../testSetup/util';

// Mock hydrateVariablesHeadlessly
const hydrateVariablesHeadlessly = jest.fn();
jest.mock('./LetterUtil', () => {
  const originalModule = jest.requireActual('./LetterUtil');
  return {
    ...originalModule,
    hydrateVariablesHeadlessly: jest.fn(),
  };
});

jest.mock('./scribeEditor/scribeDocument/lexical/letterEditor/plugins/VariablePlugin', () => ({
  hydrateVariablesHeadlessly: jest.fn((value) => `hydrated-${value}`),
}));

const renderComponent = (signature) => {
  render(<>{generateSignatureContent(signature)}</>);
};

describe('generateSignatureContent', () => {
  it('renders the signature', async () => {
    const signature = {
      signatoryName: 'John Jay',
      encodedSignature: 'abc123',
      signatoryTitle: 'Justice',
    };

    renderComponent(signature);
    const component = screen.getByTestId('signature');

    expect(component).toHaveTextContent(LETTER_CLOSING);
    expect(component).toHaveTextContent(signature.signatoryName);
    expect(component).toHaveTextContent(signature.signatoryTitle);
    const image = component.querySelector('img');
    expect(image.src).toContain(signature.encodedSignature);
  });

  it('does not throw an exception if the signature is not set', async () => {
    renderComponent(null);
    const component = screen.getByTestId('signature');

    expect(component).toHaveTextContent(LETTER_CLOSING);
  });
});

describe('convertInchesToPixels', () => {
  it('converts the value', () => {
    const result = convertInchesToPixels(1);

    expect(Math.floor(result)).toBe(96);
  });
});

describe('findOrganizationSignature', () => {
  it('returns the default signature if there is no default signature selected', () => {
    const noSignatureSelectedDraft = {
      ...deepCamelCase(draftDataNoSectionsNoContact),
      organizationSignatureId: null,
    };

    const result = findOrganizationSignature(noSignatureSelectedDraft);

    expect(result.id).toEqual(defaultSignature.id);
  });

  it('safely returns null if there is no signature included', () => {
    const signatureNotIncludedDraft = {
      ...deepCamelCase(draftDataNoSectionsNoContact),
      letterType: { signatureIncluded: false },
    };

    const result = findOrganizationSignature(signatureNotIncludedDraft);

    expect(result).toBeNull();
  });

  it('returns the selected signature', () => {
    const result = findOrganizationSignature(deepCamelCase(draftDataNoSectionsNoContact));

    expect(result.id).toEqual(defaultSignature.id);
  });
});

describe('setHeaderData', () => {
  beforeEach(() => {
    hydrateVariablesHeadlessly.mockReset();
  });

  it('returns letter unchanged if header is missing', () => {
    const letter = {};
    expect(setHeaderData(letter)).toBe(letter);
  });

  it('returns letter unchanged if header is falsy', () => {
    const letter = { header: null };
    expect(setHeaderData(letter)).toBe(letter);
  });

  it('sets row keys to empty string when clearData is true', () => {
    const letter = {
      header: {
        row1: 'value1',
        row2: 'value2',
        notRow: 'shouldNotChange',
      },
    };
    const result = setHeaderData(letter, true);
    expect(result.row1).toBe('');
    expect(result.row2).toBe('');
    expect(result.notRow).toBeUndefined();
  });

  it('hydrates row keys when hydrate is true and clearData is false', () => {
    hydrateVariablesHeadlessly.mockImplementation((val) => `hydrated-${val}`);
    const letter = {
      header: {
        row1: 'value1',
        row2: 'value2',
      },
    };
    const result = setHeaderData(letter, false, true);
    expect(result.row1).toBe('hydrated-value1');
    expect(result.row2).toBe('hydrated-value2');
  });

  it('copies row keys from header when neither clearData nor hydrate is true', () => {
    const letter = {
      header: {
        row1: 'value1',
        row2: 'value2',
        notRow: 'shouldNotChange',
      },
    };
    const result = setHeaderData(letter);
    expect(result.row1).toBe('value1');
    expect(result.row2).toBe('value2');
    expect(result.notRow).toBeUndefined();
  });

  it('does not set keys that do not start with "row"', () => {
    const letter = {
      header: {
        row1: 'value1',
        notRow: 'shouldNotChange',
      },
    };
    const result = setHeaderData(letter);
    expect(result.row1).toBe('value1');
    expect(result.notRow).toBeUndefined();
  });

  it('returns the same letter object (mutates)', () => {
    const letter = {
      header: {
        row1: 'value1',
      },
    };
    const result = setHeaderData(letter);
    expect(result).toBe(letter);
  });
});

describe('GeneratePdfObject', () => {
  const inlinePdfScale = 138;

  it('generate a PDF object', async () => {
    const pdfData = 'http://www.ufo-uap.com/d7eb8c84-e470-4d3a-8b03-c05b354b0a98';
    render(<GeneratePdfObject pdfData={pdfData} inlinePdfScale={inlinePdfScale} />);
    const pdfObject = screen.getByTestId('inline-pdf');

    expect(pdfObject).toBeInTheDocument();
    expect(pdfObject).toHaveAttribute('data', `${pdfData}#toolbar=0&zoom=${inlinePdfScale}`);
    expect(pdfObject).toHaveAttribute('type', 'application/pdf');
    expect(pdfObject).toHaveClass('inlinePdf');
  });

  it('should show the spinner', () => {
    render(<GeneratePdfObject inlinePdfScale={inlinePdfScale} />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });
});

describe('sortSectionsByOrder', () => {
  it('should sort sections based on the order property ascending', () => {
    const inputLetter = {
      id: 1,
      title: 'Letter One',
      sections: [
        { id: 'c', order: 3, content: 'Third' },
        { id: 'a', order: 1, content: 'First' },
        { id: 'b', order: 2, content: 'Second' },
      ],
    };

    const expectedSections = [
      { id: 'a', order: 1, content: 'First' },
      { id: 'b', order: 2, content: 'Second' },
      { id: 'c', order: 3, content: 'Third' },
    ];

    const result = sortSectionsByOrder(inputLetter);

    expect(result.sections).toEqual(expectedSections);
    expect(result.id).toBe(1); // Ensure other properties remain
  });

  it('should return the original object if sections are missing (null/undefined)', () => {
    const inputLetter = { id: 2, title: 'No Sections' };
    const result = sortSectionsByOrder(inputLetter);
    expect(result).toEqual(inputLetter);
  });

  it('should return the original object if sections is empty', () => {
    const inputLetter = { id: 3, sections: [] };
    const result = sortSectionsByOrder(inputLetter);
    expect(result).toEqual(inputLetter);
  });

  it('should not mutate the original input object (immutability check)', () => {
    const inputLetter = {
      sections: [{ order: 2 }, { order: 1 }],
    };

    // Create a shallow copy to compare later
    const originalSections = [...inputLetter.sections];

    sortSectionsByOrder(inputLetter);

    // Ensure original sections haven't changed order
    expect(inputLetter.sections).toEqual(originalSections);
  });

  it('should return null if letter is null or undefined', () => {
    expect(sortSectionsByOrder(null)).toBeNull();
    expect(sortSectionsByOrder(undefined)).toBeUndefined();
  });
});
