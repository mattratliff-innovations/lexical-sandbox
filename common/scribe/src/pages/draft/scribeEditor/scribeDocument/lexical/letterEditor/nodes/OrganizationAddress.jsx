import { $applyNodeReplacement } from 'lexical';
import { $applyCustomNodeConfiguration } from '../../ExtendedTextNode';
import { AddressNode } from './AddressNode';
import {
  createOrganizationAddressFromDom,
  orgAddressToText,
  findDraftOrganizationAddress,
  serializeToHtml,
  ORGANIZATION_ADDRESS_TYPE,
} from '../nodeDomSerializers/OrganizationAddressSerializer';
import { configureCustomNodeDomImport } from './NodeUtil';
import { ORGANIZATION_ADDRESS_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

export class OrganizationAddress extends AddressNode {
  __address;

  static getType() {
    return ORGANIZATION_ADDRESS_TYPE;
  }

  static clone(node) {
    return new OrganizationAddress(node.__text, node.__address, node.__key);
  }

  constructor(text, address, key) {
    super(text, address, key);
    this.__address = address;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getContact());
  }

  static importDOM() {
    return configureCustomNodeDomImport(ORGANIZATION_ADDRESS_TYPE, OrganizationAddress.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const address = createOrganizationAddressFromDom(domNode);
    // I consider this acceptable since breaking these out into more files would add more cognitive load than is necessary.
    // eslint-disable-next-line no-use-before-define
    return $createOrganizationAddressFromContact(address);
  }

  static searchText() {
    return ORGANIZATION_ADDRESS_SEARCH_TEXT;
  }

  // options argument is never resolved. Its passed down by some compnents but it probably can be removed.
  static createFromEditor(draft, editorisOpen, options) {
    const address = findDraftOrganizationAddress(draft, options);
    const addressText = orgAddressToText(address);
    const result = editorisOpen ? new OrganizationAddress(ORGANIZATION_ADDRESS_SEARCH_TEXT, address) : new OrganizationAddress(addressText, address);
    $applyCustomNodeConfiguration(result);
    return result;
  }

  // options argument is never resolved. Its passed down by some compnents but it probably can be removed.
  updateFromDraft(draft, options) {
    const self = this.getWritable();
    const address = findDraftOrganizationAddress(draft, options);
    if (!address) {
      self.__text = ORGANIZATION_ADDRESS_SEARCH_TEXT;
      return;
    }
    const serializedTextContact = orgAddressToText(address);
    self.__address = address;
    self.__text = serializedTextContact;
  }

  showVariable() {
    this.setTextContent(ORGANIZATION_ADDRESS_SEARCH_TEXT);
  }

  getAddress() {
    return this.getContact();
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    return { type: ORGANIZATION_ADDRESS_TYPE };
  }
}

export const $createOrganizationAddressFromContact = (address) => {
  const serializedTextContact = orgAddressToText(address);
  const node = new OrganizationAddress(serializedTextContact, address);
  $applyCustomNodeConfiguration(node);
  return $applyNodeReplacement(node);
};
