import { LETTER_DATE_DATA_ATTRIBUTE, LETTER_DATE_TYPE, createLetterDateDataFromDom, serializeToHtml } from './LetterDateSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the letter date', () => {
    const letterDate = '05/18/1980';
    const span = document.createElement('span');

    serializeToHtml(span, letterDate);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(LETTER_DATE_TYPE);
    expect(span.getAttribute(LETTER_DATE_DATA_ATTRIBUTE)).toBe(letterDate);
    expect(span.innerHTML).toBe(letterDate);
  });
});

describe('createLetterDateDataFromDom', () => {
  it('parses the letter date', () => {
    const letterDate = '05/18/1980';
    const span = document.createElement('span');
    span.setAttribute(LETTER_DATE_DATA_ATTRIBUTE, letterDate);

    const result = createLetterDateDataFromDom(span);

    expect(result).toBe(letterDate);
  });
});
