/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

import { DecoratorNode } from 'lexical';
import { renderToString } from 'react-dom/server';

import { PAGEBREAK_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { createPagebreakBaseDom, getPageBreakFromDom, PAGEBREAK_TYPE } from '../nodeDomSerializers/PageBreakSerializer';

class PageBreakNode extends DecoratorNode {
  __pagebreak;

  __showPageBreak;

  static getType() {
    return PAGEBREAK_TYPE;
  }

  static clone(node) {
    return new PageBreakNode(node.__pagebreak, node.__showPageBreak, node.__key);
  }

  constructor(pagebreakData, showPageBreak, key) {
    super(key);
    this.__pagebreak = pagebreakData || PAGEBREAK_SEARCH_TEXT;
    this.__showPageBreak = showPageBreak;
  }

  createDOM() {
    return createPagebreakBaseDom();
  }

  updateFromDraft(draft, options, editor) {
    const self = this.getWritable();
    const pagebreakData = PageBreakNode.getPageBreakData(draft);

    if (pagebreakData) {
      // Use the pagebreak data from the draft
      self.__pagebreak = pagebreakData;
      self.__showPageBreak = true;
      return;
    }

    const editorRoot = editor.getRootElement();
    const pagebreakElement = editorRoot?.querySelector('[data-lexical-custom-node-type="data-page-break"]');

    if (pagebreakElement) {
      // Extract pagebreakData from the editor
      self.__pagebreak = pagebreakElement.outerHTML;
      self.__showPageBreak = true;
      return;
    }

    // Default behavior if no pagebreakData is found
    self.__pagebreak = PAGEBREAK_SEARCH_TEXT;
    self.__showPageBreak = false;
  }

  showVariable() {
    const self = this.getWritable();
    self.__showPageBreak = false;
    self.__pagebreak = PAGEBREAK_SEARCH_TEXT;
  }

  decorate() {
    // IMPORTANT: Both branches MUST include data-lexical-custom-node-type and data-page-break
    // so the node can be properly recognized and re-imported on page reload

    // When editor is focused, show the variable name
    if (!this.__showPageBreak) {
      return (
        <div data-lexical-custom-node-type="data-page-break" data-page-break={this.__pagebreak} style={{ display: 'inline' }}>
          {PAGEBREAK_SEARCH_TEXT}
        </div>
      );
    }

    // When editor is not focused, show the visual page break
    return (
      <div
        data-lexical-custom-node-type="data-page-break"
        data-page-break={this.__pagebreak}
        data-type="pagebreak"
        style={{
          pageBreakAfter: 'always',
          height: '1px',
          borderTop: '2px dashed #ccc',
          margin: '10px 0',
          position: 'relative',
          padding: '5px',
        }}
      />
    );
  }

  getPageBreak() {
    const self = this.getLatest();
    return self.__pagebreak;
  }

  getShowPagebreak() {
    const self = this.getLatest();
    return self.__showPageBreak;
  }

  static createNodeFromDom(domNode) {
    const pb = getPageBreakFromDom(domNode);

    // Always create with valid data
    if (!pb || pb === PAGEBREAK_SEARCH_TEXT) {
      return new PageBreakNode(PAGEBREAK_SEARCH_TEXT, false);
    }

    return new PageBreakNode(pb, true);
  }

  static importDOM() {
    return {
      div: (domNode) => {
        // Check if this div is a PageBreakNode by looking for our identifying attribute
        const customNodeType = domNode.getAttribute('data-lexical-custom-node-type');

        if (customNodeType === 'data-page-break' || domNode.hasAttribute('data-page-break')) {
          return {
            conversion: (element) => {
              const node = PageBreakNode.createNodeFromDom(element);
              return { node };
            },
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM(editor) {
    const exportDOMResult = super.exportDOM(editor);
    const { element } = exportDOMResult;

    // For export (PDF/print), always render the actual page break HTML
    const pageBreakHTML = (
      <div
        data-lexical-custom-node-type="data-page-break"
        data-page-break={this.__pagebreak}
        data-type="pagebreak"
        style={{
          pageBreakAfter: 'always',
          height: '1px',
          borderTop: '2px dashed #ccc',
          margin: '10px 0',
          position: 'relative',
          padding: '5px',
        }}
      />
    );

    element.innerHTML = renderToString(pageBreakHTML);
    return { ...exportDOMResult };
  }

  static searchText() {
    return PAGEBREAK_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    const pagebreakData = PageBreakNode.getPageBreakData(draft);
    const validPagebreakData = pagebreakData || PAGEBREAK_SEARCH_TEXT;
    return new PageBreakNode(validPagebreakData, !editorIsOpen);
  }

  static getPageBreakData(draft) {
    return draft?.sections?.find((section) => section.text.includes('data-page-break'))?.text || null;
  }

  updateDOM() {
    return false;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  exportJSON() {
    return { type: PAGEBREAK_TYPE };
  }
}

export default PageBreakNode;
