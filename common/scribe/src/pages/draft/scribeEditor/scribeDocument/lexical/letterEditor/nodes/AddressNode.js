import { $applyNodeReplacement } from 'lexical';
import { ExtendedTextNode, $applyCustomNodeConfiguration } from '../../ExtendedTextNode';
import { createContactFromDom, contactToText, findDraftContact, serializeToHtml, ADDRESS_TYPE } from '../nodeDomSerializers/AddressNodeSerializer';
import { configureCustomNodeDomImport } from './NodeUtil';
import { RECIPIENT_ADDRESS_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

export class AddressNode extends ExtendedTextNode {
  __contact;

  static getType() {
    return ADDRESS_TYPE;
  }

  static clone(node) {
    return new AddressNode(node.__text, node.__contact, node.__key);
  }

  constructor(text, contact, key) {
    super(text, key);
    this.__contact = contact;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getContact());
  }

  static importDOM() {
    return configureCustomNodeDomImport(ADDRESS_TYPE, AddressNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const contact = createContactFromDom(domNode);
    // I consider this acceptable since breaking these out into more files would add more cognitive load than is necessary.
    // eslint-disable-next-line no-use-before-define
    return $createAddressNodeFromContact(contact);
  }

  static searchText() {
    return RECIPIENT_ADDRESS_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorisOpen, options, searchText = RECIPIENT_ADDRESS_SEARCH_TEXT) {
    const contact = findDraftContact(draft, options);
    const contactText = contactToText(contact);
    const result = editorisOpen ? new AddressNode(searchText, contact) : new AddressNode(contactText, contact);
    $applyCustomNodeConfiguration(result);
    return result;
  }

  // searchText is never passed in, it can probably be hardcoded as the Constant
  updateFromDraft(draft, options, searchText = RECIPIENT_ADDRESS_SEARCH_TEXT) {
    const self = this.getWritable();
    const contact = findDraftContact(draft, options);
    if (!contact) {
      self.__text = searchText;
      return;
    }
    const serializedTextContact = contactToText(contact);
    self.__contact = contact;
    self.__text = serializedTextContact;
  }

  showVariable(searchText = RECIPIENT_ADDRESS_SEARCH_TEXT) {
    this.setTextContent(searchText);
  }

  getContact() {
    const self = this.getLatest();
    return self.__contact;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: ADDRESS_TYPE };
  }
}

export const $createAddressNodeFromContact = (contact) => {
  const serializedTextContact = contactToText(contact);
  const node = new AddressNode(serializedTextContact, contact);
  $applyCustomNodeConfiguration(node);
  return $applyNodeReplacement(node);
};
