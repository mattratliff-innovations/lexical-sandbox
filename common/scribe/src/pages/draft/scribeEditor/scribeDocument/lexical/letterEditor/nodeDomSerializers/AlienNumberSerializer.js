import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const ALIEN_NUMBER_DATA_ATTRIBUTE = 'data-alien-number';
export const ALIEN_NUMBER_TYPE = 'alienNumber';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, alienNumber) => {
  span.innerHTML = alienNumber;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, ALIEN_NUMBER_TYPE);

  span.setAttribute(ALIEN_NUMBER_DATA_ATTRIBUTE, alienNumber);
};

export const createAlienNumberDataFromDom = (domNode) => domNode.getAttribute(ALIEN_NUMBER_DATA_ATTRIBUTE);
