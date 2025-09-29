import { $applyNodeReplacement } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import { PAGEBREAK_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import { createPageBreakDataFromDom, PAGEBREAK_TYPE, serializeToHtml } from '../nodeDomSerializers/PageBreakSerializer';

class PageBreakNode extends ExtendedTextNode {
  __pagebreak;

  static getType() {
    return PAGEBREAK_TYPE;
  }

  static clone(node) {
    return new PageBreakNode(node.__text, node.__pagebreak, node.__key);
  }

  constructor(text, pagebreakNumber, key) {
    super(text, key);
    this.__pagebreak = pagebreakNumber;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getpagebreakNumber());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    const div = document.createElement('div'); // Create a div element
    div.setAttribute('data-type', 'pagebreak'); // Add a custom attribute for identification
    div.setAttribute('class', 'page-break');
    div.textContent = 'Page Break'; // Set the content of the div
    self.__pagebreak = div.outerHTML; // Serialize the div to HTML and store it
    self.__text = self.__pagebreak;
  }

  showVariable() {
    this.setTextContent(PAGEBREAK_SEARCH_TEXT);
  }

  static importDOM() {
    return configureCustomNodeDomImport(PAGEBREAK_TYPE, PageBreakNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const pagebreak = createPageBreakDataFromDom(domNode);
    const node = new PageBreakNode(pagebreak, pagebreak);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return PAGEBREAK_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorisOpen) {
    const pagebreakNumber = draft.registration?.pagebreakNumber;
    const result = editorisOpen ? new PageBreakNode(PAGEBREAK_SEARCH_TEXT, pagebreakNumber) : new PageBreakNode(pagebreakNumber, pagebreakNumber);
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

  getpagebreakNumber() {
    const self = this.getLatest();
    return self.__pagebreak;
  }
}

export default PageBreakNode;
