import React from 'react';
import { DecoratorNode } from 'lexical';
import { renderToString } from 'react-dom/server';
import {
  ALIEN_NUMBER_BARCODE_TYPE,
  createAlienNumberBarcodeBaseDom,
  getAlienNumberFromDom,
} from '../nodeDomSerializers/AlienNumberBarcodeSerializer';
import { ALIEN_NUMBER_BARCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import primaryApplicant from '../nodeDomSerializers/DraftSerializerUtil';
import textToBase64Barcode from '../../../../../../../barcodes/barcodeGenerator';
import { configureCustomNodeDomImport } from './NodeUtil';

class AlienNumberBarcode extends DecoratorNode {
  __alienNumber;

  __showBarcode;

  static getType() {
    return ALIEN_NUMBER_BARCODE_TYPE;
  }

  static clone(node) {
    return new AlienNumberBarcode(node.__alienNumber, node.__showBarcode, node.__key);
  }

  constructor(alienNumber, showBarcode, key) {
    super(key);
    this.__alienNumber = alienNumber;
    this.__showBarcode = showBarcode;
  }

  createDOM() {
    return createAlienNumberBarcodeBaseDom(this.getAlienNumber());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    const alienNumber = primaryApplicant(draft)?.aNumber;

    if (alienNumber) {
      self.__alienNumber = alienNumber;
      self.__showBarcode = true;
    } else {
      self.__alienNumber = ALIEN_NUMBER_BARCODE_SEARCH_TEXT;
      self.__showBarcode = false;
    }
  }

  showVariable() {
    const self = this.getWritable();
    self.__showBarcode = false;
  }

  decorate() {
    if (!this.getShowBarcode() || !this.getAlienNumber()) {
      return !this.getAlienNumber() ? <span /> : <span>{ALIEN_NUMBER_BARCODE_SEARCH_TEXT}</span>;
    }

    const alt = `Alien Number Barcode - ${this.getAlienNumber()}`;
    // ClassName needed for exact positioning within letter header
    return <img alt={alt} src={textToBase64Barcode(this.getAlienNumber())} className="img-a-number_barcode" />;
  }

  getAlienNumber() {
    const self = this.getLatest();
    return self.__alienNumber;
  }

  getShowBarcode() {
    const self = this.getLatest();
    return self.__showBarcode;
  }

  static createNodeFromDom(dom) {
    // This code is called on save or refresh. it reads the span and create a node
    const alienNumber = getAlienNumberFromDom(dom);
    if (alienNumber === ALIEN_NUMBER_BARCODE_SEARCH_TEXT) {
      return new AlienNumberBarcode(ALIEN_NUMBER_BARCODE_SEARCH_TEXT, false);
    }
    return new AlienNumberBarcode(alienNumber, true);
  }

  static importDOM() {
    return configureCustomNodeDomImport(ALIEN_NUMBER_BARCODE_TYPE, AlienNumberBarcode.createNodeFromDom);
  }

  exportDOM(editor) {
    const exportDOMResult = super.exportDOM(editor);
    const { element } = exportDOMResult;
    element.innerHTML = renderToString(this.decorate());
    return { ...exportDOMResult };
  }

  static searchText() {
    return ALIEN_NUMBER_BARCODE_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    const alienNumber = primaryApplicant(draft)?.aNumber;

    if (!alienNumber) {
      if (editorIsOpen) {
        return new AlienNumberBarcode(ALIEN_NUMBER_BARCODE_SEARCH_TEXT, !editorIsOpen);
      }
      return new AlienNumberBarcode(null, !editorIsOpen);
    }
    return new AlienNumberBarcode(alienNumber, !editorIsOpen);
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
    return { type: ALIEN_NUMBER_BARCODE_TYPE };
  }
}

export default AlienNumberBarcode;
