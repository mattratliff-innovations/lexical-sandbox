import {
  createLetterDetailDataFromDom,
  getSubTypeDataFromDom,
  LETTER_DETAILS_DATA_ATTRIBUTE,
  LETTER_DETAILS_SUB_TYPE,
  LETTER_DETAILS_TYPE,
  serializeToHtml,
} from './LetterDetailsSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the form type name', () => {
    const formTypeName = 'N300';
    const subType = '[[[ANY_SEARCH_TEXT]]]';
    const span = document.createElement('span');

    serializeToHtml(span, formTypeName, subType);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(LETTER_DETAILS_TYPE);
    expect(span.getAttribute(LETTER_DETAILS_DATA_ATTRIBUTE)).toBe(formTypeName);
    expect(span.getAttribute(LETTER_DETAILS_SUB_TYPE)).toBe(subType);
    expect(span.innerHTML).toBe(formTypeName);
  });
});

describe('createPrimaryApplicantDataFromDom', () => {
  it('parses the last name', () => {
    const formTypeName = 'I90';
    const span = document.createElement('span');
    span.setAttribute(LETTER_DETAILS_DATA_ATTRIBUTE, formTypeName);

    const result = createLetterDetailDataFromDom(span);

    expect(result).toBe(formTypeName);
  });

  it('parses the subtype name', () => {
    const span = document.createElement('span');
    const subType = '[[[VARIABLE_SEARCH_TEXT]]]';
    span.setAttribute(LETTER_DETAILS_SUB_TYPE, subType);

    const result = getSubTypeDataFromDom(span);

    expect(result).toBe(subType);
  });
});
