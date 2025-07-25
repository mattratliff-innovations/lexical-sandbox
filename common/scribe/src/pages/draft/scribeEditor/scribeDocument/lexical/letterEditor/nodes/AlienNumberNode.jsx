import { $applyNodeReplacement } from 'lexical';
import { ExtendedTextNode, $applyCustomNodeConfiguration } from '../../ExtendedTextNode';
import { serializeToHtml, ALIEN_NUMBER_TYPE, createAlienNumberDataFromDom } from '../nodeDomSerializers/AlienNumberSerializer';
import { ALIEN_NUMBER_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { configureCustomNodeDomImport } from './NodeUtil';
import primaryApplicant from '../nodeDomSerializers/DraftSerializerUtil';

class AlienNumberNode extends ExtendedTextNode {
  __alienNumber;

  static getType() {
    return ALIEN_NUMBER_TYPE;
  }

  static clone(node) {
    return new AlienNumberNode(node.__text, node.__alienNumber, node.__key);
  }

  constructor(text, alienNumber, key) {
    super(text, key);
    this.__alienNumber = alienNumber;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getAlienNumber());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    const primaryAlienNumber = primaryApplicant(draft)?.aNumber;
    self.__alienNumber = primaryAlienNumber || ALIEN_NUMBER_SEARCH_TEXT;
    self.__text = self.__alienNumber;
  }

  showVariable() {
    this.setTextContent(ALIEN_NUMBER_SEARCH_TEXT);
  }

  static importDOM() {
    return configureCustomNodeDomImport(ALIEN_NUMBER_TYPE, AlienNumberNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const alienNumber = createAlienNumberDataFromDom(domNode);
    const node = new AlienNumberNode(alienNumber, alienNumber);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return ALIEN_NUMBER_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorIsOpen) {
    let result = new AlienNumberNode(ALIEN_NUMBER_SEARCH_TEXT, ALIEN_NUMBER_SEARCH_TEXT);

    const primaryAlienNumber = primaryApplicant(draft)?.aNumber;
    const alienNumber = primaryAlienNumber === undefined ? ALIEN_NUMBER_SEARCH_TEXT : primaryAlienNumber;

    // This is for the header
    if (editorIsOpen === undefined && !primaryAlienNumber) result = new AlienNumberNode(ALIEN_NUMBER_SEARCH_TEXT, '');

    // editor closed and A-Number value - show value
    if (!editorIsOpen && primaryAlienNumber) result = new AlienNumberNode(alienNumber, alienNumber);

    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: ALIEN_NUMBER_TYPE };
  }

  getAlienNumber() {
    const self = this.getLatest();
    return self.__alienNumber;
  }
}

export default AlienNumberNode;
