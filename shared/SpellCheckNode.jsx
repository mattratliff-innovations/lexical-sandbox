import { TextNode } from 'lexical';

export function $createSpellCheckNode(text, suggestions = []) {
  // eslint-disable-next-line no-use-before-define
  return new SpellCheckNode(text, suggestions);
}

export class SpellCheckNode extends TextNode {
  static getType() {
    return 'spell-check';
  }

  static clone(node) {
    return new SpellCheckNode(node.__text, node.__suggestions, node.__key);
  }

  constructor(text, suggestions, key) {
    super(text, key);
    this.__suggestions = suggestions;
  }

  getSuggestions() {
    return this.__suggestions;
  }

  setSuggestions(suggestions) {
    const writable = this.getWritable();
    writable.__suggestions = suggestions;
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.className = 'spell-check-error';
    element.style.textDecoration = 'underline';
    element.style.textDecorationColor = 'red';
    element.style.textDecorationStyle = 'wavy';
    element.style.cursor = 'pointer';

    // Store the node key on the element for modal access
    element.setAttribute('data-lexical-spell-check', this.getKey());

    return element;
  }

  updateDOM(prevNode, dom, config) {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__suggestions !== prevNode.__suggestions) {
      // Update stored node key
      dom.setAttribute('data-lexical-spell-check', this.getKey());
    }
    return updated;
  }

  static importJSON(serializedNode) {
    const { text, suggestions } = serializedNode;
    return $createSpellCheckNode(text, suggestions);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      suggestions: this.__suggestions,
      type: 'spell-check',
      version: 1,
    };
  }

  setTextContent(text) {
    const writable = this.getWritable();
    writable.__text = text;
  }
}
