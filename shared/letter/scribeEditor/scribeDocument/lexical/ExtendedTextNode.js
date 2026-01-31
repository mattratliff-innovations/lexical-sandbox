import { $isTextNode, TextNode } from 'lexical';

const isWhiteOrTransparent = (color) => {
  if (!color) return true;

  const normalized = color.toLowerCase().replace(/\s/g, '');

  // Common white/transparent formats
  if (
    normalized === 'white' ||
    normalized === 'transparent' ||
    normalized === '#fff' ||
    normalized === '#ffffff' ||
    normalized === 'rgba(0,0,0,0)' ||
    normalized === 'rgba(255,255,255,0)'
  ) {
    return true;
  }

  // Check rgb/rgba for near-white (all channels > 250 and alpha > 0.9)
  const rgbMatch = normalized.match(/rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)/);
  if (rgbMatch) {
    const [, r, g, b, a] = rgbMatch;
    const isWhite = parseInt(r, 10) > 250 && parseInt(g, 10) > 250 && parseInt(b, 10) > 250;
    const isOpaque = a === undefined || parseFloat(a) > 0.1; // Keep if alpha > 0.1
    return isWhite || !isOpaque;
  }

  return false;
};

const patchNodeAndStyleConversion = (originalDOMConverter) => (domNode) => {
  const original = originalDOMConverter?.(domNode);
  if (!original) {
    return null;
  }
  const originalOutput = original.conversion(domNode);
  if (!originalOutput) {
    return originalOutput;
  }

  // Extract inline styles
  const { backgroundColor } = domNode.style;
  const { fontWeight } = domNode.style;
  const { textDecoration } = domNode.style;

  return {
    ...originalOutput,
    forChild: (lexicalNode, parent) => {
      const originalForChild = originalOutput?.forChild ?? ((x) => x);
      const result = originalForChild(lexicalNode, parent);

      if ($isTextNode(result)) {
        const stylesToApply = [];

        if (fontWeight && parseInt(fontWeight, 10) >= 700) {
          stylesToApply.push(`font-weight: ${fontWeight}`);
        }

        if (backgroundColor && !isWhiteOrTransparent(backgroundColor)) {
          stylesToApply.push(`background-color: yellow`);
        }

        if (textDecoration) {
          stylesToApply.push(`text-decoration: ${textDecoration}`);
        }

        const style = stylesToApply.join('; ');
        if (style.length) {
          return result.setStyle(style);
        }
      }
      return result;
    },
  };
};

export class ExtendedTextNode extends TextNode {
  static getType() {
    return 'extended-text';
  }

  static clone(node) {
    // eslint-disable-next-line no-underscore-dangle
    return new ExtendedTextNode(node.__text, node.__key);
  }

  static importDOM() {
    const importers = TextNode.importDOM();
    return {
      ...importers,
      code: () => ({
        conversion: patchNodeAndStyleConversion(importers?.code),
        priority: 1,
      }),
      em: () => ({
        conversion: patchNodeAndStyleConversion(importers?.em),
        priority: 1,
      }),
      // Strip <mark> tags completely - just extract plain text without highlighting
      mark: () => ({
        conversion: () => ({
          node: null, // Don't create special node
          forChild: (lexicalNode) =>
            // Just return the text without any styling (strips mark highlighting)
            lexicalNode,
        }),
        priority: 1,
      }),
      span: () => ({
        conversion: patchNodeAndStyleConversion(importers?.span),
        priority: 1,
      }),
      strong: () => ({
        conversion: patchNodeAndStyleConversion(importers?.strong),
        priority: 1,
      }),
      sub: () => ({
        conversion: patchNodeAndStyleConversion(importers?.sub),
        priority: 1,
      }),
      sup: () => ({
        conversion: patchNodeAndStyleConversion(importers?.sup),
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode) {
    return TextNode.importJSON(serializedNode);
  }

  isSimpleText() {
    // eslint-disable-next-line no-underscore-dangle
    return (this.__type === 'text' || this.__type === 'extended-text') && this.__mode === 0;
  }

  static getDeepestNode(dom) {
    const nodes = Array.prototype.slice.call(dom.getElementsByTagName('*'));
    if (nodes.length === 0) {
      return dom;
    }
    const leafNodes = nodes.filter((elem) => {
      if (elem.hasChildNodes()) {
        for (let i = 0; i < elem.childNodes.length; i += 1) {
          if (elem.childNodes[i].nodeType === Node.ELEMENT_NODE) {
            return false;
          }
        }
      }
      return true;
    });
    return leafNodes[0];
  }

  exportDOM(editor) {
    const exportDOMResult = super.exportDOM(editor);
    if (this.isSimpleText()) return exportDOMResult;

    const spanNode = ExtendedTextNode.getDeepestNode(exportDOMResult.element);
    this.setHtmlForExport(spanNode);
    return { ...exportDOMResult };
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'extended-text',
      version: 1,
    };
  }
}

export function $createExtendedTextNode(text) {
  return new ExtendedTextNode(text);
}

export function $isExtendedTextNode(node) {
  return node instanceof ExtendedTextNode;
}

export function $applyCustomNodeConfiguration(node) {
  node.setMode('token');
  node.toggleUnmergeable();
}
