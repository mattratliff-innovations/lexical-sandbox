/* eslint-disable no-underscore-dangle */

import { ListNode } from '@lexical/list';

export default function applyListNodePatch() {
  if (ListNode.__isPatched) return;

  // =========================================================
  // HELPER: Extract CLEAN list-style-type (strip !important)
  // =========================================================

  ListNode.prototype.getListStyleType = function getListStyleType() {
    const style = this.getStyle();
    if (!style) return null;
    // Extract only the value part, excluding !important
    const match = /list-style-type\s*:\s*([^;!]+)/i.exec(style);
    return match ? match[1].trim() : null; // Returns "lower-alpha", NOT "lower-alpha !important"
  };

  // =========================================================
  // 1. EXPORT: Save CLEAN list-style-type to clipboard (JSON)
  // =========================================================
  const originalExportJSON = ListNode.prototype.exportJSON;
  ListNode.prototype.exportJSON = function exportJSON() {
    const json = originalExportJSON ? originalExportJSON.call(this) : { type: 'list' };
    json.listStyleType = this.getListStyleType();
    return json;
  };

  // =========================================================
  // 2. IMPORT: Restore list-style-type (always ONE !important)
  // =========================================================
  const originalImportJSON = ListNode.importJSON;
  ListNode.importJSON = function importJSON(serializedNode) {
    const node = originalImportJSON ? originalImportJSON.call(ListNode, serializedNode) : new ListNode(serializedNode.listType, serializedNode.start);

    if (serializedNode.listStyleType) {
      // Strip any existing !important, then add exactly ONE
      const cleanStyle = serializedNode.listStyleType.replace(/\s*!important\s*/gi, '').trim();
      node.setStyle(`list-style-type: ${cleanStyle} !important`);
    }
    return node;
  };

  // =========================================================
  // 3. CREATE DOM: Apply type attribute when creating <ol>
  // =========================================================
  const originalCreateDOM = ListNode.prototype.createDOM;
  ListNode.prototype.createDOM = function createDOM(config) {
    const dom = originalCreateDOM.call(this, config);
    const style = this.getListStyleType(); // Already clean

    if (style && dom.tagName === 'OL') {
      const typeMap = {
        'lower-roman': 'i',
        'upper-roman': 'I',
        'lower-alpha': 'a',
        'upper-alpha': 'A',
      };

      const typeAttr = typeMap[style]; // Use clean style directly
      if (typeAttr) {
        dom.setAttribute('type', typeAttr);
      }
      dom.style.setProperty('list-style-type', style, 'important');
    }

    return dom;
  };

  // =========================================================
  // 4. EXTERNAL PASTE: Handle HTML with type attributes
  // =========================================================
  const originalImportDOM = ListNode.importDOM;
  ListNode.importDOM = function importDOM() {
    const importers = typeof originalImportDOM === 'function' ? originalImportDOM() : {};

    return {
      ...importers,
      ol: (_node) => ({
        conversion: (domNode) => {
          const listType = 'number';
          const start = parseInt(domNode.getAttribute('start') || '1', 10);
          const listNode = new ListNode(listType, start);

          const typeAttr = domNode.getAttribute('type');
          let styleToApply = null;

          if (typeAttr === 'I') styleToApply = 'upper-roman';
          else if (typeAttr === 'i') styleToApply = 'lower-roman';
          else if (typeAttr === 'A') styleToApply = 'upper-alpha';
          else if (typeAttr === 'a') styleToApply = 'lower-alpha';

          if (styleToApply) {
            listNode.setStyle(`list-style-type: ${styleToApply} !important`);
          }

          return { node: listNode };
        },
        priority: 2,
      }),
      ul: (_node) => ({
        conversion: (_domNode) => ({ node: new ListNode('bullet', 1) }),
        priority: 1,
      }),
    };
  };

  ListNode.__isPatched = true;
}
