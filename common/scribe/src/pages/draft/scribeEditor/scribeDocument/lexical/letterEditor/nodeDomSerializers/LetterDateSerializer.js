import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const LETTER_DATE_DATA_ATTRIBUTE = 'data-letter-date';
export const LETTER_DATE_TYPE = 'letterDate';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, letterDate) => {
  span.innerHTML = letterDate;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, LETTER_DATE_TYPE);

  span.setAttribute(LETTER_DATE_DATA_ATTRIBUTE, letterDate);
};

export const createLetterDateDataFromDom = (domNode) => domNode.getAttribute(LETTER_DATE_DATA_ATTRIBUTE);
