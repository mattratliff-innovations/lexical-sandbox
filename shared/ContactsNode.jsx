import { $applyNodeReplacement } from 'lexical';

import { configureCustomNodeDomImport } from './NodeUtil';
import {
  ALIEN_NUMBER_SEARCH_TEXT,
  getVariableValue,
  PETITIONER_A_NUMBER_SEARCH_TEXT,
  PETITIONER_CITY_SEARCH_TEXT,
  PETITIONER_DOB_SEARCH_TEXT,
  PETITIONER_FIRM_NAME_SEARCH_TEXT,
  PETITIONER_FIRST_NAME_SEARCH_TEXT,
  PETITIONER_IN_CARE_OF_SEARCH_TEXT,
  PETITIONER_LAST_NAME_SEARCH_TEXT,
  PETITIONER_MIDDLE_NAME_SEARCH_TEXT,
  PETITIONER_STATE_SEARCH_TEXT,
  PETITIONER_STREET_SEARCH_TEXT,
  PETITIONER_ZIP_CODE_SEARCH_TEXT,
  PRIMARY_APPLICANT_A_NUMBER_SEARCH_TEXT,
  PRIMARY_APPLICANT_CITY_SEARCH_TEXT,
  PRIMARY_APPLICANT_DOB_SEARCH_TEXT,
  PRIMARY_APPLICANT_FIRST_NAME_SEARCH_TEXT,
  PRIMARY_APPLICANT_LAST_SEARCH_TEXT,
  PRIMARY_APPLICANT_MIDDLE_NAME_SEARCH_TEXT,
  PRIMARY_APPLICANT_STATE_SEARCH_TEXT,
  PRIMARY_APPLICANT_STREET_SEARCH_TEXT,
  PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT,
  PRIMARY_APPLICANT_ZIP_SEARCH_TEXT,
  removeBracketsFromSearchText,
  REPRESENTATIVE_CITY_SEARCH_TEXT,
  REPRESENTATIVE_COUNTRY_SEARCH_TEXT,
  REPRESENTATIVE_FIRM_NAME_SEARCH_TEXT,
  REPRESENTATIVE_FIRST_NAME_SEARCH_TEXT,
  REPRESENTATIVE_IN_CARE_OF_SEARCH_TEXT,
  REPRESENTATIVE_LAST_NAME_SEARCH_TEXT,
  REPRESENTATIVE_MIDDLE_NAME_SEARCH_TEXT,
  REPRESENTATIVE_POSTAL_CODE_SEARCH_TEXT,
  REPRESENTATIVE_PROVINCE_SEARCH_TEXT,
  REPRESENTATIVE_STATE_SEARCH_TEXT,
  REPRESENTATIVE_STREET1_SEARCH_TEXT,
  REPRESENTATIVE_STREET2_SEARCH_TEXT,
  REPRESENTATIVE_ZIP_CODE_SEARCH_TEXT,
} from '../../../ScribeDocumentConstants';
import { $applyCustomNodeConfiguration, ExtendedTextNode } from '../../ExtendedTextNode';
import { CONTACT_TYPE, createContactDataFromDom, getSubTypeDataFromDom, serializeToHtml } from '../nodeDomSerializers/ContactsSerializer';

class ContactsNode extends ExtendedTextNode {
  __contactVariable; // this can be the variableName or the actual value

  __subType; // now that node handles multiple varaiables, subType identifies which one

  static getType() {
    return CONTACT_TYPE;
  }

  static clone(node) {
    return new ContactsNode(node.__text, node.__contactVariable, node.__subType, node.__key);
  }

  constructor(text, __contactVariable, subType, key) {
    super(text, key);
    this.__contactVariable = __contactVariable;
    this.__subType = subType;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getPrimaryApplicantVariable(), this.getSubType());
  }

  updateFromDraft(draft, searchText) {
    const self = this.getWritable();

    // use the mapper to get the actual value. (ex: [[[LAST]]] would return DOE)
    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft);

    // storing either DOE or [[[LAST]]]
    self.__contactVariable = variableValue || searchText;
    self.__text = self.__contactVariable;
  }

  showVariable(searchText) {
    this.setTextContent(searchText);
  }

  static importDOM() {
    return configureCustomNodeDomImport(CONTACT_TYPE, ContactsNode.createNodeFromDom);
  }

  // Called on page load, gets the attribute values form the dom to create a ContactsNode
  static createNodeFromDom(domNode) {
    const contactData = createContactDataFromDom(domNode);
    const subType = getSubTypeDataFromDom(domNode);
    const node = new ContactsNode(contactData, contactData, subType);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  // Called by Variable Plugin to get the variable name
  static searchText() {
    return [
      ALIEN_NUMBER_SEARCH_TEXT,
      PETITIONER_A_NUMBER_SEARCH_TEXT,
      PETITIONER_CITY_SEARCH_TEXT,
      PETITIONER_DOB_SEARCH_TEXT,
      PETITIONER_FIRM_NAME_SEARCH_TEXT,
      PETITIONER_FIRST_NAME_SEARCH_TEXT,
      PETITIONER_IN_CARE_OF_SEARCH_TEXT,
      PETITIONER_LAST_NAME_SEARCH_TEXT,
      PETITIONER_MIDDLE_NAME_SEARCH_TEXT,
      PETITIONER_STATE_SEARCH_TEXT,
      PETITIONER_STREET_SEARCH_TEXT,
      PETITIONER_ZIP_CODE_SEARCH_TEXT,
      PRIMARY_APPLICANT_A_NUMBER_SEARCH_TEXT,
      PRIMARY_APPLICANT_CITY_SEARCH_TEXT,
      PRIMARY_APPLICANT_DOB_SEARCH_TEXT,
      PRIMARY_APPLICANT_FIRST_NAME_SEARCH_TEXT,
      PRIMARY_APPLICANT_LAST_SEARCH_TEXT,
      PRIMARY_APPLICANT_MIDDLE_NAME_SEARCH_TEXT,
      PRIMARY_APPLICANT_STATE_SEARCH_TEXT,
      PRIMARY_APPLICANT_STREET_SEARCH_TEXT,
      PRIMARY_APPLICANT_SUITE_APT_SEARCH_TEXT,
      PRIMARY_APPLICANT_ZIP_SEARCH_TEXT,
      REPRESENTATIVE_CITY_SEARCH_TEXT,
      REPRESENTATIVE_COUNTRY_SEARCH_TEXT,
      REPRESENTATIVE_FIRM_NAME_SEARCH_TEXT,
      REPRESENTATIVE_FIRST_NAME_SEARCH_TEXT,
      REPRESENTATIVE_IN_CARE_OF_SEARCH_TEXT,
      REPRESENTATIVE_LAST_NAME_SEARCH_TEXT,
      REPRESENTATIVE_MIDDLE_NAME_SEARCH_TEXT,
      REPRESENTATIVE_POSTAL_CODE_SEARCH_TEXT,
      REPRESENTATIVE_PROVINCE_SEARCH_TEXT,
      REPRESENTATIVE_STATE_SEARCH_TEXT,
      REPRESENTATIVE_STREET1_SEARCH_TEXT,
      REPRESENTATIVE_STREET2_SEARCH_TEXT,
      REPRESENTATIVE_ZIP_CODE_SEARCH_TEXT,
    ];
  }

  // Called by Variable Plugin $transformVariable to replace an extended text node with a ContactsNode
  static createFromEditor(draft, editorIsOpen, searchText) {
    let result = new ContactsNode(searchText, searchText, searchText);

    const variableName = removeBracketsFromSearchText(searchText);
    const variableValue = getVariableValue(variableName, draft);
    const contactValue = variableValue === undefined ? searchText : variableValue;

    // creates a node with the variable name as the text and sets __contactVariable to empty string
    if (editorIsOpen === undefined && !variableValue) result = new ContactsNode(searchText, '', searchText);

    // editor closed and there is a A-Number value - show value
    // creates a node with the variable value (ex: "Doe") as the text and sets __primaryApplicant to the variable value also
    if (!editorIsOpen && variableValue) result = new ContactsNode(contactValue, contactValue, searchText);

    $applyCustomNodeConfiguration(result);
    return result;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: CONTACT_TYPE };
  }

  getPrimaryApplicantVariable() {
    const self = this.getLatest();
    return self.__contactVariable;
  }

  getSubType() {
    const self = this.getLatest();
    return self.__subType;
  }
}

export default ContactsNode;
