import { $applyNodeReplacement } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import { getVariableValue, removeBracketsFromSearchText, RPCODE_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import { createUserDataFromDom, getSubTypeDataFromDom, serializeToHtml, USER_TYPE } from '../nodeDomSerializers/UserSerializer';

class UserNode extends ExtendedTextNode {
  __userVariable; // this can be the variableName or the actual value

  __subType; // now that node handles multiple varaiables, subType identifies which one

  static getType() {
    return USER_TYPE;
  }

  static clone(node) {
    return new UserNode(node.__text, node.__userVariable, node.__subType, node.__key);
  }

  constructor(text, __userVariable, subType, key) {
    super(text, key);
    this.__userVariable = __userVariable;
    this.__subType = subType;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getUserDetailVariable(), this.getSubType());
  }

  updateFromDraft(draft, searchText, currentUser) {
    const self = this.getWritable();

    // use the mapper to get the actual value. (ex: [[[LAST]]] would return DOE)
    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft, currentUser);

    // storing either DOE or [[[LAST]]]
    self.__userVariable = variableValue || searchText;
    self.__text = self.__userVariable;
  }

  showVariable(searchText) {
    this.setTextContent(searchText);
  }

  static importDOM() {
    return configureCustomNodeDomImport(USER_TYPE, UserNode.createNodeFromDom);
  }

  // Called on page load, gets the attribute values form the dom to create a UserNode
  static createNodeFromDom(domNode) {
    const userDetailData = createUserDataFromDom(domNode);
    const subType = getSubTypeDataFromDom(domNode);
    const node = new UserNode(userDetailData, userDetailData, subType);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  // Called by Variable Plugin to get the variable name
  static searchText() {
    return [RPCODE_SEARCH_TEXT];
  }

  // Called by Variable Plugin $transformVariable to replace an extended text node with a UserNode
  static createFromEditor(draft, editorIsOpen, searchText, currentUser) {
    let result = new UserNode(searchText, searchText, searchText);

    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft, currentUser);
    const userDetail = variableValue === undefined ? searchText : variableValue;

    // creates a node with the variable name as the text and sets __userVariable to empty string
    if (editorIsOpen === undefined && !variableValue) result = new UserNode(searchText, '', searchText);

    // editor closed and there is a A-Number value - show value
    // creates a node with the variable value (ex: "Doe") as the text and sets __primaryApplicant to the variable value also
    if (!editorIsOpen && variableValue) result = new UserNode(userDetail, userDetail, searchText);

    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: USER_TYPE };
  }

  getUserDetailVariable() {
    const self = this.getLatest();
    return self.__userVariable;
  }

  getSubType() {
    const self = this.getLatest();
    return self.__subType;
  }
}

export default UserNode;
