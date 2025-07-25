import { ALIEN_NUMBER_BARCODE_TYPE, ALIEN_NUMBER_KEY, getAlienNumberFromDom, createAlienNumberBarcodeBaseDom } from './AlienNumberBarcodeSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('getAlienNumberFromDom', () => {
  it('gets the alien number from the dom', () => {
    const alienNumber = 'bleh';
    const span = document.createElement('span');
    span.setAttribute(ALIEN_NUMBER_KEY, alienNumber);

    const result = getAlienNumberFromDom(span);

    expect(result).toBe(alienNumber);
  });
});

describe('createAlienNumberBarcodeBaseDom', () => {
  it('creates the base span tag with the necessary data attributes', () => {
    const alienNumber = 'bleh';

    const result = createAlienNumberBarcodeBaseDom(alienNumber);

    expect(result.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(ALIEN_NUMBER_BARCODE_TYPE);
    expect(result.getAttribute(ALIEN_NUMBER_KEY)).toBe(alienNumber);
  });
});
