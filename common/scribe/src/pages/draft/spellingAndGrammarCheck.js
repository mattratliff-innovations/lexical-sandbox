import { SPELLING_ERROR_CLASS, GRAMMAR_ERROR_CLASS, LINGUISTIC_ERROR_CLASS } from './LetterUtil';

import { createAuthenticatedAxios, GRAMMAR_CHECK_ENDPOINT } from '../../http/authenticatedAxios';

const SPELLING_ERROR = 'MORFOLOGIK_RULE_EN_US';

const FAKE_ROOT = 'I_AM_A_WELL_KNOWN_ROOT_XML_ELEMENT';

const createErrorSpan = (error, contentId) => {
  const classes = `${LINGUISTIC_ERROR_CLASS} ${error.type === SPELLING_ERROR ? SPELLING_ERROR_CLASS : GRAMMAR_ERROR_CLASS}`;
  return `<span class="${classes}" data-content-id="${contentId}" id="error-${error.id}" data-error-id="${error.id}">`;
};

const replaceHtmlEntities = (html) =>
  html.replaceAll('&nbsp;', '<nbs/>').replaceAll('&lt;', '<l/>').replaceAll('&gt;', '<g/>').replaceAll('&quot;', '<quo/>');

const addBackHtmlEntities = (html) =>
  html.replaceAll('<nbs/>', '&nbsp;').replaceAll('<l/>', '&lt;').replaceAll('<g/>', '&gt;').replaceAll('<quo/>', '&quot;');

const parseHtmlAsXhtml = (html) => {
  const htmlWithRoot = `<${FAKE_ROOT}>${html}</${FAKE_ROOT}>`;
  const parser = new DOMParser();
  const parsedHtml = parser.parseFromString(htmlWithRoot, 'application/xhtml+xml');
  return parsedHtml;
};

const childElementsAsString = (xhtmlNode) => {
  let updatedContent = '';
  for (let i = 0; i < xhtmlNode.documentElement.childNodes.length; i += 1) {
    updatedContent += xhtmlNode.documentElement.childNodes[i].outerHTML || xhtmlNode.documentElement.childNodes[i].nodeValue;
  }
  return updatedContent;
};

const replaceLinguisticErrorWithContent = (activeAnchor, content, editorContent) => {
  const errorHtmlId = activeAnchor.getAttribute('id');
  const replacedHtml = replaceHtmlEntities(editorContent);
  const parsedHtml = parseHtmlAsXhtml(replacedHtml);
  const errorSpan = parsedHtml.querySelector(`#${errorHtmlId}`);
  const suggestionNode = document.createTextNode(content);
  errorSpan.parentNode.replaceChild(suggestionNode, errorSpan);
  const xml = childElementsAsString(parsedHtml);
  return addBackHtmlEntities(xml);
};

const removeSpellingAndGrammarErrorStyling = (html) => {
  const parsedHtml = parseHtmlAsXhtml(html);
  const errorSpans = parsedHtml.querySelectorAll(`span.${LINGUISTIC_ERROR_CLASS}`);
  errorSpans.forEach((span) => {
    const actualText = parsedHtml.createTextNode(span.textContent);
    span.parentNode.replaceChild(actualText, span);
  });
  return childElementsAsString(parsedHtml);
};

const runSpellingAndGrammarCheck = async (spellCheckContents, options = {}) => {
  if (!options?.actuallyRunCheck) {
    return { nextContents: spellCheckContents, checkResults: [] };
  }

  const editorsHtml = spellCheckContents
    .map((content) => ({ ...content, html: replaceHtmlEntities(content.html) }))
    .map((content) => ({
      ...content,
      html: removeSpellingAndGrammarErrorStyling(content.html),
    }));
  let checkContents = [];
  let checkResults = null;
  try {
    const axios = createAuthenticatedAxios();
    await axios.post(`${GRAMMAR_CHECK_ENDPOINT}/check`, editorsHtml).then((response) => {
      checkContents = spellCheckContents.map((content) => {
        const checkResult = response.data.find((result) => result.contentId === content.contentId);
        if (!checkResult) {
          return { contentId: content.contentId, html: content.html };
        }
        let resultWithErrors = editorsHtml.find((editorHtml) => editorHtml.contentId === content.contentId).html;
        checkResult.errors.toReversed().forEach((error) => {
          resultWithErrors = [
            resultWithErrors.slice(0, error.startPosition),
            createErrorSpan(error, content.contentId),
            resultWithErrors.slice(error.startPosition, error.endPosition),
            '</span>',
            resultWithErrors.slice(error.endPosition),
          ].join('');
        });
        const withHtmlEntities = addBackHtmlEntities(resultWithErrors);
        return { contentId: content.contentId, html: withHtmlEntities };
      });
      checkResults = response.data;
    });
  } catch {
    return null;
  }
  return { nextContents: checkContents, checkResults };
};

export { runSpellingAndGrammarCheck, replaceLinguisticErrorWithContent, removeSpellingAndGrammarErrorStyling, SPELLING_ERROR };
