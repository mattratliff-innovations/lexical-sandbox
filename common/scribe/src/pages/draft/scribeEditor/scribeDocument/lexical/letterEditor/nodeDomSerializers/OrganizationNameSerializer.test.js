import {
  ORGANIZATION_NAME_DATA_ATTRIBUTE,
  ORGANIZATION_NAME_TYPE,
  createOrganizationNameDataFromDom,
  serializeToHtml,
} from './OrganizationNameSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the organization_name', () => {
    const organizationName = 'Vermont Service Center';
    const span = document.createElement('span');

    serializeToHtml(span, organizationName);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(ORGANIZATION_NAME_TYPE);
    expect(span.getAttribute(ORGANIZATION_NAME_DATA_ATTRIBUTE)).toBe(organizationName);
    expect(span.innerHTML).toBe(organizationName);
  });
});

describe('createOrganizationNameDataFromDom', () => {
  it('parses the organization_name', () => {
    const organizationName = 'California Service Center';
    const span = document.createElement('span');
    span.setAttribute(ORGANIZATION_NAME_DATA_ATTRIBUTE, organizationName);

    const result = createOrganizationNameDataFromDom(span);

    expect(result).toBe(organizationName);
  });
});
