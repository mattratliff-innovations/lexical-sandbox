import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $setSelection, TextNode } from 'lexical';
import { ListItemNode, ListNode } from '@lexical/list';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import ReceiptNumberNode from './letterEditor/nodes/ReceiptNumberNode';
import { AddressNode } from './letterEditor/nodes/AddressNode';
import AlienNumberBarcode from './letterEditor/nodes/AlienNumberBarcode';
import ReceiptNumberBarcode from './letterEditor/nodes/ReceiptNumberBarcode';
import DhsSeal from './letterEditor/nodes/DhsSeal';
import { OrganizationAddress } from './letterEditor/nodes/OrganizationAddress';
import OrganizationNameNode from './letterEditor/nodes/OrganizationNameNode';
import { ExtendedTextNode } from './ExtendedTextNode';
import SnippetSelectorNode from './letterEditor/nodes/SnippetSelectorNode';
import LetterDateNode from './letterEditor/nodes/LetterDateNode';
import './lexicalTable.css';
import AlienNumberNode from './letterEditor/nodes/AlienNumberNode';
import { EndnoteNode } from './EndnotePlugin';

const getTableAlignments = (editor) => {
  const alignments = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      if (child.getType() === 'table' && child.__alignment) alignments.push(child.__alignment);
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
        if (child.__width) widths.push(child.__width);
        else widths.push(null);
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
        if (child.__columnWidths) columnWidths.push(child.__columnWidths);
      }
    });
  });
  return columnWidths;
};

const addCustomHtmlStyles = (html, tableAlignments, tableWidths = [], tableColumnWidths = []) => {
  if (tableAlignments.length === 0 && tableWidths.length === 0) return html;

  let tableIndex = 0;
  let columnWidthIndex = 0;

  return html.replace(/<table([^>]*)>/g, (match, attributes) => {
    let styleContent = '';
    let dataAttributes = '';
    let hasChanges = false;

    if (tableIndex < tableAlignments.length) {
      styleContent += `justify-self: ${tableAlignments[tableIndex]};`;
      hasChanges = true;
    }

    if (tableIndex < tableWidths.length && tableWidths[tableIndex]) {
      styleContent += ` width: ${tableWidths[tableIndex]}%;`;
      hasChanges = true;
    }

    if (columnWidthIndex < tableColumnWidths.length) {
      dataAttributes += ` data-column-widths="${tableColumnWidths[columnWidthIndex].join(',')}"`;
      columnWidthIndex++;
      hasChanges = true;
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
const addEndnoteAttributes = (html) => {
  // This function adds proper attributes to endnote spans for extraction
  return html.replace(/<span([^>]*class="[^"]*footnote[^"]*"[^>]*)>([^<]*)<sup>\[(\d+)\]<\/sup><\/span>/g, (match, attributes, text, id) => {
    // Extract existing attributes and add our custom ones
    return `<span${attributes} data-footnote-id="${id}" data-endnote-text="${text.trim()}" data-endnote-value="">${text}<sup>[${id}]</sup></span>`;
  });
};

const preserveEndnoteData = (html, editor) => {
  if (!editor) return html;
  
  // Get endnote data from the editor state
  let endnoteData = {};
  
  try {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      
      const collectEndnotes = (node) => {
        if (node.getType && node.getType() === 'footnote') {
          endnoteData[node.__footnoteId] = {
            text: node.getTextContent(),
            value: node.__endnoteValue || '',
            ref: node.__endnoteRef || `endnote-ref-${node.__footnoteId}`
          };
        }
        
        if (node.getChildren) {
          node.getChildren().forEach(collectEndnotes);
        }
      };
      
      root.getChildren().forEach(collectEndnotes);
    });
  } catch (e) {
    console.warn('Could not collect endnote data from editor:', e);
  }
  
  // Add data attributes to endnote spans in HTML
  return html.replace(
    /<span([^>]*?)>([^<]*?)<sup>\[(\d+)\]<\/sup><\/span>/g,
    (match, attributes, text, id) => {
      const data = endnoteData[id];
      if (data) {
        return `<span${attributes} data-endnote-id="${id}" data-endnote-text="${text}" data-endnote-value="${data.value}">${text}<sup>[${id}]</sup></span>`;
      }
      return match;
    }
  );
};


export const exportLexicalHtml = (editor) => {
  if (editor === undefined) return '';
  let html = '';

  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor, null);
  });

  const tableAlignments = getTableAlignments(editor);
  const tableWidths = getTableWidths(editor);
  const tableColumnWidths = getTableColumnWidths(editor);

  // Apply table styles
  html = addCustomHtmlStyles(html, tableAlignments, tableWidths, tableColumnWidths);

  // Preserve endnote data in HTML
  html = preserveEndnoteData(html, editor);

  return html;
};


export const importLexicalHtml = (editor, value) => {
  editor.update(
    () => {
      const root = $getRoot();
      const parser = new DOMParser();
      const dom = parser.parseFromString(value, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      root.clear();
      root.append(...nodes);
      $setSelection(null);
    },
    { discrete: true }
  );
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
    LetterDateNode,
    AlienNumberNode,
    { replace: TextNode, with: (node) => new ExtendedTextNode(node.__text) },
    ListNode,
    TableCellNode,
    TableNode,
    TableRowNode,
    EndnoteNode,
  ],
  // Handling of errors during update
  onError(error) {
    throw error;
  },
  theme: LexicalTheme,
};
