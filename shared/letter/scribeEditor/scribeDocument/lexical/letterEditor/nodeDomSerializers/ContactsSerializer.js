import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const CONTACT_DATA_ATTRIBUTE = 'data-contact';
export const CONTACT_TYPE = 'contact';
export const CONTACT_SUB_TYPE = 'subType';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, contact, subType) => {
  span.innerHTML = contact;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, CONTACT_TYPE);
  span.setAttribute(CONTACT_DATA_ATTRIBUTE, contact);

  // multiple variables (ex: [[[FIRST]]], [[[LAST]]] are supported by this serializer
  // sub type indicates which one
  span.setAttribute(CONTACT_SUB_TYPE, subType);
};

export const createContactDataFromDom = (domNode) => domNode.getAttribute(CONTACT_DATA_ATTRIBUTE);
export const getSubTypeDataFromDom = (domNode) => domNode.getAttribute(CONTACT_SUB_TYPE);
