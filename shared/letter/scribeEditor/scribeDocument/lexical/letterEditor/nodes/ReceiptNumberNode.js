import { $applyNodeReplacement } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import { RECEIPT_NUMBER_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import { createReceiptDataFromDom, RECEIPT_NUMBER_TYPE, serializeToHtml } from '../nodeDomSerializers/ReceiptNumberSerializer';

class ReceiptNumberNode extends ExtendedTextNode {
  __receiptNumber;

  static getType() {
    return RECEIPT_NUMBER_TYPE;
  }

  static clone(node) {
    return new ReceiptNumberNode(node.__text, node.__receiptNumber, node.__key);
  }

  constructor(text, receiptNumber, key) {
    super(text, key);
    this.__receiptNumber = receiptNumber;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getReceiptNumber());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    self.__receiptNumber = draft.registration?.receiptNumber;
    self.__text = self.__receiptNumber;
  }

  showVariable() {
    this.setTextContent(RECEIPT_NUMBER_SEARCH_TEXT);
  }

  static importDOM() {
    return configureCustomNodeDomImport(RECEIPT_NUMBER_TYPE, ReceiptNumberNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const receiptNumber = createReceiptDataFromDom(domNode);
    const node = new ReceiptNumberNode(receiptNumber, receiptNumber);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return RECEIPT_NUMBER_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorisOpen) {
    const receiptNumber = draft.registration?.receiptNumber;
    const result = editorisOpen
      ? new ReceiptNumberNode(RECEIPT_NUMBER_SEARCH_TEXT, receiptNumber)
      : new ReceiptNumberNode(receiptNumber, receiptNumber);
    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return {};
  }

  getReceiptNumber() {
    const self = this.getLatest();
    return self.__receiptNumber;
  }
}

export default ReceiptNumberNode;
