import {
  RECEIPT_NUMBER_BARCODE_TYPE,
  RECEIPT_NUMBER_KEY,
  getReceiptNumberFromDom,
  createReceiptNumberBarcodeBaseDom,
} from './ReceiptNumberBarcodeSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('getReceiptNumberFromDom', () => {
  it('gets the receipt number from the dom', () => {
    const receiptNumber = 'SRC1234567890';
    const span = document.createElement('span');
    span.setAttribute(RECEIPT_NUMBER_KEY, receiptNumber);

    const result = getReceiptNumberFromDom(span);

    expect(result).toBe(receiptNumber);
  });
});

describe('createReceiptNumberBarcodeBaseDom', () => {
  it('creates the base span tag with the necessary data attributes', () => {
    const receiptNumber = 'SRC1234567890';

    const result = createReceiptNumberBarcodeBaseDom(receiptNumber);

    expect(result.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(RECEIPT_NUMBER_BARCODE_TYPE);
    expect(result.getAttribute(RECEIPT_NUMBER_KEY)).toBe(receiptNumber);
  });
});
