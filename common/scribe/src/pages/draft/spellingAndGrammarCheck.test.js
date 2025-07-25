import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LINGUISTIC_ERROR_CLASS, SPELLING_ERROR_CLASS, GRAMMAR_ERROR_CLASS } from './LetterUtil';
import { runSpellingAndGrammarCheck, replaceLinguisticErrorWithContent, removeSpellingAndGrammarErrorStyling } from './spellingAndGrammarCheck';

import { GRAMMAR_CHECK_ENDPOINT } from '../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockGrammarCheckEndpoint = (responseCode, responseData) => {
  mockAxios.onPost(`${GRAMMAR_CHECK_ENDPOINT}/check`).reply(responseCode, responseData);
};

const misspelledId = '36815c7b-5e77-4f95-8a1c-a18044436bd4';
const useAnId = '442fe54a-611f-402b-ba6d-9d58acfb1633';
const contentId = '409a1f1e-370b-46a0-aaef-255b0d61c9fa';
const grammarCheckResponse = [
  {
    contentId,
    errors: [
      {
        id: misspelledId,
        suggestions: ['word', 'Ward', 'ward'],
        startPosition: 8,
        endPosition: 11,
        message: 'Possible spelling mistake found.',
        type: 'MORFOLOGIK_RULE_EN_US',
      },
      {
        id: useAnId,
        suggestions: ['an'],
        startPosition: 35,
        endPosition: 36,
        message: "Use <suggestion>an</suggestion> instead of 'a' if the following word starts with a vowel sound, e.g. 'an article', 'an hour'.",
        type: 'EN_A_VS_AN',
      },
    ],
  },
];

const actuallyRunCheck = { actuallyRunCheck: true };

describe('spelling and grammar check', () => {
  beforeEach(async () => {
    mockAxios.reset();
  });

  const text = `<p>This <span class="${LINGUISTIC_ERROR_CLASS} ${SPELLING_ERROR_CLASS}">wrd</span> is misspelled. This is a error.</p>`;
  const content = { contentId, html: text };

  describe('runSpellingAndGrammarCheck', () => {
    it('removes existing linguistic errors and submits the text to the server and inserts formatting for any errors', async () => {
      const expectedText =
        `<p>This <span class="${LINGUISTIC_ERROR_CLASS} ${SPELLING_ERROR_CLASS}" data-content-id="${contentId}" ` +
        `id="error-${misspelledId}" data-error-id="${misspelledId}">wrd</span> is misspelled. This is ` +
        `<span class="${LINGUISTIC_ERROR_CLASS} ${GRAMMAR_ERROR_CLASS}" data-content-id="${contentId}" id="error-${useAnId}" ` +
        `data-error-id="${useAnId}">a</span> error.</p>`;
      const strippedText = '<p>This wrd is misspelled. This is a error.</p>';
      const expectedCallData = { contentId, html: strippedText };
      const content2 = {
        contentId: 'someId',
        html: '<p>This is a well written sentence.</p>',
      };
      mockGrammarCheckEndpoint(200, grammarCheckResponse);

      const result = await runSpellingAndGrammarCheck([content, content2], actuallyRunCheck);

      expect(mockAxios.history.post.length).toEqual(1);
      const postedData = JSON.parse(mockAxios.history.post[0].data);
      expect(postedData.length).toEqual(2);
      const contentWithErrors = postedData.find((postedContent) => content.contentId === postedContent.content_id);
      expect(contentWithErrors.html).toEqual(expectedCallData.html);
      const contentWithoutErrors = postedData.find((postedContent) => content2.contentId === postedContent.content_id);
      expect(contentWithoutErrors.html).toEqual(content2.html);
      const { nextContents } = result;
      expect(nextContents.length).toEqual(2);
      const nextWithErrorsContent = nextContents.find((nextContent) => nextContent.contentId === content.contentId);
      expect(nextWithErrorsContent.html).toEqual(expectedText);
      const nextWithoutErrorsContent = nextContents.find((nextContent) => nextContent.contentId === content2.contentId);
      expect(nextWithoutErrorsContent.html).toEqual(content2.html);
      expect(result.checkResults).toEqual(grammarCheckResponse);
    });

    it('handles the parsing of html character entities without throwing errors', async () => {
      const editorText = 'Here are some entities &nbsp; &lt; &gt; &quot;.';
      const expectedCallData = {
        contentId,
        html: 'Here are some entities <nbs/> <l/> <g/> <quo/>.',
      };
      const contentWithEntities = { contentId, html: editorText };
      mockGrammarCheckEndpoint(200, []);

      const result = await runSpellingAndGrammarCheck([contentWithEntities], actuallyRunCheck);

      expect(mockAxios.history.post.length).toEqual(1);
      const postedData = JSON.parse(mockAxios.history.post[0].data);
      expect(postedData[0].html).toEqual(expectedCallData.html);
      expect(result.nextContents[0].html).toEqual(editorText);
    });

    it('does not blow up and returns null if the grammar check call fails', async () => {
      mockGrammarCheckEndpoint(500, { oh: 'noes' });

      const result = await runSpellingAndGrammarCheck([content], actuallyRunCheck);

      expect(result).toBeNull();
    });
  });
});

describe('replaceLinguisticErrorWithContent', () => {
  it('replaces the content in the span with the incoming content and preserves html entities', () => {
    const errorId = 'asdf123';
    const editorHtml =
      `<p>This <span class="${LINGUISTIC_ERROR_CLASS} ${SPELLING_ERROR_CLASS}" id="error-${errorId}">wrd</span> is misspelled` +
      '&nbsp; &lt; &gt; &quot;.</p>';
    const parser = new DOMParser();
    const parsedHtml = parser.parseFromString(editorHtml, 'text/html');
    const errorSpan = parsedHtml.querySelector(`#error-${errorId}`);
    const content = 'word';

    const result = replaceLinguisticErrorWithContent(errorSpan, content, editorHtml);

    expect(result).toEqual('<p>This word is misspelled&nbsp; &lt; &gt; &quot;.</p>');
  });
});

describe('removeSpellingAndGrammarErrorStyling', () => {
  it('removes all error spans and returns the result as XHTML', () => {
    const html =
      `<p>This <span class="${LINGUISTIC_ERROR_CLASS}">hs</span> an<br/> error and ` +
      'single tags <img class="receipt-number-barcode-image" src="data:image/png;base64,iVBO" /></p>' +
      '<p>Another child element.</p>';
    const expected =
      '<p>This hs an<br/> error and single tags <img class="receipt-number-barcode-image" src="data:image/png;base64,iVBO"/></p>' +
      '<p>Another child element.</p>';

    const result = removeSpellingAndGrammarErrorStyling(html);

    expect(result).toEqual(expected);
  });
});
