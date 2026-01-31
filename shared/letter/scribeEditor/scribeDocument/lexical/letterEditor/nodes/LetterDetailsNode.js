import { $applyNodeReplacement } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import {
  ASSOCIATED_RECEIPT_NUMBER_SEARCH_TEXT,
  CREATE_USER_NAME_SEARCH_TEXT,
  CREATE_USER_RP_CD_SEARCH_TEXT,
  CURRENT_DATE_SEARCH_TEXT,
  FORM_TYPE_NAME_SEARCH_TEXT,
  getVariableValue,
  LETTER_APPEALED_FORM_SEARCH_TEXT,
  LETTER_LAST_DECISION_DATE_SEARCH_TEXT,
  LETTER_RECEIPT_DATE_SEARCH_TEXT,
  LETTER_RECEIPT_NUMBER_SEARCH_TEXT,
  LETTERHEADER_LETTER_DATE_SEARCH_TEXT,
  LETTERHEADER_RECEIPT_ANUMBER_SEARCH_TEXT,
  removeBracketsFromSearchText,
} from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import {
  createLetterDetailDataFromDom,
  getSubTypeDataFromDom,
  LETTER_DETAILS_TYPE,
  serializeToHtml,
} from '../nodeDomSerializers/LetterDetailsSerializer';

class LetterDetailsNode extends ExtendedTextNode {
  __letterVariable; // this can be the variableName or the actual value

  __subType; // now that node handles multiple varaiables, subType identifies which one

  static getType() {
    return LETTER_DETAILS_TYPE;
  }

  static clone(node) {
    return new LetterDetailsNode(node.__text, node.__letterVariable, node.__subType, node.__key);
  }

  constructor(text, __letterVariable, subType, key) {
    super(text, key);
    this.__letterVariable = __letterVariable;
    this.__subType = subType;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getLetterDetailVariable(), this.getSubType());
  }

  updateFromDraft(draft, searchText) {
    const self = this.getWritable();

    // use the mapper to get the actual value. (ex: [[[LAST]]] would return DOE)
    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft);

    // storing either DOE or [[[LAST]]]
    self.__letterVariable = variableValue || searchText;
    self.__text = self.__letterVariable;
  }

  showVariable(searchText) {
    this.setTextContent(searchText);
  }

  static importDOM() {
    return configureCustomNodeDomImport(LETTER_DETAILS_TYPE, LetterDetailsNode.createNodeFromDom);
  }

  // Called on page load, gets the attribute values form the dom to create a LetterDetailsNode
  static createNodeFromDom(domNode) {
    const letterDetailData = createLetterDetailDataFromDom(domNode);
    const subType = getSubTypeDataFromDom(domNode);
    const node = new LetterDetailsNode(letterDetailData, letterDetailData, subType);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  // Called by Variable Plugin to get the variable name
  static searchText() {
    return [
      ASSOCIATED_RECEIPT_NUMBER_SEARCH_TEXT,
      CREATE_USER_NAME_SEARCH_TEXT,
      CREATE_USER_RP_CD_SEARCH_TEXT,
      CURRENT_DATE_SEARCH_TEXT,
      FORM_TYPE_NAME_SEARCH_TEXT,
      LETTER_APPEALED_FORM_SEARCH_TEXT,
      LETTER_LAST_DECISION_DATE_SEARCH_TEXT,
      LETTER_RECEIPT_DATE_SEARCH_TEXT,
      LETTER_RECEIPT_NUMBER_SEARCH_TEXT,
      LETTERHEADER_LETTER_DATE_SEARCH_TEXT,
      LETTERHEADER_RECEIPT_ANUMBER_SEARCH_TEXT,
    ];
  }

  // Called by Variable Plugin $transformVariable to replace an extended text node with a LetterDetailsNode
  static createFromEditor(draft, editorIsOpen, searchText) {
    let result = new LetterDetailsNode(searchText, searchText, searchText);

    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft);
    const letterDetail = variableValue === undefined ? searchText : variableValue;

    // creates a node with the variable name as the text and sets __letterVariable to empty string
    if (editorIsOpen === undefined && !variableValue) result = new LetterDetailsNode(searchText, '', searchText);

    // editor closed and there is a A-Number value - show value
    // creates a node with the variable value (ex: "Doe") as the text and sets __primaryApplicant to the variable value also
    if (!editorIsOpen && variableValue) result = new LetterDetailsNode(letterDetail, letterDetail, searchText);

    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: LETTER_DETAILS_TYPE };
  }

  getLetterDetailVariable() {
    const self = this.getLatest();
    return self.__letterVariable;
  }

  getSubType() {
    const self = this.getLatest();
    return self.__subType;
  }
}

export default LetterDetailsNode;
