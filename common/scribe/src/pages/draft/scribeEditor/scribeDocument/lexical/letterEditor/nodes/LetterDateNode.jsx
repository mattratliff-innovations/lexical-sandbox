import { $applyNodeReplacement } from 'lexical';
import { ExtendedTextNode, $applyCustomNodeConfiguration } from '../../ExtendedTextNode';
import { serializeToHtml, LETTER_DATE_TYPE, createLetterDateDataFromDom } from '../nodeDomSerializers/LetterDateSerializer';
import { LETTER_DATE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { configureCustomNodeDomImport } from './NodeUtil';
import { getCalculatedLetterDateFromDraft } from '../../../../../../../components/dateHelpers';

class LetterDateNode extends ExtendedTextNode {
  __letterDate;

  static getType() {
    return LETTER_DATE_TYPE;
  }

  static clone(node) {
    return new LetterDateNode(node.__text, node.__letterDate, node.__key);
  }

  constructor(text, letterDate, key) {
    super(text, key);
    this.__letterDate = letterDate;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getLetterDate());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    self.__letterDate = getCalculatedLetterDateFromDraft(draft);
    self.__text = self.__letterDate;
  }

  showVariable() {
    this.setTextContent(LETTER_DATE_SEARCH_TEXT);
  }

  static importDOM() {
    return configureCustomNodeDomImport(LETTER_DATE_TYPE, LetterDateNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const letterDate = createLetterDateDataFromDom(domNode);
    const node = new LetterDateNode(letterDate, letterDate);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return LETTER_DATE_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorisOpen) {
    const letterDate = getCalculatedLetterDateFromDraft(draft);
    const result = editorisOpen ? new LetterDateNode(LETTER_DATE_SEARCH_TEXT, letterDate) : new LetterDateNode(letterDate, letterDate);
    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: LETTER_DATE_TYPE };
  }

  getLetterDate() {
    const self = this.getLatest();
    return self.__letterDate;
  }
}

export default LetterDateNode;
