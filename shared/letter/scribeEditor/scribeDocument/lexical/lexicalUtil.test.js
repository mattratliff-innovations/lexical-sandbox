// lexicalUtil.test.js

import { cleanLexicalHtml, exportLexicalHtml, formatHtml, importLexicalHtml, sanitizeHtml } from './lexicalUtil';

jest.mock('@lexical/list', () => ({
  ListItemNode() {},
  ListNode() {},
}));
jest.mock('@lexical/react/LexicalHorizontalRuleNode', () => ({
  HorizontalRuleNode() {},
}));
jest.mock('@lexical/rich-text', () => ({
  HeadingNode() {},
}));
jest.mock('@lexical/table', () => ({
  TableCellNode() {},
  TableNode() {},
  TableRowNode() {},
}));
jest.mock('./EndnotePlugin', () => ({
  EndnoteNode() {},
}));
jest.mock('./ExtendedTextNode', () => ({
  ExtendedTextNode() {},
}));
jest.mock('./letterEditor/nodes/AddressNode', () => function () {});
jest.mock('./letterEditor/nodes/AlienNumberBarcode', () => function () {});
jest.mock('./letterEditor/nodes/ContactsNode', () => function () {});
jest.mock('./letterEditor/nodes/DhsSeal', () => function () {});
jest.mock('./letterEditor/nodes/LetterDateNode', () => function () {});
jest.mock('./letterEditor/nodes/LetterDetailsNode', () => function () {});
jest.mock('./letterEditor/nodes/OrganizationAddress', () => ({
  OrganizationAddress() {},
}));
jest.mock('./letterEditor/nodes/OrganizationNameNode', () => function () {});
jest.mock('./letterEditor/nodes/PageBreakNode', () => function () {});
jest.mock('./letterEditor/nodes/ReceiptNumberBarcode', () => function () {});
jest.mock('./letterEditor/nodes/ReceiptNumberNode', () => function () {});
jest.mock('./letterEditor/nodes/SnippetSelectorNode', () => function () {});
jest.mock('./letterEditor/nodes/UserNode', () => function () {});
jest.mock('./plugins/spellChecker/SpellCheckNode', () => ({
  SpellCheckNode() {},
}));

jest.mock('@lexical/html', () => ({
  $generateHtmlFromNodes: jest.fn(() => '<p>Generated HTML</p>'),
  $generateNodesFromDOM: jest.fn(() => [{ mockNode: true }]),
}));

jest.mock('lexical', () => {
  // We'll need to return a root node with children that can be traversed
  const mockListNode = {
    getType: () => 'list',
    getListType: () => 'number',
    setStyle: jest.fn(),
    getChildren: () => [],
    getKey: () => 'mock-ol-key',
  };
  const mockRoot = {
    clear: jest.fn(),
    append: jest.fn(),
    getChildren: () => [mockListNode],
  };
  return {
    $getRoot: jest.fn(() => mockRoot),
    $setSelection: jest.fn(),
  };
});

// Editor mock
const mockElement = {
  tagName: 'OL',
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  style: {
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  },
};

const mockEditorState = {
  read: jest.fn((fn) => fn()),
};

const mockEditor = {
  getEditorState: jest.fn(() => mockEditorState),
  update: jest.fn((fn) => fn()),
  getElementByKey: jest.fn(() => mockElement),
};

describe('exportLexicalHtml', () => {
  it('returns generated HTML from nodes', () => {
    const html = exportLexicalHtml(mockEditor);
    expect(html).toContain('<p>Generated HTML</p>');
  });

  it('returns empty string if editor is undefined', () => {
    expect(exportLexicalHtml(undefined)).toBe('');
  });

  it('calls editor.update and getEditorState', () => {
    exportLexicalHtml(mockEditor);
    expect(mockEditor.update).toHaveBeenCalled();
    expect(mockEditor.getEditorState).toHaveBeenCalled();
  });
});

describe('importLexicalHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles empty input gracefully', () => {
    importLexicalHtml(mockEditor, '');
    expect(mockEditor.update).toHaveBeenCalled();
  });
});

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = '<div>Hello<script>alert("x")</script>World</div>';
    expect(sanitizeHtml(input)).toBe('<div>HelloWorld</div>');
  });

  it('removes style tags', () => {
    const input = '<style>body{color:red;}</style><p>Text</p>';
    expect(sanitizeHtml(input)).toBe('<p>Text</p>');
  });

  it('removes event handler attributes', () => {
    const input = '<a href="#" onclick="evil()">Click</a>';
    expect(sanitizeHtml(input)).toBe('<a href="#">Click</a>');
  });

  it('removes unsafe hrefs', () => {
    const input = '<a href="javascript:alert(1)">Bad Link</a>';
    expect(sanitizeHtml(input)).toBe('<a>Bad Link</a>');
  });

  it('removes unsafe inline styles', () => {
    const input = '<div style="width:100px;expression(alert(1));">Test</div>';
    expect(sanitizeHtml(input)).toBe('<div>Test</div>');
  });

  it('preserves safe mailto links', () => {
    const input = '<a href="mailto:test@example.com">Email</a>';
    expect(sanitizeHtml(input)).toBe('<a href="mailto:test@example.com">Email</a>');
  });
});

describe('formatHtml', () => {
  it('formats block elements with newlines', () => {
    const input = '<div><p>One</p><p>Two</p></div>';
    const output = formatHtml(input);
    expect(output).toBe('<div>\n<p>One</p>\n<p>Two</p>\n</div>');
  });

  it('removes excess whitespace between tags', () => {
    const input = '<div>   <p>Text</p>   </div>';
    const output = formatHtml(input);
    expect(output).toBe('<div>\n<p>Text</p>\n</div>');
  });

  it('handles nested block elements', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const output = formatHtml(input);
    expect(output).toBe('<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>');
  });
});

describe('cleanLexicalHtml', () => {
  it('removes lexical attributes and class', () => {
    const input = '<div data-lexical-text="true" class="foo" dir="ltr" style="width:100px;list-style-type:disc;">Text</div>';
    const output = cleanLexicalHtml(input);
    // Only width and list-style-type should remain in style
    expect(output).toContain('style="list-style-type: disc; width: 100px"');
    expect(output).not.toContain('data-lexical-text');
    expect(output).not.toContain('class="foo"');
    expect(output).not.toContain('dir="ltr"');
  });

  it('removes type attribute from non-ol elements', () => {
    const input = '<ul type="a"><li>Item</li></ul>';
    const output = cleanLexicalHtml(input);
    expect(output).not.toContain('type="a"');
  });

  it('preserves valid type attribute on ol', () => {
    const input = '<ol type="A"><li>Item</li></ol>';
    const output = cleanLexicalHtml(input);
    expect(output).toContain('type="A"');
  });

  it('removes invalid type attribute on ol', () => {
    const input = '<ol type="foo"><li>Item</li></ol>';
    const output = cleanLexicalHtml(input);
    expect(output).not.toContain('type="foo"');
  });

  it('unwraps span tags', () => {
    const input = '<span>Text</span>';
    const output = cleanLexicalHtml(input);
    expect(output).toBe('Text');
  });
});
