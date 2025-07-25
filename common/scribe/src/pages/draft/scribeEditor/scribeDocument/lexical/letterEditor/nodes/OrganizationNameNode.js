import { $applyNodeReplacement } from 'lexical';
import { ExtendedTextNode, $applyCustomNodeConfiguration } from '../../ExtendedTextNode';
import { serializeToHtml, ORGANIZATION_NAME_TYPE, createOrganizationNameDataFromDom } from '../nodeDomSerializers/OrganizationNameSerializer';
import { ORGANIZATION_NAME_SEARCH_TEXT } from '../../../ScribeDocumentConstants';
import { configureCustomNodeDomImport } from './NodeUtil';

class OrganizationNameNode extends ExtendedTextNode {
  __organizationName;

  static getType() {
    return ORGANIZATION_NAME_TYPE;
  }

  static clone(node) {
    return new OrganizationNameNode(node.__text, node.__organizationName, node.__key);
  }

  constructor(text, organizationName, key) {
    super(text, key);
    this.__organizationName = organizationName;
  }

  setHtmlForExport(span) {
    serializeToHtml(span, this.getOrganizationName());
  }

  updateFromDraft(draft) {
    const self = this.getWritable();
    self.__organizationName = draft.organization?.name;
    self.__text = self.__organizationName;
  }

  showVariable() {
    this.setTextContent(ORGANIZATION_NAME_SEARCH_TEXT);
  }

  static importDOM() {
    return configureCustomNodeDomImport(ORGANIZATION_NAME_TYPE, OrganizationNameNode.createNodeFromDom);
  }

  static createNodeFromDom(domNode) {
    const organizationName = createOrganizationNameDataFromDom(domNode);
    const node = new OrganizationNameNode(organizationName, organizationName);
    $applyCustomNodeConfiguration(node);
    return $applyNodeReplacement(node);
  }

  static searchText() {
    return ORGANIZATION_NAME_SEARCH_TEXT;
  }

  static createFromEditor(draft, editorisOpen) {
    const organizationName = draft.organization?.name;
    const result = editorisOpen
      ? new OrganizationNameNode(ORGANIZATION_NAME_SEARCH_TEXT, organizationName)
      : new OrganizationNameNode(organizationName, organizationName);
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

  getOrganizationName() {
    const self = this.getLatest();
    return self.__organizationName;
  }
}

export default OrganizationNameNode;
