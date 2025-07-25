import React from 'react';
import { DecoratorNode } from 'lexical';
import { renderToString } from 'react-dom/server';
import { DHS_SEAL_TYPE, createDhsSealBaseDom, getDhsSealFromDom } from '../nodeDomSerializers/DhsSealSerializer';
import { DHS_SEAL_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import dhsSealSvgRef from '../../../../../../../assets/uscis-seal.svg';
import dhsSealBase64 from '../../../../../../../assets/dhsSealBase64';
import { configureCustomNodeDomImport } from './NodeUtil';

class DhsSeal extends DecoratorNode {
  __dhsSeal;

  __showDhsSeal;

  static getType() {
    return DHS_SEAL_TYPE;
  }

  static clone(node) {
    return new DhsSeal(node.__dhsSeal, node.__showDhsSeal, node.__key);
  }

  constructor(dhsSeal, showDhsSeal, key) {
    super(key);
    this.__dhsSeal = dhsSeal;
    this.__showDhsSeal = showDhsSeal;
  }

  createDOM() {
    return createDhsSealBaseDom(this.getDhsSeal());
  }

  updateFromDraft() {
    const self = this.getWritable();
    self.__dhsSeal = dhsSealSvgRef;
    self.__showDhsSeal = true;
  }

  showVariable() {
    const self = this.getWritable();
    self.__showDhsSeal = false;
  }

  decorate() {
    if (!this.getShowDhsSeal() || !this.getDhsSeal()) {
      return <span>{DHS_SEAL_SEARCH_TEXT}</span>;
    }

    // ClassName needed for exact positioning within letter header
    return <img alt="DHS Seal" src={`data:image/svg+xml;base64,${dhsSealBase64}`} className="img-dhs-seal" />;
  }

  getDhsSeal() {
    const self = this.getLatest();
    return self.__dhsSeal;
  }

  getShowDhsSeal() {
    const self = this.getLatest();
    return self.__showDhsSeal;
  }

  static createNodeFromDom(dom) {
    const dhsSeal = getDhsSealFromDom(dom);
    return new DhsSeal(dhsSeal, true);
  }

  static importDOM() {
    return configureCustomNodeDomImport(DHS_SEAL_TYPE, DhsSeal.createNodeFromDom);
  }

  exportDOM(editor) {
    const exportDOMResult = super.exportDOM(editor);
    const { element } = exportDOMResult;
    element.innerHTML = renderToString(this.decorate());
    return { ...exportDOMResult };
  }

  static searchText() {
    return DHS_SEAL_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    return new DhsSeal(dhsSealSvgRef, !editorIsOpen);
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

export default DhsSeal;
