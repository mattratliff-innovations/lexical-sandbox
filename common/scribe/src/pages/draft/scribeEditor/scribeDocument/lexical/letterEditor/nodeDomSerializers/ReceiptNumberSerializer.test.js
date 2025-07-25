import { RECEIPT_NUMBER_DATA_ATTRIBUTE, RECEIPT_NUMBER_TYPE, createReceiptDataFromDom, serializeToHtml } from './ReceiptNumberSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

describe('serializeToHtml', () => {
  it('sets the data attribute and inner text to the receipt number', () => {
    const receiptNumber = 'SRC123';
    const span = document.createElement('span');

    serializeToHtml(span, receiptNumber);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(RECEIPT_NUMBER_TYPE);
    expect(span.getAttribute(RECEIPT_NUMBER_DATA_ATTRIBUTE)).toBe(receiptNumber);
    expect(span.innerHTML).toBe(receiptNumber);
  });
});

describe('createReceiptDataFromDom', () => {
  it('parses the receipt number', () => {
    const receiptNumber = 'IOE123';
    const span = document.createElement('span');
    span.setAttribute(RECEIPT_NUMBER_DATA_ATTRIBUTE, receiptNumber);

    const result = createReceiptDataFromDom(span);

    expect(result).toBe(receiptNumber);
  });
});
