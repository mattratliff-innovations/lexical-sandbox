import { render, screen } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { defaultSignature, draftDataNoSectionsNoContact } from './LetterTestData';
import {
  convertInchesToPixels,
  findOrganizationSignature,
  GeneratePdfObject,
  generateSignatureContent,
  hasValidationErrors,
  LETTER_CLOSING,
  setHeaderData,
  sortSectionsByOrder,
  updateDraft,
} from './LetterUtil';
import deepCamelCase from '../../../testSetup/util';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { showToastError } from '../../utils/toastHelpers';

const mockAxios = new MockAdapter(axios);

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

jest.mock('../../utils/toastHelpers', () => ({
  showToastError: jest.fn(),
}));

jest.mock('../../http/authenticatedAxios', () => {
  const actualAxios = jest.requireActual('axios');
  return {
    APP_API_ENDPOINT: '/api/scribe/vi',
    createAuthenticatedAxios: () => actualAxios.default,
  };
});

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

describe('hasValidationErrors', () => {
  it('returns true if draft.errors.print is truthy', () => {
    const draft = {
      errors: { print: true },
      contacts: [],
    };
    expect(hasValidationErrors(draft)).toBe(true);
  });

  it('returns true if any contact.errors.print is truthy', () => {
    const draft = {
      contacts: [{ errors: { print: true } }, { errors: { print: false } }],
    };
    expect(hasValidationErrors(draft)).toBe(true);
  });

  it('returns true if any contact.address.errors.print is truthy', () => {
    const draft = {
      contacts: [{ address: { errors: { print: false } } }, { address: { errors: { print: true } } }],
    };
    expect(hasValidationErrors(draft)).toBe(true);
  });

  it('returns false if there are no errors', () => {
    const draft = {
      errors: { print: false },
      contacts: [
        { errors: { print: false }, address: { errors: { print: false } } },
        { errors: { print: false }, address: { errors: { print: false } } },
      ],
    };
    expect(hasValidationErrors(draft)).toBe(false);
  });

  it('returns false if draft.errors is undefined and contacts is empty', () => {
    const draft = {};
    expect(hasValidationErrors(draft)).toBe(false);
  });

  it('handles missing nested properties gracefully', () => {
    const draft = {
      contacts: [
        {}, // missing errors and address
        { errors: null, address: null },
      ],
    };
    expect(hasValidationErrors(draft)).toBe(false);
  });
});

describe('updateDraft', () => {
  let mockSetDraft;
  let mockSetInitialDraft;
  let mockLetterEditorRef;
  let mockDefaultSignature;
  let mockDraft;
  let mockMarkAllClean;

  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();

    // Setup mock functions
    mockSetInitialDraft = jest.fn();
    mockSetDraft = jest.fn();
    mockMarkAllClean = jest.fn();

    // Setup default signature
    mockDefaultSignature = {
      id: 'signature-123',
      signatoryName: 'John Doe',
      signatoryTitle: 'Attorney',
      encodedSignature: 'base64encodedstring',
      default: true,
    };

    // Setup mock draft
    mockDraft = {
      id: 'draft-456',
      organizationId: 'org-789',
      letterType: {
        id: 'letter-type-1',
        name: 'I-485',
        headerIncluded: true,
        signatureIncluded: true,
      },
      sections: [
        { id: 'section-1', order: 1, content: 'Content 1' },
        { id: 'section-2', order: 2, content: 'Content 2' },
      ],
      updatedAt: '2024-01-15T10:00:00Z',
    };

    // Setup mock letterEditorRef
    mockLetterEditorRef = {
      current: {
        letterDraftData: jest.fn(() => ({
          id: 'draft-456',
          row1Col1: 'Attorney Name',
          row1Col2: 'Client Name',
          row2Col1: 'Address Line 1',
          row2Col2: 'City, State',
          row3Col1: 'Phone',
          row3Col2: 'Email',
          sectionsAttributes: [
            { id: 'section-1', order: 1, content: 'Updated Content 1' },
            { id: 'section-2', order: 2, content: 'Updated Content 2' },
          ],
        })),
      },
    };
  });

  describe('Successful Updates', () => {
    it('successfully updates draft with all data', async () => {
      const updatedSections = [
        { id: 'section-1', order: 1, content: 'Updated Content 1', locked: false },
        { id: 'section-2', order: 2, content: 'Updated Content 2', locked: false },
      ];

      const responseData = {
        ...mockDraft,
        sections: updatedSections,
        updatedAt: '2024-01-15T11:00:00Z',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseData);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result).toEqual(responseData);
      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.put[0].url).toBe(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`);
    });

    it('includes organizationSignatureId in the request payload', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply((config) => {
        const requestData = JSON.parse(config.data);
        expect(requestData.letter.organizationSignatureId).toBe(mockDefaultSignature.id);
        return [200, mockDraft];
      });

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
    });

    it('calls letterDraftData to get current editor state', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockLetterEditorRef.current.letterDraftData).toHaveBeenCalledTimes(1);
    });

    it('updates draft state with sections and updatedAt from response', async () => {
      const newSections = [
        { id: 'section-1', order: 1, content: 'New Content 1' },
        { id: 'section-2', order: 2, content: 'New Content 2' },
        { id: 'section-3', order: 3, content: 'New Content 3' },
      ];

      const responseData = {
        ...mockDraft,
        sections: newSections,
        updatedAt: '2024-01-15T12:00:00Z',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseData);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockSetDraft).toHaveBeenCalledTimes(1);
      expect(mockSetDraft).toHaveBeenCalledWith(expect.any(Function));

      // Test the updater function
      const updaterFunction = mockSetDraft.mock.calls[0][0];
      const previousState = { ...mockDraft, someOtherField: 'preserved' };
      const newState = updaterFunction(previousState);

      expect(newState).toEqual({
        ...previousState,
        sections: newSections,
        updatedAt: '2024-01-15T12:00:00Z',
      });
    });

    it('calls markAllClean when provided', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockMarkAllClean).toHaveBeenCalledTimes(1);
    });

    it('does not call markAllClean when not provided', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, null);

      expect(mockMarkAllClean).not.toHaveBeenCalled();
    });

    it('handles null defaultSignature gracefully', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply((config) => {
        const requestData = JSON.parse(config.data);
        expect(requestData.letter.organizationSignatureId).toBeUndefined();
        return [200, mockDraft];
      });

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, null, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
    });

    it('includes all letter data from letterDraftData in request', async () => {
      const fullDraftData = {
        id: 'draft-456',
        row1Col1: 'Attorney Name',
        row1Col2: 'Client Name',
        row2Col1: 'Address Line 1',
        row2Col2: 'City, State',
        row3Col1: 'Phone',
        row3Col2: 'Email',
        startsWith: 'Dear Sir/Madam,',
        endsWith: 'Sincerely,',
        sectionsAttributes: [
          { id: 'section-1', order: 1, content: 'Content 1' },
          { id: 'section-2', order: 2, content: 'Content 2' },
        ],
      };

      mockLetterEditorRef.current.letterDraftData.mockReturnValue(fullDraftData);

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply((config) => {
        const requestData = JSON.parse(config.data);
        expect(requestData.letter).toMatchObject(fullDraftData);
        expect(requestData.letter.organizationSignatureId).toBe(mockDefaultSignature.id);
        return [200, mockDraft];
      });

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
    });

    it('returns the complete response data', async () => {
      const completeResponse = {
        id: 'draft-456',
        organizationId: 'org-789',
        letterType: mockDraft.letterType,
        sections: mockDraft.sections,
        updatedAt: '2024-01-15T13:00:00Z',
        row1Col1: 'Updated Attorney',
        row1Col2: 'Updated Client',
        additionalField: 'new data',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, completeResponse);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result).toEqual(completeResponse);
    });

    it('preserves existing draft state when updating', async () => {
      const responseData = {
        ...mockDraft,
        sections: [{ id: 'section-1', order: 1, content: 'New Content' }],
        updatedAt: '2024-01-15T14:00:00Z',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseData);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      const updaterFunction = mockSetDraft.mock.calls[0][0];
      const previousState = {
        id: 'draft-456',
        organizationId: 'org-789',
        customField: 'should be preserved',
        sections: mockDraft.sections,
        updatedAt: '2024-01-15T10:00:00Z',
      };

      const newState = updaterFunction(previousState);

      expect(newState.customField).toBe('should be preserved');
      expect(newState.organizationId).toBe('org-789');
      expect(newState.sections).toEqual(responseData.sections);
      expect(newState.updatedAt).toBe('2024-01-15T14:00:00Z');
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on network failure', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).networkError();

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('shows error toast on 400 bad request', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(400, {
        error: 'Validation failed',
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('shows error toast on 500 server error', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(500, {
        error: 'Internal server error',
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('shows error toast on 401 unauthorized', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(401, {
        error: 'Unauthorized',
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('shows error toast on 404 not found', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(404, {
        error: 'Draft not found',
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('does not call setDraft on error', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(500);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockSetDraft).not.toHaveBeenCalled();
    });

    it('does not call markAllClean on error', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(500);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockMarkAllClean).not.toHaveBeenCalled();
    });

    it('handles timeout errors', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).timeout();

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(showToastError).toHaveBeenCalledWith('Letter could not be updated');
      expect(result).toBeUndefined();
    });

    it('handles malformed response data gracefully', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, null);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockSetDraft).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('Request Payload Validation', () => {
    it('sends request with correct structure', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply((config) => {
        const requestData = JSON.parse(config.data);
        expect(requestData).toHaveProperty('letter');
        expect(typeof requestData.letter).toBe('object');
        return [200, mockDraft];
      });

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
    });

    it('uses correct HTTP method (PUT)', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
      expect(mockAxios.history.post.length).toBe(0);
      expect(mockAxios.history.get.length).toBe(0);
    });

    it('uses correct endpoint URL with draft ID', async () => {
      const customDraft = { ...mockDraft, id: 'custom-draft-789' };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/custom-draft-789`).reply(200, customDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, customDraft, mockMarkAllClean);

      expect(mockAxios.history.put[0].url).toBe(`${APP_API_ENDPOINT}/letters/custom-draft-789`);
    });

    it('sends request with JSON content type', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      const request = mockAxios.history.put[0];
      expect(request.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('State Management', () => {
    it('uses functional update for setDraft to avoid stale closures', async () => {
      const responseData = {
        ...mockDraft,
        sections: [{ id: 'new-section', order: 1, content: 'New' }],
        updatedAt: '2024-01-15T15:00:00Z',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseData);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      // Verify setDraft was called with a function, not an object
      expect(mockSetDraft).toHaveBeenCalledWith(expect.any(Function));
    });

    it('updates only sections and updatedAt, preserving other state', async () => {
      const responseData = {
        ...mockDraft,
        sections: [{ id: 'section-x', order: 1, content: 'X' }],
        updatedAt: '2024-01-15T16:00:00Z',
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseData);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      const updaterFunction = mockSetDraft.mock.calls[0][0];
      const previousState = {
        id: 'draft-456',
        organizationId: 'org-789',
        letterType: mockDraft.letterType,
        sections: [{ id: 'old-section', order: 1, content: 'Old' }],
        updatedAt: '2024-01-15T10:00:00Z',
        customProperty: 'preserved value',
        anotherProperty: 123,
      };

      const newState = updaterFunction(previousState);

      expect(newState.id).toBe('draft-456');
      expect(newState.organizationId).toBe('org-789');
      expect(newState.letterType).toEqual(mockDraft.letterType);
      expect(newState.customProperty).toBe('preserved value');
      expect(newState.anotherProperty).toBe(123);
      expect(newState.sections).toEqual(responseData.sections);
      expect(newState.updatedAt).toBe(responseData.updatedAt);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty sectionsAttributes array', async () => {
      mockLetterEditorRef.current.letterDraftData.mockReturnValue({
        id: 'draft-456',
        row1Col1: 'Test',
        sectionsAttributes: [],
      });

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, {
        ...mockDraft,
        sections: [],
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result.sections).toEqual([]);
      expect(mockAxios.history.put.length).toBe(1);
    });

    it('handles response with no sections field', async () => {
      const responseWithoutSections = {
        id: 'draft-456',
        updatedAt: '2024-01-15T17:00:00Z',
        // No sections field
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseWithoutSections);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result).toEqual(responseWithoutSections);
      expect(mockSetDraft).toHaveBeenCalled();
    });

    it('handles response with no updatedAt field', async () => {
      const responseWithoutUpdatedAt = {
        id: 'draft-456',
        sections: mockDraft.sections,
        // No updatedAt field
      };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, responseWithoutUpdatedAt);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result).toEqual(responseWithoutUpdatedAt);
      expect(mockSetDraft).toHaveBeenCalled();
    });

    it('handles large sectionsAttributes array', async () => {
      const largeSectionsArray = Array.from({ length: 100 }, (_, i) => ({
        id: `section-${i}`,
        order: i + 1,
        content: `Content ${i}`,
      }));

      mockLetterEditorRef.current.letterDraftData.mockReturnValue({
        id: 'draft-456',
        sectionsAttributes: largeSectionsArray,
      });

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, {
        ...mockDraft,
        sections: largeSectionsArray,
      });

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(result.sections).toHaveLength(100);
      expect(mockAxios.history.put.length).toBe(1);
    });

    it('handles special characters in draft data', async () => {
      mockLetterEditorRef.current.letterDraftData.mockReturnValue({
        id: 'draft-456',
        row1Col1: 'Test & <Special> "Characters"',
        row1Col2: "O'Brien's Law Firm",
        sectionsAttributes: [{ id: 'section-1', content: 'Content with émojis 🎉' }],
      });

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      const result = await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockAxios.history.put.length).toBe(1);
      expect(result).toEqual(mockDraft);
    });

    it('handles draft with very long ID', async () => {
      const longId = 'a'.repeat(1000);
      const draftWithLongId = { ...mockDraft, id: longId };

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${longId}`).reply(200, draftWithLongId);

      const result = await updateDraft(
        mockSetDraft,
        mockSetInitialDraft,
        mockLetterEditorRef,
        mockDefaultSignature,
        draftWithLongId,
        mockMarkAllClean
      );

      expect(result.id).toBe(longId);
      expect(mockAxios.history.put[0].url).toContain(longId);
    });
  });

  describe('Integration with Change Tracking', () => {
    it('calls markAllClean only after successful save', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      // Verify markAllClean was called
      expect(mockMarkAllClean).toHaveBeenCalledTimes(1);

      // Verify it was called after setDraft
      const setDraftCallOrder = mockSetDraft.mock.invocationCallOrder[0];
      const markAllCleanCallOrder = mockMarkAllClean.mock.invocationCallOrder[0];
      expect(markAllCleanCallOrder).toBeGreaterThan(setDraftCallOrder);
    });

    it('does not call markAllClean if update fails', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(500);

      await updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean);

      expect(mockMarkAllClean).not.toHaveBeenCalled();
    });

    it('handles undefined markAllClean without errors', async () => {
      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, mockDraft);

      // Should not throw error
      await expect(
        updateDraft(mockSetDraft, mockSetInitialDraft, mockLetterEditorRef, mockDefaultSignature, mockDraft, mockMarkAllClean)
      ).resolves.toBeDefined();
    });
  });
});
