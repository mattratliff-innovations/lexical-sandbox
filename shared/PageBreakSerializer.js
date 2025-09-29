import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const PAGEBREAK_DATA_ATTRIBUTE = 'data-pagebreak';
export const PAGEBREAK_TYPE = 'pagebreak';

/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, pagebreak) => {
  span.innerHTML = pagebreak;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, PAGEBREAK_TYPE);

  span.setAttribute(PAGEBREAK_DATA_ATTRIBUTE, pagebreak);
};

export const createPageBreakDataFromDom = (domNode) => domNode.getAttribute(PAGEBREAK_DATA_ATTRIBUTE);
