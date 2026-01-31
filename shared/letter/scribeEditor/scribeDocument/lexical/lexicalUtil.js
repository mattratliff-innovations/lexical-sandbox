import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { ListItemNode, ListNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getRoot, $setSelection, TextNode } from 'lexical';

import { EndnoteNode } from './EndnotePlugin';
import { ExtendedTextNode } from './ExtendedTextNode';
import { AddressNode } from './letterEditor/nodes/AddressNode';
import AlienNumberBarcode from './letterEditor/nodes/AlienNumberBarcode';
import ContactsNode from './letterEditor/nodes/ContactsNode';
import DhsSeal from './letterEditor/nodes/DhsSeal';
import LetterDateNode from './letterEditor/nodes/LetterDateNode';
import LetterDetailsNode from './letterEditor/nodes/LetterDetailsNode';
import { OrganizationAddress } from './letterEditor/nodes/OrganizationAddress';
import OrganizationNameNode from './letterEditor/nodes/OrganizationNameNode';
import PageBreakNode from './letterEditor/nodes/PageBreakNode';
import ReceiptNumberBarcode from './letterEditor/nodes/ReceiptNumberBarcode';
import ReceiptNumberNode from './letterEditor/nodes/ReceiptNumberNode';
import SnippetSelectorNode from './letterEditor/nodes/SnippetSelectorNode';
import UserNode from './letterEditor/nodes/UserNode';
import './lexicalTable.css';
import { SpellCheckNode } from './plugins/spellChecker/SpellCheckNode';

// file-private helper (no need to export)
const isSafeUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return true;
  const val = raw.trim();
  if (val.startsWith('#') || /^[./]/.test(val)) return true; // hash/relative
  const m = val.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!m) return true;
  const protocol = `${m[1]}:`.toLowerCase();
  const ALLOWED = new Set(['http:', 'https:', 'mailto:', 'tel:']);
  return ALLOWED.has(protocol);
};

export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const blockedTags = new Set(['script', 'style', 'link', 'iframe', 'object', 'embed', 'meta']);
  doc.querySelectorAll('*').forEach((el) => {
    const t = el.tagName?.toLowerCase();
    if (blockedTags.has(t)) el.remove();
  });

  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if (name === 'href' || name === 'src' || name === 'xlink:href') {
        if (!isSafeUrl(attr.value)) el.removeAttribute(attr.name);
      }
      if (name === 'style') {
        const v = String(attr.value);
        const lower = v.toLowerCase();
        // strip obviously dangerous patterns in inline styles
        if (lower.includes('expression(') || lower.includes('-moz-binding') || /url\(\s*javascript:/i.test(lower)) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body.innerHTML;
};

export const formatHtml = (html) => {
  let formatted = html.replace(/>\s+</g, '><').trim();
  const blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'table', 'tr', 'td', 'th'];
  blockElements.forEach((tag) => {
    formatted = formatted.replace(new RegExp(`<${tag}([^>]*)>`, 'gi'), `\n<${tag}$1>`);
    formatted = formatted.replace(new RegExp(`</${tag}>`, 'gi'), `</${tag}>\n`);
  });
  formatted = formatted.replace(/\n+/g, '\n').trim();
  return formatted
    .split('\n')
    .filter((l) => l.trim())
    .join('\n');
};

export const cleanLexicalHtml = (html) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const cleanElement = (el) => {
    el.removeAttribute('data-lexical-text');
    el.removeAttribute('data-lexical-editor');
    el.removeAttribute('contenteditable');
    el.removeAttribute('role');
    el.removeAttribute('spellcheck');
    el.removeAttribute('aria-label');
    el.removeAttribute('class');
    el.removeAttribute('dir');

    // Preserve ONLY: list-style-type, width, justify-self
    // Remove everything else for security
    const style = el.getAttribute('style');
    if (style) {
      const keep = [];

      // Preserve list-style-type (for ol/ul) - capture everything including !important
      const listStyleMatch = /(?:^|;)\s*list-style-type\s*:\s*([^;]+?)(?:\s*;|$)/i.exec(style);
      if (listStyleMatch && listStyleMatch[1]) {
        keep.push(`list-style-type: ${listStyleMatch[1].trim()}`);
      }

      // Preserve width (for tables)
      const widthMatch = /(?:^|;)\s*width\s*:\s*([^;]+)(?:\s*;|$)/i.exec(style);
      if (widthMatch && widthMatch[1]) {
        keep.push(`width: ${widthMatch[1].trim()}`);
      }

      // Preserve justify-self (for tables)
      const justifyMatch = /(?:^|;)\s*justify-self\s*:\s*([^;]+)(?:\s*;|$)/i.exec(style);
      if (justifyMatch && justifyMatch[1]) {
        keep.push(`justify-self: ${justifyMatch[1].trim()}`);
      }

      // Apply whitelisted styles or remove entirely
      if (keep.length > 0) {
        el.setAttribute('style', keep.join('; '));
      } else {
        el.removeAttribute('style');
      }
    }

    // Preserve type attribute on <ol> elements
    // This is what browsers use for i, I, a, A list styling
    if (el.tagName?.toLowerCase() === 'ol') {
      const typeAttr = el.getAttribute('type');
      // Remove type attribute if it's invalid (not 1, a, A, i, or I)
      if (!typeAttr || !/^[1aAiI]$/.test(typeAttr)) {
        el.removeAttribute('type');
      }
      // If valid, we keep it (no action needed)
    }

    // For non-OL elements, remove type attribute if present
    if (el.tagName?.toLowerCase() !== 'ol' && el.hasAttribute('type')) {
      el.removeAttribute('type');
    }

    Array.from(el.children).forEach(cleanElement);
  };

  Array.from(temp.children).forEach(cleanElement);

  let cleanHtml = temp.innerHTML;
  cleanHtml = cleanHtml.replace(/<span[^>]*>([^<]+)<\/span>/g, '$1');
  return formatHtml(cleanHtml);
};

const getTableAlignments = (editor) => {
  const alignments = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      if (child.getType() === 'table') {
        let alignVal = null;

        // 1. Try to read from DOM (Safe for Staging/Headless)
        try {
          const dom = editor.getElementByKey(child.getKey());
          if (dom && dom.style.justifySelf) {
            alignVal = dom.style.justifySelf;
          }
        } catch (e) {
          // Ignore headless errors
        }

        // 2. Fallback to Node (internal state)
        if (!alignVal) {
          alignVal = child.__alignment; // Accessing internal property as fallback
        }

        alignments.push(alignVal);
      }
    });
  });
  return alignments;
};

const getTableWidths = (editor) => {
  const widths = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      if (child.getType() === 'table') {
        let foundWidth = null;

        // 1. Try DOM
        try {
          const dom = editor.getElementByKey(child.getKey());
          if (dom && dom.style?.width) {
            const widthMatch = /^(\d+(?:\.\d+)?)%$/.exec(dom.style.width);
            if (widthMatch) {
              const pct = parseFloat(widthMatch[1]);
              if (!Number.isNaN(pct)) foundWidth = pct;
            }
          }
        } catch (e) {
          // Ignore headless errors
        }

        // 2. Fallback to Node
        if (foundWidth === null && child.__width) {
          foundWidth = child.__width;
        }

        widths.push(foundWidth);
      }
    });
  });
  return widths;
};

const getTableColumnWidths = (editor) => {
  const columnWidths = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      if (child.getType() === 'table') {
        let foundCols = null;

        // 1. Try DOM
        try {
          const dom = editor.getElementByKey(child.getKey());
          const colsAttr = dom?.getAttribute('data-column-widths');
          if (colsAttr) {
            const arr = colsAttr
              .split(',')
              .map((n) => parseInt(n.trim(), 10))
              .filter((n) => !Number.isNaN(n));
            if (arr.length > 0) foundCols = arr;
          }
        } catch (e) {
          // Ignore headless errors
        }

        // 2. Fallback to Node
        if (foundCols === null && child.__columnWidths) {
          foundCols = child.__columnWidths;
        }

        columnWidths.push(foundCols);
      }
    });
  });
  return columnWidths;
};

const addCustomHtmlStyles = (html, tableAlignments, tableWidths = [], tableColumnWidths = []) => {
  if (tableAlignments.length === 0 && tableWidths.length === 0 && tableColumnWidths.length === 0) return html;

  let tableIndex = 0;
  let columnWidthIndex = 0;

  return html.replace(/<table([^>]*)>/g, (match, attributes) => {
    let styleContent = '';
    let dataAttributes = '';
    let hasChanges = false;

    if (tableIndex < tableAlignments.length) {
      const align = tableAlignments[tableIndex];
      if (align) {
        styleContent += `justify-self: ${align};`;
        hasChanges = true;
      }
    }

    if (tableIndex < tableWidths.length && tableWidths[tableIndex]) {
      styleContent += ` width: ${tableWidths[tableIndex]}%;`;
      hasChanges = true;
    }

    if (columnWidthIndex < tableColumnWidths.length) {
      const colWidths = tableColumnWidths[columnWidthIndex];
      // Check if it is actually an array before joining
      if (colWidths && Array.isArray(colWidths) && colWidths.length > 0) {
        dataAttributes += ` data-column-widths="${colWidths.join(',')}"`;
        hasChanges = true;
      }
      columnWidthIndex++;
    }

    if (hasChanges) {
      const newAttributes = `${attributes} style="${styleContent}" ${dataAttributes}`;
      tableIndex++;
      return `<table${newAttributes}>`;
    }

    tableIndex++;
    return match;
  });
};

// Custom HTML transformer for EndnoteNode
const addEndnoteAttributes = (html) =>
  // This function adds proper attributes to endnote spans for extraction
  html.replace(
    /<span([^>]*class="[^"]*footnote[^"]*"[^>]*)>([^<]*)<sup>\[(\d+)\]<\/sup><\/span>/g,
    (match, attributes, text, id) =>
      // Extract existing attributes and add our custom ones
      `<span${attributes} data-footnote-id="${id}" data-endnote-text="${text.trim()}" data-endnote-value="">${text}<sup>[${id}]</sup></span>`
  );

// Walk the node tree and collect list styles in document order.
const getOrderedListStyles = (editor) => {
  const styles = [];
  editor.getEditorState().read(() => {
    const visit = (node) => {
      if (!node || typeof node.getChildren !== 'function') return;

      if (node.getType && node.getType() === 'list') {
        const listType = node.getListType ? node.getListType() : null;
        if (listType === 'number') {
          const s = typeof node.getStyle === 'function' ? node.getStyle() : '';
          const match = /list-style-type\s*:\s*([^;]+)(!important)?/i.exec(s || '');
          styles.push(match ? match[1].trim() + (match[2] ? ' !important' : '') : null);
        }
      }

      const kids = node.getChildren ? node.getChildren() : [];
      kids.forEach(visit);
    };

    const root = $getRoot();
    visit(root);
  });
  return styles;
};

const addOrderedListHtmlStyles = (html, orderedListStyles) => {
  if (!orderedListStyles.length) return html;

  let idx = 0;
  return html.replace(/<ol([^>]*)>/g, (match, attrs) => {
    const styleVal = orderedListStyles[idx++];
    if (!styleVal) return match;

    const styleAttrMatch = attrs.match(/\sstyle="([^"]*)"/i);
    if (styleAttrMatch) {
      const prev = styleAttrMatch[1];
      const next = prev.replace(/(^|;)\s*list-style-type\s*:\s*[^;]+/i, '').replace(/\s+$/, '');
      const merged = `${next ? `${next}; ` : ''}list-style-type: ${styleVal}`;
      const newAttrs = attrs.replace(styleAttrMatch[0], ` style="${merged}"`);
      return `<ol${newAttrs}>`;
    }
    return `<ol${attrs} style="list-style-type: ${styleVal}">`;
  });
};

const isHeadlessEditor = (editor) => {
  try {
    const rootElement = editor.getRootElement && editor.getRootElement();
    return !rootElement;
  } catch {
    return true;
  }
};

const rehydrateTableAttrsFromDOM = (editor) => {
  // 1. First line of defense for standard headless
  if (isHeadlessEditor(editor)) return;

  editor.update(
    () => {
      const root = $getRoot();

      const visit = (node) => {
        if (node.getType() === 'table') {
          let dom = null;
          try {
            // 2. Staging/Headless Crash Protection
            dom = editor.getElementByKey(node.getKey());
          } catch (e) {
            return;
          }

          if (dom) {
            // --- A. Sync Width (With Tolerance) ---
            const widthCss = dom.style?.width || '';
            const widthMatch = /^(\d+(?:\.\d+)?)%$/.exec(widthCss);

            if (widthMatch) {
              const newPct = parseFloat(widthMatch[1]);
              const currentWidth = node.getWidth ? node.getWidth() : node.__width;

              // 3. Infinite Loop Protection (Tolerance)
              // Only update if the difference is greater than 0.1
              const isDifferent = currentWidth === undefined || Math.abs(currentWidth - newPct) > 0.1;

              if (isDifferent && !Number.isNaN(newPct)) {
                const writable = node.getWritable();
                writable.__width = newPct;
              }
            }

            // --- B. Sync Alignment ---
            const alignCss = dom.style?.justifySelf || '';
            const currentAlign = node.getAlignment ? node.getAlignment() : node.__alignment;

            if (alignCss && currentAlign !== alignCss) {
              const writable = node.getWritable();
              writable.__alignment = alignCss;
            }

            // --- C. Sync Column Widths ---
            const colsAttr = dom.getAttribute('data-column-widths');
            if (colsAttr) {
              const newCols = colsAttr
                .split(',')
                .map((n) => parseInt(n.trim(), 10))
                .filter((n) => !Number.isNaN(n));

              const currentCols = node.getColumnWidths ? node.getColumnWidths() : node.__columnWidths;

              const isColsDifferent = !currentCols || newCols.length !== currentCols.length || newCols.some((val, i) => val !== currentCols[i]);

              if (isColsDifferent) {
                const writable = node.getWritable();
                writable.__columnWidths = newCols;
              }
            }
          }
        }

        const kids = node.getChildren ? node.getChildren() : [];
        kids.forEach(visit);
      };

      visit(root);
    },
    { discrete: true }
  );
};

export const exportLexicalHtml = (editor) => {
  if (editor === undefined) return '';
  let html = '';

  // 1. Sync DOM -> Node (Required for correct Printing)
  editor.update(
    () => {
      rehydrateTableAttrsFromDOM(editor);
    },
    { discrete: true }
  );

  // 2. Generate Basic HTML from Nodes
  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor, null);
  });

  // 3. Capture Styles (Helpers are safe now with try/catch)
  const orderedListStyles = getOrderedListStyles(editor);
  const tableAlignments = getTableAlignments(editor);
  const tableWidths = getTableWidths(editor);
  const tableColumnWidths = getTableColumnWidths(editor);

  // 4. Inject Styles into HTML
  html = addCustomHtmlStyles(html, tableAlignments, tableWidths, tableColumnWidths);
  html = addOrderedListHtmlStyles(html, orderedListStyles);
  html = addEndnoteAttributes(html);

  return html;
};

export const importLexicalHtml = (editor, value) => {
  const safe = sanitizeHtml(value);

  const typeAttrToCss = (t) => {
    switch (t) {
      case 'i':
        return 'lower-roman';
      case 'I':
        return 'upper-roman';
      case 'a':
        return 'lower-alpha';
      case 'A':
        return 'upper-alpha';
      default:
        return null;
    }
  };

  const parser = new DOMParser();
  const dom = parser.parseFromString(safe, 'text/html');

  const olStyles = [];
  dom.querySelectorAll('ol').forEach((ol) => {
    let css = null;
    const style = ol.getAttribute('style') || '';
    const m = /(^|;)\s*list-style-type\s*:\s*([^;!\s]+)/i.exec(style);
    if (m && m[2]) css = m[2].trim();

    if (!css) {
      const t = ol.getAttribute('type');
      if (t) css = typeAttrToCss(t);
    }
    olStyles.push(css || null);
  });

  editor.update(
    () => {
      const root = $getRoot();
      const nodes = $generateNodesFromDOM(editor, dom);
      root.clear();
      root.append(...nodes);
      $setSelection(null);

      let idx = 0;
      const visit = (node) => {
        if (!node || typeof node.getChildren !== 'function') return;

        if (node.getType && node.getType() === 'list' && node.getListType && node.getListType() === 'number') {
          if (idx >= olStyles.length) return;
          const styleVal = olStyles[idx++] || null;
          node.setStyle(styleVal ? `list-style-type: ${styleVal} !important` : '');
        }

        const kids = node.getChildren ? node.getChildren() : [];
        kids.forEach(visit);
      };

      visit(root);
    },
    { discrete: true }
  );

  setTimeout(() => {
    editor.getEditorState().read(() => {
      const typeMap = {
        'lower-roman': 'i',
        'upper-roman': 'I',
        'lower-alpha': 'a',
        'upper-alpha': 'A',
      };

      let idx = 0;
      const visit = (node) => {
        if (!node || typeof node.getChildren !== 'function') return;

        if (node.getType && node.getType() === 'list' && node.getListType && node.getListType() === 'number') {
          if (idx >= olStyles.length) return;
          const styleVal = olStyles[idx++];
          if (!isHeadlessEditor(editor)) {
            const elem = editor.getElementByKey(node.getKey());
            if (elem && elem.tagName === 'OL') {
              if (styleVal) {
                const typeAttr = typeMap[styleVal];
                if (typeAttr) {
                  elem.setAttribute('type', typeAttr);
                } else {
                  elem.removeAttribute('type');
                }
                elem.style.setProperty('list-style-type', styleVal, 'important');
              } else {
                elem.removeAttribute('type');
                elem.style.removeProperty('list-style-type');
              }
            }
          }
        }

        const kids = node.getChildren ? node.getChildren() : [];
        kids.forEach(visit);
      };

      const root = $getRoot();
      visit(root);
    });
  }, 0);
};

const LexicalTheme = {
  code: 'editor-code',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  image: 'editor-image',
  link: 'editor-link',
  list: {
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
  },
  ltr: 'ltr',
  placeholder: 'editor-placeholder',
  quote: 'editor-quote',
  rtl: 'rtl',
  table: 'scribe_lexical_table',
  tableCell: 'scribe_lexical_tableCell',
  tableCellActionButton: 'scribe_lexical_tableCellActionButton',
  tableCellActionButtonContainer: 'scribe_lexical_tableCellActionButtonContainer',
  tableCellEditing: 'scribe_lexical_tableCellEditing',
  tableCellHeader: 'scribe_lexical_tableCellHeader',
  tableCellPrimarySelected: 'scribe_lexical_tableCellPrimarySelected',
  tableCellResizer: 'scribe_lexical_tableCellResizer',
  tableCellSelected: 'scribe_lexical_tableCellSelected',
  tableCellSortedIndicator: 'scribe_lexical_tableCellSortedIndicator',
  tableResizeRuler: 'scribe_lexical_tableCellResizeRuler',
  tableRowStriping: 'scribe_lexical_tableRowStriping',
  tableScrollableWrapper: 'scribe_lexical_tableScrollableWrapper',
  tableSelected: 'scribe_lexical_tableSelected',
  tableSelection: 'scribe_lexical_tableSelection',
  text: {
    bold: 'editor-text-bold',
    code: 'editor-text-code',
    hashtag: 'editor-text-hashtag',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    strikethrough: 'editor-text-strikethrough',
    underline: 'editor-text-underline',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
  },
};

export const editorConfig = {
  namespace: 'Scribe',
  nodes: [
    HeadingNode,
    ListItemNode,
    ExtendedTextNode,
    ReceiptNumberNode,
    AddressNode,
    AlienNumberBarcode,
    ReceiptNumberBarcode,
    SnippetSelectorNode,
    DhsSeal,
    OrganizationAddress,
    OrganizationNameNode,
    PageBreakNode,
    LetterDateNode,
    ListNode,
    {
      replace: TextNode,
      withKlass: ExtendedTextNode,
      with: (node) => new ExtendedTextNode(node.__text),
    },
    TableCellNode,
    TableNode,
    TableRowNode,
    EndnoteNode,
    SpellCheckNode,
    ContactsNode,
    LetterDetailsNode,
    HorizontalRuleNode,
    UserNode,
  ],
  onError(error) {
    throw error;
  },
  theme: LexicalTheme,
};
