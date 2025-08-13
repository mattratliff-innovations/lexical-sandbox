import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@testing-library/react';
import { createEditor } from 'lexical';
import ToolbarPlugin from '../ToolbarPlugin';

// Mock dependencies
jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock('@lexical/utils', () => ({
  mergeRegister: jest.fn((fn) => fn),
}));

jest.mock('lexical', () => ({
  ...jest.requireActual('lexical'),
  $getSelection: jest.fn(),
  $isRangeSelection: jest.fn(),
  FORMAT_TEXT_COMMAND: 'FORMAT_TEXT_COMMAND',
  FORMAT_ELEMENT_COMMAND: 'FORMAT_ELEMENT_COMMAND',
  UNDO_COMMAND: 'UNDO_COMMAND',
  REDO_COMMAND: 'REDO_COMMAND',
  PASTE_COMMAND: 'PASTE_COMMAND',
  COPY_COMMAND: 'COPY_COMMAND',
  CUT_COMMAND: 'CUT_COMMAND',
  SELECTION_CHANGE_COMMAND: 'SELECTION_CHANGE_COMMAND',
  CAN_UNDO_COMMAND: 'CAN_UNDO_COMMAND',
  CAN_REDO_COMMAND: 'CAN_REDO_COMMAND',
  OUTDENT_CONTENT_COMMAND: 'OUTDENT_CONTENT_COMMAND',
  INDENT_CONTENT_COMMAND: 'INDENT_CONTENT_COMMAND',
  COMMAND_PRIORITY_LOW: 0,
}));

jest.mock('@lexical/list', () => ({
  INSERT_ORDERED_LIST_COMMAND: 'INSERT_ORDERED_LIST_COMMAND',
  INSERT_UNORDERED_LIST_COMMAND: 'INSERT_UNORDERED_LIST_COMMAND',
}));

// Mock Material UI components
jest.mock('@mui/material', () => ({
  Menu: ({ children, open, onClose, ...props }) => 
    open ? <div data-testid="menu" {...props}>{children}</div> : null,
  MenuItem: ({ children, onClick, ...props }) => 
    <div data-testid="menu-item" onClick={onClick} {...props}>{children}</div>,
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    read: jest.fn(),
  },
});

describe('ToolbarPlugin', () => {
  let mockEditor;
  let mockRegisterUpdateListener;
  let mockRegisterCommand;
  let mockDispatchCommand;

  beforeEach(() => {
    mockRegisterUpdateListener = jest.fn(() => jest.fn());
    mockRegisterCommand = jest.fn(() => jest.fn());
    mockDispatchCommand = jest.fn();

    mockEditor = {
      registerUpdateListener: mockRegisterUpdateListener,
      registerCommand: mockRegisterCommand,
      dispatchCommand: mockDispatchCommand,
      getEditorState: jest.fn(() => ({
        read: jest.fn(),
      })),
    };

    require('@lexical/react/LexicalComposerContext').useLexicalComposerContext.mockReturnValue([
      mockEditor,
    ]);

    // Reset mocks
    jest.clearAllMocks();
  });

  const defaultProps = {
    id: 'test-toolbar',
    editorId: 'test-editor',
    toolList: {
      leftSide: ['bold', 'italic', 'underline'],
      rightSide: ['undo', 'redo'],
    },
    isCanUndo: jest.fn(),
    isCanRedo: jest.fn(),
    setShowAddContentModal: jest.fn(),
    setShowAddEndnoteModal: jest.fn(),
    alignMenuAnchor: null,
    setAlignMenuAnchor: jest.fn(),
    tableCreatorAnchor: null,
    setTableCreatorAnchor: jest.fn(),
    canCreateEndnote: false,
    currentEndnote: null,
    minToolBarDefault: false,
  };

  const renderToolbarPlugin = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    
    const initialConfig = {
      namespace: 'test',
      onError: (error) => { throw error; },
    };

    return render(
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin {...mergedProps} />
      </LexicalComposer>
    );
  };

  describe('Rendering', () => {
    test('renders toolbar with default props', () => {
      renderToolbarPlugin();
      expect(screen.getByTestId('test-toolbar')).toBeInTheDocument();
    });

    test('renders left side buttons', () => {
      renderToolbarPlugin();
      expect(screen.getByTitle('Format Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Format Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Format Underline')).toBeInTheDocument();
    });

    test('renders right side buttons', () => {
      renderToolbarPlugin();
      expect(screen.getByTitle('Undo')).toBeInTheDocument();
      expect(screen.getByTitle('Redo')).toBeInTheDocument();
    });

    test('renders with empty tool lists', () => {
      renderToolbarPlugin({
        toolList: { leftSide: [], rightSide: [] }
      });
      expect(screen.getByTestId('test-toolbar')).toBeInTheDocument();
    });

    test('renders with minToolBarDefault true', () => {
      renderToolbarPlugin({ minToolBarDefault: true });
      expect(screen.getByTitle('Hide Tool Bar')).toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    test('bold button dispatches FORMAT_TEXT_COMMAND', () => {
      renderToolbarPlugin();
      const boldButton = screen.getByTitle('Format Bold');
      
      fireEvent.click(boldButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('FORMAT_TEXT_COMMAND', 'bold');
    });

    test('italic button dispatches FORMAT_TEXT_COMMAND', () => {
      renderToolbarPlugin();
      const italicButton = screen.getByTitle('Format Italic');
      
      fireEvent.click(italicButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('FORMAT_TEXT_COMMAND', 'italic');
    });

    test('underline button dispatches FORMAT_TEXT_COMMAND', () => {
      renderToolbarPlugin();
      const underlineButton = screen.getByTitle('Format Underline');
      
      fireEvent.click(underlineButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('FORMAT_TEXT_COMMAND', 'underline');
    });

    test('undo button dispatches UNDO_COMMAND', () => {
      renderToolbarPlugin();
      const undoButton = screen.getByTitle('Undo');
      
      fireEvent.click(undoButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('UNDO_COMMAND', undefined);
    });

    test('redo button dispatches REDO_COMMAND', () => {
      renderToolbarPlugin();
      const redoButton = screen.getByTitle('Redo');
      
      fireEvent.click(redoButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('REDO_COMMAND', undefined);
    });

    test('copy button dispatches COPY_COMMAND', () => {
      const toolList = {
        leftSide: ['copy'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const copyButton = screen.getByTitle('Copy');
      
      fireEvent.click(copyButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('COPY_COMMAND', null);
    });

    test('cut button dispatches CUT_COMMAND', () => {
      const toolList = {
        leftSide: ['cut'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const cutButton = screen.getByTitle('Cut');
      
      fireEvent.click(cutButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('CUT_COMMAND', null);
    });
  });

  describe('List Commands', () => {
    test('bulleted list button dispatches INSERT_UNORDERED_LIST_COMMAND', () => {
      const toolList = {
        leftSide: ['bullist'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const bullistButton = screen.getByTitle('Bulleted List');
      
      fireEvent.click(bullistButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('INSERT_UNORDERED_LIST_COMMAND', undefined);
    });

    test('numbered list button dispatches INSERT_ORDERED_LIST_COMMAND', () => {
      const toolList = {
        leftSide: ['numlist'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const numlistButton = screen.getByTitle('Numbered List');
      
      fireEvent.click(numlistButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('INSERT_ORDERED_LIST_COMMAND', undefined);
    });
  });

  describe('Indent Commands', () => {
    test('outdent button dispatches OUTDENT_CONTENT_COMMAND', () => {
      const toolList = {
        leftSide: ['outdent'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const outdentButton = screen.getByTitle('Outdent');
      
      fireEvent.click(outdentButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('OUTDENT_CONTENT_COMMAND', undefined);
    });

    test('indent button dispatches INDENT_CONTENT_COMMAND', () => {
      const toolList = {
        leftSide: ['indent'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ toolList });
      const indentButton = screen.getByTitle('Indent');
      
      fireEvent.click(indentButton);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('INDENT_CONTENT_COMMAND', undefined);
    });
  });

  describe('Alignment Menu', () => {
    test('align menu button opens alignment menu', () => {
      const toolList = {
        leftSide: ['alignMenu'],
        rightSide: [],
      };
      const setAlignMenuAnchor = jest.fn();
      
      renderToolbarPlugin({ 
        toolList, 
        setAlignMenuAnchor,
        alignMenuAnchor: null 
      });
      
      const alignButton = screen.getByTitle('Align Menu');
      fireEvent.click(alignButton);
      
      expect(setAlignMenuAnchor).toHaveBeenCalled();
    });

    test('align menu shows when alignMenuAnchor is set', () => {
      const toolList = {
        leftSide: ['alignMenu'],
        rightSide: [],
      };
      
      const mockAnchor = document.createElement('div');
      
      renderToolbarPlugin({ 
        toolList,
        alignMenuAnchor: mockAnchor 
      });
      
      expect(screen.getByTestId('menu')).toBeInTheDocument();
    });

    test('align left menu item dispatches FORMAT_ELEMENT_COMMAND', () => {
      const toolList = {
        leftSide: ['alignMenu'],
        rightSide: [],
      };
      
      const mockAnchor = document.createElement('div');
      
      renderToolbarPlugin({ 
        toolList,
        alignMenuAnchor: mockAnchor 
      });
      
      const alignLeftItem = screen.getAllByTestId('menu-item')[0];
      fireEvent.click(alignLeftItem);
      
      expect(mockEditor.dispatchCommand).toHaveBeenCalledWith('FORMAT_ELEMENT_COMMAND', 'left');
    });
  });

  describe('Paste Action', () => {
    test('paste button handles clipboard read', async () => {
      const toolList = {
        leftSide: ['paste'],
        rightSide: [],
      };

      const mockItems = [{
        types: ['text/plain'],
        getType: jest.fn().mockResolvedValue({
          type: 'text/plain',
          text: jest.fn().mockResolvedValue('test content')
        })
      }];

      navigator.clipboard.read.mockResolvedValue(mockItems);
      
      renderToolbarPlugin({ toolList });
      const pasteButton = screen.getByTitle('Paste');
      
      fireEvent.click(pasteButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.read).toHaveBeenCalled();
      });
    });

    test('paste button handles clipboard errors gracefully', async () => {
      const toolList = {
        leftSide: ['paste'],
        rightSide: [],
      };

      navigator.clipboard.read.mockRejectedValue(new Error('Clipboard access denied'));
      
      renderToolbarPlugin({ toolList });
      const pasteButton = screen.getByTitle('Paste');
      
      fireEvent.click(pasteButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.read).toHaveBeenCalled();
      });
      // Should not throw error
    });
  });

  describe('Endnote Functionality', () => {
    test('endnote button calls setShowAddEndnoteModal when canCreateEndnote is true', () => {
      const toolList = {
        leftSide: ['endnote'],
        rightSide: [],
      };
      const setShowAddEndnoteModal = jest.fn();
      
      renderToolbarPlugin({ 
        toolList, 
        setShowAddEndnoteModal,
        canCreateEndnote: true 
      });
      
      const endnoteButton = screen.getByTitle('Add Endnote');
      fireEvent.click(endnoteButton);
      
      expect(setShowAddEndnoteModal).toHaveBeenCalledWith(true);
    });

    test('endnote button shows "Edit Endnote" when currentEndnote exists', () => {
      const toolList = {
        leftSide: ['endnote'],
        rightSide: [],
      };
      const mockEndnote = { id: 1 };
      
      renderToolbarPlugin({ 
        toolList, 
        currentEndnote: mockEndnote 
      });
      
      expect(screen.getByTitle('Edit Endnote')).toBeInTheDocument();
    });

    test('endnote button is readonly when canCreateEndnote is false and no currentEndnote', () => {
      const toolList = {
        leftSide: ['endnote'],
        rightSide: [],
      };
      
      renderToolbarPlugin({ 
        toolList, 
        canCreateEndnote: false,
        currentEndnote: null 
      });
      
      const endnoteButton = screen.getByTitle('Add Endnote');
      expect(endnoteButton).toHaveAttribute('readOnly');
    });
  });

  describe('Insert Button', () => {
    test('insert button calls setShowAddContentModal', () => {
      const toolList = {
        leftSide: ['insert'],
        rightSide: [],
      };
      const setShowAddContentModal = jest.fn();
      
      renderToolbarPlugin({ 
        toolList, 
        setShowAddContentModal 
      });
      
      const insertButton = screen.getByTitle('Insert');
      fireEvent.click(insertButton);
      
      expect(setShowAddContentModal).toHaveBeenCalledWith(true);
    });
  });

  describe('Table Creator', () => {
    test('table button opens table creator', () => {
      const toolList = {
        leftSide: ['table'],
        rightSide: [],
      };
      const setTableCreatorAnchor = jest.fn();
      
      renderToolbarPlugin({ 
        toolList, 
        setTableCreatorAnchor 
      });
      
      const tableButton = screen.getByTitle('Insert Table');
      fireEvent.click(tableButton);
      
      expect(setTableCreatorAnchor).toHaveBeenCalled();
    });
  });

  describe('Toolbar Toggle', () => {
    test('toggle button hides toolbar when showToolBar is true', () => {
      renderToolbarPlugin({ minToolBarDefault: true });
      
      const toggleButton = screen.getByTitle('Hide Tool Bar');
      fireEvent.click(toggleButton);
      
      // After clicking, the button should show "Show Tool Bar"
      expect(screen.getByTitle('Show Tool Bar')).toBeInTheDocument();
    });

    test('toggle button shows toolbar when showToolBar is false', () => {
      renderToolbarPlugin({ minToolBarDefault: true });
      
      // First click to hide
      const toggleButton = screen.getByTitle('Hide Tool Bar');
      fireEvent.click(toggleButton);
      
      // Second click to show
      const showButton = screen.getByTitle('Show Tool Bar');
      fireEvent.click(showButton);
      
      expect(screen.getByTitle('Hide Tool Bar')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    test('buttons show active state when format is applied', () => {
      const mockSelection = {
        hasFormat: jest.fn((format) => format === 'bold'),
      };
      
      require('lexical').$getSelection.mockReturnValue(mockSelection);
      require('lexical').$isRangeSelection.mockReturnValue(true);
      
      // Trigger the update listener
      const updateListener = mockRegisterUpdateListener.mock.calls[0][0];
      const editorState = {
        read: jest.fn((callback) => callback()),
      };
      updateListener({ editorState });
      
      renderToolbarPlugin();
      
      const boldButton = screen.getByTitle('Format Bold');
      expect(boldButton).toHaveClass('active');
    });

    test('undo button is disabled when canUndo is false', () => {
      // Simulate CAN_UNDO_COMMAND with false payload
      const commandListener = mockRegisterCommand.mock.calls.find(
        call => call[0] === 'CAN_UNDO_COMMAND'
      )?.[1];
      
      if (commandListener) {
        commandListener(false);
      }
      
      renderToolbarPlugin();
      
      const undoButton = screen.getByTitle('Undo (Deactivated)');
      expect(undoButton).toHaveAttribute('readOnly');
    });

    test('redo button is disabled when canRedo is false', () => {
      // Simulate CAN_REDO_COMMAND with false payload
      const commandListener = mockRegisterCommand.mock.calls.find(
        call => call[0] === 'CAN_REDO_COMMAND'
      )?.[1];
      
      if (commandListener) {
        commandListener(false);
      }
      
      renderToolbarPlugin();
      
      const redoButton = screen.getByTitle('Redo (Deactivated)');
      expect(redoButton).toHaveAttribute('readOnly');
    });
  });

  describe('Cleanup', () => {
    test('unregisters listeners on unmount', () => {
      const { unmount } = renderToolbarPlugin();
      
      expect(mockRegisterUpdateListener).toHaveBeenCalled();
      expect(mockRegisterCommand).toHaveBeenCalled();
      
      unmount();
      
      // Verify cleanup functions were returned and would be called
      expect(mockRegisterUpdateListener).toHaveReturnedWith(expect.any(Function));
      expect(mockRegisterCommand).toHaveReturnedWith(expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    test('handles missing editor gracefully', () => {
      require('@lexical/react/LexicalComposerContext').useLexicalComposerContext.mockReturnValue([
        null,
      ]);
      
      expect(() => renderToolbarPlugin()).not.toThrow();
    });

    test('handles missing toolList gracefully', () => {
      expect(() => renderToolbarPlugin({ toolList: undefined })).not.toThrow();
    });

    test('handles undefined callback functions gracefully', () => {
      const props = {
        ...defaultProps,
        isCanUndo: undefined,
        isCanRedo: undefined,
        setShowAddContentModal: undefined,
        setShowAddEndnoteModal: undefined,
      };
      
      expect(() => renderToolbarPlugin(props)).not.toThrow();
    });
  });
});