import React from 'react';
import { DecoratorNode } from 'lexical';

export const SNIPPET_SELECTOR_NODE = 'snippetSelectorNode';

export const HARD_CODED_SNIPPETS = Array.from({ length: 10 }, (_, i) => i + 1).map((number) => ({
  name: `Snippet${number} Group`,
  id: `snippetGroup${number}`,
  snippets: Array.from({ length: 10 }, (_, j) => j + 1).map((number2) => ({
    text: `Snippet ${number2} from group ${number}`,
    id: `s${number2}g${number}`,
  })),
}));

class SnippetSelectorNode extends DecoratorNode {
  __snippetGroupId;

  __onSnippetSelect;

  static clone(node) {
    return new SnippetSelectorNode(node.__onSnippetSelect, node.__snippetGroupId, node.__key);
  }

  static getType() {
    return SNIPPET_SELECTOR_NODE;
  }

  constructor(onSnippetSelect, snippetGroupId, key) {
    super(key);
    this.__snippetGroupId = snippetGroupId;
    this.__onSnippetSelect = onSnippetSelect;
  }

  // eslint-disable-next-line class-methods-use-this
  createDOM() {
    return document.createElement('span');
  }

  decorate() {
    const { snippets } = HARD_CODED_SNIPPETS.find((snippet) => snippet.id === this.getSnippetGroupId());
    return (
      <select
        onChange={(ev) => {
          const snippetId = ev.target.value;
          this.__onSnippetSelect(snippetId, this);
        }}>
        <option value="">Select Snippet</option>
        {snippets.map((snippet) => (
          <option value={snippet.id} key={`snippet-${snippet.id}-option`}>
            {snippet.text}
          </option>
        ))}
      </select>
    );
  }

  getSnippetGroupId() {
    const self = this.getLatest();
    return self.__snippetGroupId;
  }

  // Returning false tells Lexical that this node does not need its
  // DOM element replacing with a new copy from createDOM.
  // eslint-disable-next-line class-methods-use-this
  updateDOM() {
    return false;
  }

  static importJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }

  // eslint-disable-next-line class-methods-use-this
  exportJSON() {
    throw new Error('Not implemented as data is imported/exported using HTML');
  }
}

export default SnippetSelectorNode;
