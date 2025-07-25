import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const ORGANIZATION_NAME_DATA_ATTRIBUTE = 'data-organization-name';
export const ORGANIZATION_NAME_TYPE = 'organizationName';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, organizationName) => {
  span.innerHTML = organizationName;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, ORGANIZATION_NAME_TYPE);

  span.setAttribute(ORGANIZATION_NAME_DATA_ATTRIBUTE, organizationName);
};

export const createOrganizationNameDataFromDom = (domNode) => domNode.getAttribute(ORGANIZATION_NAME_DATA_ATTRIBUTE);
