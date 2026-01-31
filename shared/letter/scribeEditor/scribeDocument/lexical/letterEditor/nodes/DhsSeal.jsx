/* eslint-disable no-underscore-dangle */
import React from 'react';

import { DecoratorNode } from 'lexical';
import { renderToString } from 'react-dom/server';

import { configureCustomNodeDomImport } from './NodeUtil';
import dhsSealBase64 from '../../../../../../../assets/dhsSealBase64';
import dhsSealSvgRef from '../../../../../../../assets/uscis-seal.svg';
import { LETTERHEADER_CIS_SEAL_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { createDhsSealBaseDom, DHS_SEAL_TYPE, getDhsSealFromDom } from '../nodeDomSerializers/DhsSealSerializer';

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
    if (this.__showDhsSeal === false && this.__dhsSeal === LETTERHEADER_CIS_SEAL_SEARCH_TEXT) {
      return;
    }

    const self = this.getWritable();
    self.__showDhsSeal = false;
    self.__dhsSeal = LETTERHEADER_CIS_SEAL_SEARCH_TEXT;
  }

  decorate() {
    if (!this.getShowDhsSeal() || !this.getDhsSeal()) {
      return <span>{LETTERHEADER_CIS_SEAL_SEARCH_TEXT}</span>;
    }

    // ClassName needed for exact positioning within letter header
    return (
      <img
        alt="US Department of Homeland Security seal, US Citizenship and Immigration Services"
        src={`data:image/svg+xml;base64,${dhsSealBase64}`}
        className="img-dhs-seal"
      />
    );
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
    return LETTERHEADER_CIS_SEAL_SEARCH_TEXT;
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
