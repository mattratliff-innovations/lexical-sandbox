import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

export const RECEIPT_NUMBER_DATA_ATTRIBUTE = 'data-receipt-number';
export const RECEIPT_NUMBER_TYPE = 'receiptNumber';

// See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
/* eslint-disable no-param-reassign */
export const serializeToHtml = (span, receiptNumber) => {
  span.innerHTML = receiptNumber;
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, RECEIPT_NUMBER_TYPE);

  span.setAttribute(RECEIPT_NUMBER_DATA_ATTRIBUTE, receiptNumber);
};

export const createReceiptDataFromDom = (domNode) => domNode.getAttribute(RECEIPT_NUMBER_DATA_ATTRIBUTE);
