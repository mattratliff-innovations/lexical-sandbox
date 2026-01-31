import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const USER_DATA_ATTRIBUTE = 'data-user-details';
export const USER_TYPE = 'user';
export const USER_SUB_TYPE = 'subType';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, userDetails, subType) => {
  span.innerHTML = userDetails;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, USER_TYPE);
  span.setAttribute(USER_DATA_ATTRIBUTE, userDetails);

  // multiple variables (ex: [[[FIRST]]], [[[LAST]]] are supported by this serializer
  // sub type indicates which one
  span.setAttribute(USER_SUB_TYPE, subType);
};

export const createUserDataFromDom = (domNode) => domNode.getAttribute(USER_DATA_ATTRIBUTE);
export const getSubTypeDataFromDom = (domNode) => domNode.getAttribute(USER_SUB_TYPE);
