import React from 'react';
import { DecoratorNode } from 'lexical';
import { renderToString } from 'react-dom/server';
import {
  RECEIPT_NUMBER_BARCODE_TYPE,
  createReceiptNumberBarcodeBaseDom,
  getReceiptNumberFromDom,
} from '../nodeDomSerializers/ReceiptNumberBarcodeSerializer';
import { RECEIPT_NUMBER_BARCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import textToBase64Barcode from '../../../../../../../barcodes/barcodeGenerator';
import { configureCustomNodeDomImport } from './NodeUtil';

class ReceiptNumberBarcode extends DecoratorNode {
  __receiptNumber;

  __showBarcode;

  static getType() {
    return RECEIPT_NUMBER_BARCODE_TYPE;
  }

  static clone(node) {
    return new ReceiptNumberBarcode(node.__receiptNumber, node.__showBarcode, node.__key);
  }

  constructor(receiptNumber, showBarcode, key) {
    super(key);
    this.__receiptNumber = receiptNumber;
    this.__showBarcode = showBarcode;
  }

  createDOM() {
    return createReceiptNumberBarcodeBaseDom(this.getReceiptNumber());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    self.__receiptNumber = draft.registration?.receiptNumber;
    self.__showBarcode = true;
  }

  showVariable() {
    const self = this.getWritable();
    self.__showBarcode = false;
  }

  decorate() {
    if (!this.getShowBarcode() || !this.getReceiptNumber()) {
      return <span>{RECEIPT_NUMBER_BARCODE_SEARCH_TEXT}</span>;
    }
    const alt = `Receipt Number Barcode - ${this.getReceiptNumber()}`;
    // ClassName needed for exact positioning within letter header
    return <img alt={alt} src={textToBase64Barcode(this.getReceiptNumber())} className="img-receipt-number_barcode" />;
  }

  getReceiptNumber() {
    const self = this.getLatest();
    return self.__receiptNumber;
  }

  getShowBarcode() {
    const self = this.getLatest();
    return self.__showBarcode;
  }

  static createNodeFromDom(dom) {
    const receiptNumber = getReceiptNumberFromDom(dom);
    return new ReceiptNumberBarcode(receiptNumber, true);
  }

  static importDOM() {
    return configureCustomNodeDomImport(RECEIPT_NUMBER_BARCODE_TYPE, ReceiptNumberBarcode.createNodeFromDom);
  }

  exportDOM(editor) {
    const exportDOMResult = super.exportDOM(editor);
    const { element } = exportDOMResult;
    element.innerHTML = renderToString(this.decorate());
    return { ...exportDOMResult };
  }

  static searchText() {
    return RECEIPT_NUMBER_BARCODE_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    const receiptNumber = draft.registration?.receiptNumber;
    return new ReceiptNumberBarcode(receiptNumber, !editorIsOpen);
  }

  // Returning false tells Lexical that this node does not need its
  // DOM element replacing with a new copy from createDOM.
  // eslint-disable-next-line class-methods-use-this
  updateDOM() {
    return false;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return {};
  }
}

export default ReceiptNumberBarcode;
