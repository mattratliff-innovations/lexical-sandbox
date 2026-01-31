import { Flip, toast } from 'react-toastify';

import { getAvailableStandardParagraphsFormLetterType, getSnippetGroupsForLetterType, getSnippetsGroups, getVariables } from './AddContentModalUtils';
import { inactiveVariables } from '../../ScribeDocumentConstants';

jest.mock('../../../../../../http/authenticatedAxios', () => ({
  APP_API_ENDPOINT: '/api/scribe/v1',
}));

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
  Flip: 'Flip',
}));

const APP_API_ENDPOINT = '/api/scribe/v1'; // Adjust if needed

describe('AddContentModalUtils', () => {
  let axios;
  let setData;
  let setData2;
  let draftState;

  beforeEach(() => {
    axios = { get: jest.fn() };
    setData = jest.fn();
    setData2 = jest.fn();
    draftState = {
      letterTypeId: 123,
      registration: { formTypeName: 'FORM_A' },
    };
    jest.clearAllMocks();
  });

  describe('getSnippetsGroups', () => {
    it('calls setSnippetGroupListData with response data on success', async () => {
      const response = { data: [{ id: 1 }] };
      axios.get.mockResolvedValueOnce(response);

      await getSnippetsGroups(axios, setData);
      // Wait for promises to resolve
      await Promise.resolve();

      expect(axios.get).toHaveBeenCalledWith(`${APP_API_ENDPOINT}/snippet_groups`, { params: { include_snippets: true } });
      expect(setData).toHaveBeenCalledWith(response.data);
    });

    it('shows toast error on failure', async () => {
      axios.get.mockRejectedValueOnce(new Error('fail'));
      await getSnippetsGroups(axios, setData);
      await Promise.resolve();
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error retrieving the Snippet Groups',
        expect.objectContaining({
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
    });
  });

  describe('getSnippetGroupsForLetterType', () => {
    it('calls setSnippetGroupListData with response data on success', async () => {
      const response = { data: [{ id: 2 }] };
      axios.get.mockResolvedValueOnce(response);

      await getSnippetGroupsForLetterType(axios, setData, draftState);
      await Promise.resolve();

      expect(axios.get).toHaveBeenCalledWith(`${APP_API_ENDPOINT}/snippet_groups/snippet_groups_for_letter_type`, {
        params: {
          letter_type_id: draftState.letterTypeId,
          form_type_code: draftState.registration.formTypeName,
        },
      });
      expect(setData).toHaveBeenCalledWith(response.data);
    });

    it('shows toast error on failure', async () => {
      axios.get.mockRejectedValueOnce(new Error('fail'));
      await getSnippetGroupsForLetterType(axios, setData, draftState);
      await Promise.resolve();
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error retrieving the Snippets',
        expect.objectContaining({
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
    });
  });

  describe('getAvailableStandardParagraphsFormLetterType', () => {
    it('sorts and sets paragraphs on success', async () => {
      const response = { data: [{ code: 'B' }, { code: 'A' }, { code: 'C' }] };
      axios.get.mockResolvedValueOnce(response);

      await getAvailableStandardParagraphsFormLetterType(axios, setData, draftState);
      await Promise.resolve();

      expect(axios.get).toHaveBeenCalledWith(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`, {
        params: {
          letter_type_id: draftState.letterTypeId,
          form_type_code: draftState.registration.formTypeName,
        },
      });
      expect(setData).toHaveBeenCalledWith([{ code: 'A' }, { code: 'B' }, { code: 'C' }]);
    });

    it('shows toast error on failure', async () => {
      axios.get.mockRejectedValueOnce(new Error('fail'));
      await getAvailableStandardParagraphsFormLetterType(axios, setData, draftState);
      await Promise.resolve();
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error retrieving the Standard Paragraph list',
        expect.objectContaining({
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
    });
  });

  describe('getVariables', () => {
    it('filters out inactive variables and sets lists', async () => {
      const response = {
        data: [{ name: 'Active1' }, { name: 'Inactive1' }, { name: 'Active2' }],
      };
      // Make sure inactiveVariables includes 'Inactive1'
      inactiveVariables.push('Inactive1');
      axios.get.mockResolvedValueOnce(response);

      await getVariables(axios, setData, setData2);
      await Promise.resolve();

      expect(axios.get).toHaveBeenCalledWith(`${APP_API_ENDPOINT}/variables`, {});
      expect(setData).toHaveBeenCalledWith([{ name: 'Active1' }, { name: 'Active2' }]);
      expect(setData2).toHaveBeenCalledWith([{ name: 'Active1' }, { name: 'Active2' }]);
    });

    it('shows toast error on failure', async () => {
      axios.get.mockRejectedValueOnce(new Error('fail'));
      await getVariables(axios, setData, setData2);
      await Promise.resolve();
      expect(toast.error).toHaveBeenCalledWith(
        'There was an error retrieving the Variable list',
        expect.objectContaining({
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
    });
  });
});
