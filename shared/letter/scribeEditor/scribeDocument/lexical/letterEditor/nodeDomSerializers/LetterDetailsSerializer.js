import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const LETTER_DETAILS_DATA_ATTRIBUTE = 'data-letter-details';
export const LETTER_DETAILS_TYPE = 'letterDetails';
export const LETTER_DETAILS_SUB_TYPE = 'subType';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, primaryApplicant, subType) => {
  span.innerHTML = primaryApplicant;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, LETTER_DETAILS_TYPE);
  span.setAttribute(LETTER_DETAILS_DATA_ATTRIBUTE, primaryApplicant);

  // multiple variables (ex: [[[FIRST]]], [[[LAST]]] are supported by this serializer
  // sub type indicates which one
  span.setAttribute(LETTER_DETAILS_SUB_TYPE, subType);
};

export const createLetterDetailDataFromDom = (domNode) => domNode.getAttribute(LETTER_DETAILS_DATA_ATTRIBUTE);
export const getSubTypeDataFromDom = (domNode) => domNode.getAttribute(LETTER_DETAILS_SUB_TYPE);
