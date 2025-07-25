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

const exportLexicalHtml = (editor) => {
  if (editor === undefined) return '';
  let html = '';

  const state = editor.getEditorState();

  state.read(() => {
    html = $generateHtmlFromNodes(editor, null);

    // checks to see if any tables have been aligned and returns sterilized html.
    const tableAlignments = [];
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      if (child.getType() === 'table' && child.__alignment) {
        tableAlignments.push(child.__alignment);
      }
    });

    if (tableAlignments.length > 0) {
      let tableIndex = 0;
      html = html.replace(/<table([^>]*)>/g, (match, attributes) => {
        if (tableIndex < tableAlignments.length) {
          const alignment = tableAlignments[tableIndex];
          const newAttributes = `${attributes} data-align="${alignment}" style="justify-self: ${alignment};"`;
          tableIndex++;
          return `<table${newAttributes}>`;
        }
        return match;
      });
    }
  });
  return html;
};

const importLexicalHtml = (editor, value) => {
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

const editorConfig = {
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

export { exportLexicalHtml, importLexicalHtml, editorConfig };
