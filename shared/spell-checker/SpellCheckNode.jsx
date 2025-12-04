import { $createTextNode, TextNode } from 'lexical';

export function $createSpellCheckNode(text, suggestions = [], issueType = 'grammar') {
  // eslint-disable-next-line no-use-before-define
  return new SpellCheckNode(text, suggestions, issueType);
}

export class SpellCheckNode extends TextNode {
  static getType() {
    return 'spell-check';
  }

  static clone(node) {
    return new SpellCheckNode(node.__text, node.__suggestions, node.__issueType, node.__key);
  }

  constructor(text, suggestions, issueType, key) {
    super(text, key);
    this.__suggestions = suggestions;
    this.__issueType = issueType; // Store issueType
  }

  getSuggestions() {
    return this.__suggestions;
  }

  setSuggestions(suggestions) {
    const writable = this.getWritable();
    writable.__suggestions = suggestions;
  }

  getIssueType() {
    return this.__issueType;
  }

  setIssueType(issueType) {
    const writable = this.getWritable();
    writable.__issueType = issueType;
  }

  createDOM(config) {
    const element = super.createDOM(config);

    // Apply styles based on issueType
    element.className = 'spell-check-error';

    // Add specific class based on issueType
    switch (this.__issueType) {
      case 'misspelling':
        element.classList.add('spelling');
        break;
      case 'grammar':
      default:
        element.classList.add('grammar');
        break;
    }

    // Store the node key on the element for modal access
    element.setAttribute('data-lexical-spell-check', this.getKey());

    return element;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);

    // Update styles if issueType changes
    if (this.__issueType !== prevNode.__issueType) {
      dom.className = 'spell-check-error'; // Reset base class
      switch (this.__issueType) {
        case 'grammar':
          dom.classList.add('grammar');
          break;
        case 'misspelling':
        default:
          dom.classList.add('spelling');
          break;
      }
    }

    // Update stored node key
    if (this.__suggestions !== prevNode.__suggestions) {
      dom.setAttribute('data-lexical-spell-check', this.getKey());
    }

    return updated;
  }

  static importJSON(serializedNode) {
    const { text, suggestions, issueType } = serializedNode;
    return $createSpellCheckNode(text, suggestions, issueType);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      suggestions: this.__suggestions,
      issueType: this.__issueType, // Include issueType in export
      type: 'spell-check',
      version: 1,
    };
  }

  setTextContent(text) {
    const writable = this.getWritable();
    writable.__text = text;
  }

  replaceWithSuggestion(text) {
    const textNode = $createTextNode(text);
    this.replace(textNode);
    return textNode;
  }
}

export function $isSpellCheckNode(node) {
  return node instanceof SpellCheckNode;
}
