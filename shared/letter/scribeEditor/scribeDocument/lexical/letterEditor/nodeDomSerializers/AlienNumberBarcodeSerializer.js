import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const ALIEN_NUMBER_BARCODE_TYPE = 'alienNumberBarcode';
export const ALIEN_NUMBER_KEY = 'data-alien-number';
export const getAlienNumberFromDom = (dom) => dom.getAttribute(ALIEN_NUMBER_KEY);

export const createAlienNumberBarcodeBaseDom = (alienNumber) => {
  const dom = document.createElement('span');
  dom.setAttribute(CUSTOM_NODE_TYPE_KEY, ALIEN_NUMBER_BARCODE_TYPE);
  dom.setAttribute(ALIEN_NUMBER_KEY, alienNumber);
  return dom;
};
