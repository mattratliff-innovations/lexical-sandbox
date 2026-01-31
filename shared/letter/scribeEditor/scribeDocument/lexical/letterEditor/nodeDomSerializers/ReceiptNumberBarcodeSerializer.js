import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const RECEIPT_NUMBER_BARCODE_TYPE = 'receiptNumberBarcode';
export const RECEIPT_NUMBER_KEY = 'data-receipt-number';
export const getReceiptNumberFromDom = (dom) => dom.getAttribute(RECEIPT_NUMBER_KEY);

export const createReceiptNumberBarcodeBaseDom = (receiptNumber) => {
  const dom = document.createElement('span');
  dom.setAttribute(CUSTOM_NODE_TYPE_KEY, RECEIPT_NUMBER_BARCODE_TYPE);
  dom.setAttribute(RECEIPT_NUMBER_KEY, receiptNumber);
  return dom;
};
