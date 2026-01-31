import { Flip, toast } from 'react-toastify';

import { APP_API_ENDPOINT } from '../../../../../../http/authenticatedAxios';
import { inactiveVariables } from '../../ScribeDocumentConstants';

// Utility Functions
export function getSnippetsGroups(axios, setSnippetGroupListData) {
  axios
    .get(`${APP_API_ENDPOINT}/snippet_groups`, { params: { include_snippets: true } })
    .then((response) => setSnippetGroupListData(response.data))
    .catch(() => {
      toast.error('There was an error retrieving the Snippet Groups', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    });
}

export function getSnippetGroupsForLetterType(axios, setSnippetGroupListData, draftState) {
  axios
    .get(`${APP_API_ENDPOINT}/snippet_groups/snippet_groups_for_letter_type`, {
      params: {
        letter_type_id: draftState?.letterTypeId,
        form_type_code: draftState?.registration?.formTypeName,
      },
    })
    .then((response) => setSnippetGroupListData(response.data))
    .catch(() => {
      toast.error('There was an error retrieving the Snippets', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    });
}

export function getAvailableStandardParagraphsFormLetterType(axios, setStandardParagraphListData, draftState) {
  axios
    .get(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`, {
      params: {
        letter_type_id: draftState?.letterTypeId,
        form_type_code: draftState?.registration?.formTypeName,
      },
    })
    .then((response) => {
      const sortedParagraphs = response.data.sort((a, b) => a.code.localeCompare(b.code));
      setStandardParagraphListData(sortedParagraphs);
    })
    .catch(() => {
      toast.error('There was an error retrieving the Standard Paragraph list', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    });
}

export function getVariables(axios, setVariableListData, setVariableSearchResultList) {
  axios
    .get(`${APP_API_ENDPOINT}/variables`, {})
    .then((response) => {
      const sortedVariables = response.data.sort((a, b) => a.name.localeCompare(b.name));
      const supportedVariables = sortedVariables.filter((item) => !inactiveVariables.includes(item.name));
      setVariableListData(supportedVariables);
      setVariableSearchResultList(supportedVariables);
    })
    .catch(() => {
      toast.error('There was an error retrieving the Variable list', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    });
}
