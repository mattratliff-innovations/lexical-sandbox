import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import { PAGEBREAK_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import { createPageBreakDataFromDom, PAGEBREAK_TYPE, serializeToHtml } from '../nodeDomSerializers/PageBreakSerializer';

class PageBreakNode extends DecoratorNode {
  __pagebreak;

  static getType() {
    return PAGEBREAK_TYPE;
  }

  static clone(node) {
    return new PageBreakNode(node.__pagebreak, node.__key);
  }

  constructor(pagebreakData, key) {
    super(key);
    this.__pagebreak = pagebreakData || '';
  }

  // This creates the DOM element that will be rendered in the editor
  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-type', 'pagebreak');
    div.setAttribute('class', 'page-break');
    div.style.cssText = 'page-break-after: always; height: 1px; border-top: 2px dashed #ccc; margin: 10px 0; position: relative;';
    
    // Add visual indicator for the editor
    const span = document.createElement('span');
    span.textContent = 'Page Break';
    span.style.cssText = 'position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 12px; color: #666;';
    div.appendChild(span);
    
    return div;
  }

  // This updates the DOM when the node changes
  updateDOM(prevNode, dom) {
    return false; // Return false if no update needed, true if DOM should be replaced
  }

  // This is what gets rendered in the React component tree
  decorate() {
    return (
      <div 
        data-type="pagebreak" 
        className="page-break"
        style={{
          pageBreakAfter: 'always',
          height: '1px',
          borderTop: '2px dashed #ccc',
          margin: '10px 0',
          position: 'relative'
        }}
      >
        <span style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          padding: '0 10px',
          fontSize: '12px',
          color: '#666'
        }}>
          Page Break
        </span>
      </div>
    );
  }

  // For HTML export (when sending to PDF Reactor)
  setHtmlForExport(span) {
    // Create the actual page break div for PDF export
    const div = document.createElement('div');
    div.setAttribute('data-type', 'pagebreak');
    div.setAttribute('class', 'page-break');
    div.style.pageBreakAfter = 'always';
    
    span.innerHTML = div.outerHTML;
    serializeToHtml(span, div.outerHTML);
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    const div = document.createElement('div');
    div.setAttribute('data-type', 'pagebreak');
    div.setAttribute('class', 'page-break');
    div.style.pageBreakAfter = 'always';
    
    self.__pagebreak = div.outerHTML;
  }

  showVariable() {
    // For editor display when showing variable names
    const div = document.createElement('div');
    div.textContent = PAGEBREAK_SEARCH_TEXT;
    div.setAttribute('class', 'page-break-variable');
    this.__pagebreak = div.outerHTML;
  }

  static importDOM() {
    return configureCustomNodeDomImport(PAGEBREAK_TYPE, PageBreakNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const pagebreak = createPageBreakDataFromDom(domNode);
    const node = new PageBreakNode(pagebreak);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return PAGEBREAK_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    const div = document.createElement('div');
    div.setAttribute('data-type', 'pagebreak');
    div.setAttribute('class', 'page-break');
    div.style.pageBreakAfter = 'always';
    
    const pagebreakData = editorIsOpen ? PAGEBREAK_SEARCH_TEXT : div.outerHTML;
    const result = new PageBreakNode(pagebreakData);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  exportJSON() {
    return {
      type: PAGEBREAK_TYPE,
      pagebreak: this.__pagebreak,
      version: 1
    };
  }

  getPagebreakData() {
    const self = this.getLatest();
    return self.__pagebreak;
  }

  // Required method for DecoratorNode
  isInline() {
    return false;
  }

  // Required method for DecoratorNode  
  isKeyboardSelectable() {
    return true;
  }
}