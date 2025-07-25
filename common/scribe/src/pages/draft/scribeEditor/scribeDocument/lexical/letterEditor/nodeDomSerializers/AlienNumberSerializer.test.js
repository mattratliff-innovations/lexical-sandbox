import { ALIEN_NUMBER_DATA_ATTRIBUTE, ALIEN_NUMBER_TYPE, createAlienNumberDataFromDom, serializeToHtml } from './AlienNumberSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the alien number', () => {
    const alienNumber = 'SRC123';
    const span = document.createElement('span');

    serializeToHtml(span, alienNumber);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(ALIEN_NUMBER_TYPE);
    expect(span.getAttribute(ALIEN_NUMBER_DATA_ATTRIBUTE)).toBe(alienNumber);
    expect(span.innerHTML).toBe(alienNumber);
  });
});

describe('createAlienNumberDataFromDom', () => {
  it('parses the alien number', () => {
    const alienNumber = 'IOE123';
    const span = document.createElement('span');
    span.setAttribute(ALIEN_NUMBER_DATA_ATTRIBUTE, alienNumber);

    const result = createAlienNumberDataFromDom(span);

    expect(result).toBe(alienNumber);
  });
});
