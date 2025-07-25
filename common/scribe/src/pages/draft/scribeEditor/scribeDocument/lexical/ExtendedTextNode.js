import { $isTextNode, TextNode } from 'lexical';

const patchNodeAndStyleConversion = (originalDOMConverter) => (domNode) => {
  const original = originalDOMConverter?.(domNode);
  if (!original) {
    return null;
  }
  const originalOutput = original.conversion(domNode);

  if (!originalOutput) {
    return originalOutput;
  }

  const { backgroundColor } = domNode.style;
  const { color } = domNode.style;
  const { fontFamily } = domNode.style;
  const { fontWeight } = domNode.style;
  const { fontSize } = domNode.style;
  const { textDecoration } = domNode.style;

  return {
    ...originalOutput,
    forChild: (lexicalNode, parent) => {
      const originalForChild = originalOutput?.forChild ?? ((x) => x);
      const result = originalForChild(lexicalNode, parent);
      if ($isTextNode(result)) {
        const style = [
          backgroundColor ? `background-color: ${backgroundColor}` : null,
          color ? `color: ${color}` : null,
          fontFamily ? `font-family: ${fontFamily}` : null,
          fontWeight ? `font-weight: ${fontWeight}` : null,
          fontSize ? `font-size: ${fontSize}` : null,
          textDecoration ? `text-decoration: ${textDecoration}` : null,
        ]
          .filter((value) => value != null)
          .join('; ');
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
    return (this.__type === 'text' || this.__type === 'extended-text') && this.__mode === 0;
  }

  static getDeepestNode(dom) {
    const nodes = Array.prototype.slice.call(dom.getElementsByTagName('*'));
    if (nodes.length === 0) {
      return dom;
    }
    const leafNodes = nodes.filter((elem) => {
      if (elem.hasChildNodes()) {
        // see if any of the child nodes are elements
        for (let i = 0; i < elem.childNodes.length; i += 1) {
          if (elem.childNodes[i].nodeType === Node.ELEMENT_NODE) {
            // there is a child element, so return false to not include
            // this parent element
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
