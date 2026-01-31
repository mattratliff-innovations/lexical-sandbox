import {
  CONTACT_DATA_ATTRIBUTE,
  CONTACT_SUB_TYPE,
  CONTACT_TYPE,
  createContactDataFromDom,
  getSubTypeDataFromDom,
  serializeToHtml,
} from './ContactsSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the last name', () => {
    const primaryAppplicantLastName = 'Doe';
    const subType = '[[[ANY_SEARCH_TEXT]]]';
    const span = document.createElement('span');

    serializeToHtml(span, primaryAppplicantLastName, subType);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(CONTACT_TYPE);
    expect(span.getAttribute(CONTACT_DATA_ATTRIBUTE)).toBe(primaryAppplicantLastName);
    expect(span.getAttribute(CONTACT_SUB_TYPE)).toBe(subType);
    expect(span.innerHTML).toBe(primaryAppplicantLastName);
  });
});

describe('createContactDataFromDom', () => {
  it('parses the last name', () => {
    const primaryAppplicantLastName = 'Smith';
    const span = document.createElement('span');
    span.setAttribute(CONTACT_DATA_ATTRIBUTE, primaryAppplicantLastName);

    const result = createContactDataFromDom(span);

    expect(result).toBe(primaryAppplicantLastName);
  });

  it('parses the subtype name', () => {
    const span = document.createElement('span');
    const subType = '[[[VARIABLE_SEARCH_TEXT]]]';
    span.setAttribute(CONTACT_SUB_TYPE, subType);

    const result = getSubTypeDataFromDom(span);

    expect(result).toBe(subType);
  });
});
