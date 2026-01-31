import React, { useCallback, useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $setBlocksType } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import { Fullscreen, FullscreenExit, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp } from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import {
  ArrowClockwise,
  ArrowCounterclockwise,
  ArrowDownRightSquareFill,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Code,
  Copy,
  Highlighter,
  Hr,
  Journal,
  Justify,
  JustifyLeft,
  JustifyRight,
  ListOl,
  ListUl,
  Scissors,
  Table,
  TextCenter,
  TextIndentLeft,
  TextIndentRight,
  TypeBold,
  TypeItalic,
  TypeUnderline,
} from 'react-bootstrap-icons';

import { DEFAULT_HIGHLIGHT_COLOR } from './letterEditor/plugins/HighlightPlugin';
import TableCreatorPlugin from './TableCreatorPlugin';
import { useFeatureFlags } from '../../../../admin/flag/FeatureFlagsProvider';

const StyledBtn = styled(Button)`
  background-color: #707070;
  color: #ffffff;
  border-color: #eeeeee;
  &:hover,
  &:focus {
    background-color: #ffffff;
    color: #707070;
    border-color: #707070;
    box-shadow: none;
  }
  border-radius: 4px;
  height: ${(props) => props.size};
  width: ${(props) => props.size};
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleBtn = styled(StyledBtn)`
  border: none;
  height: 14px;
  width: 14px;
  margin: 2px 0px;
`;

const MenuGlyph = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 25px;
  width: 25px;
  border-radius: 4px;
  background-color: #707070;
  color: #ffffff;
  border: 1px solid #eeeeee;
  transition: all 0.2s ease;
`;

const StyledMenuItem = styled(MenuItem)`
  display: flex;
  gap: 8px;
  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6,
  & p {
    line-height: 1.2;
    font-weight: normal;
  }

  &:focus-visible > ${MenuGlyph} {
    background-color: #ffffff;
    color: #707070;
    border-color: #707070;
  }
`;

const ToolBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: #707070;
  padding: 4px 8px;
  border-top: 1px solid black;
  border-left: 1px solid black;
  border-right: 1px solid black;
  border-radius: 10px 10px 0 0;
`;

const GeneralContainer = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const AlignLabel = styled.span`
  color: #ffffff;
  font-size: 12px;
`;

export const Glyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  border-radius: 4px;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    serif;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  font-size: 10px;
  transform: translateY(0.5px);
  margin-top: 1px;
  opacity: 0.8;
  user-select: none;
`;

export const GlyphTight = styled(Glyph)`
  font-size: 9px;
  letter-spacing: -0.04em;
`;

export const ICON_LOWER_ROMAN = <Glyph aria-hidden>i, ii</Glyph>;

export const ICON_UPPER_ROMAN = <GlyphTight aria-hidden>I, II</GlyphTight>;

export const ICON_LOWER_ALPHA = <Glyph aria-hidden>a, b</Glyph>;

export const ICON_UPPER_ALPHA = <GlyphTight aria-hidden>A, B</GlyphTight>;

const renderBlockPreview = (name, label) => {
  switch (name) {
    case 'paragraph':
      return <p>{label}</p>;
    case 'h1':
      return <h1>{label}</h1>;
    case 'h2':
      return <h2>{label}</h2>;
    case 'h3':
      return <h3>{label}</h3>;
    case 'h4':
      return <h4>{label}</h4>;
    case 'h5':
      return <h5>{label}</h5>;
    case 'h6':
      return <h6>{label}</h6>;
    default:
      return <p>{label}</p>;
  }
};

const AnchorElShape = PropTypes.oneOfType([PropTypes.shape({ getBoundingClientRect: PropTypes.func.isRequired }), PropTypes.oneOf([null])]);

export default function ToolbarPlugin({
  id = '',
  toolList = {},
  isCanUndo,
  isCanRedo,
  alignMenuAnchor = null,
  setAlignMenuAnchor = () => {},
  canCreateEndnote = false,
  currentEndnote = null,
  tableCreatorAnchor = null,
  setTableCreatorAnchor = () => {},
  blockTypeMenuAnchor = null,
  setBlockTypeMenuAnchor = () => {},
  listMenuAnchor = null,
  setListMenuAnchor = () => {},
  editorId,
  setShowAddContentModal,
  setShowAddEndnoteModal,
  minToolBarDefault,
  isSourceCodeView = false,
  toggleSourceCodeView = () => {},
  isFullscreen = false,
  toggleFullscreen = () => {},
}) {
  const [editor] = useLexicalComposerContext();
  const toolBarRef = useRef(null);
  const alignMenuRef = useRef(null);
  const tableCreatorRef = useRef(null);
  const blockTypeMenuRef = useRef(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showToolBar, setShowToolBar] = useState(false);
  const [curBtnList, setCurBtnList] = useState([toolList.leftSide, toolList.rightSide]);

  const [dynamicPosition, setDynamicPosition] = useState({ vertical: 'bottom', horizontal: 'left' });
  const [isHighlight, setIsHighlight] = useState(false);
  const [blockMenuWidth, setBlockMenuWidth] = useState(null);

  const listMenuRef = useRef(null);
  const listMenuOpen = Boolean(listMenuAnchor);

  const { featureFlags, hasFlag } = useFeatureFlags();

  const alignMenuOpen = Boolean(alignMenuAnchor);
  const blockTypeMenuOpen = Boolean(blockTypeMenuAnchor);

  // fullscreen: retains all features, zooming, and tabbing
  useEffect(() => {
    const portraitUsLetterDiv = document.getElementById('portrait-us-letter');
    const editorContainer = document.getElementById(editorId); // editorId = 'editor-UUID'
    const editorEditableDiv = document.getElementById(`content-editable-${editorId}`); // The div is 'content-editable-editor-UUID'
    if (!portraitUsLetterDiv || !editorContainer || !editorEditableDiv) {
      return undefined;
    }

    // Ensure the editorEditableDiv is tabbable
    editorEditableDiv.setAttribute('tabindex', '0');

    const all = Array.from(document.body.children);
    const others = all.filter((el) => el !== editorContainer && !el.contains(editorContainer) && el !== editorEditableDiv);

    // Find all focusable elements within the editorContainer
    const focusableElements = Array.from(
      editorContainer.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"]), .lexical-editor')
    );

    // Add editorEditableDiv explicitly to the focusable elements
    if (!focusableElements.includes(editorEditableDiv)) {
      focusableElements.push(editorEditableDiv);
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const currentIndex = focusableElements.indexOf(document.activeElement);
        if (currentIndex === -1) return; // If focused element is not found
        event.preventDefault();
        let nextIndex;

        if (event.shiftKey) {
          nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1; // Shift + Tab: Move backward
        } else {
          nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1; // Tab: Move forward
        }

        const nextElement = focusableElements[nextIndex];
        nextElement.focus();
      }
    };

    if (editorContainer) {
      if (isFullscreen) {
        document.body.style.overflow = 'hidden';
        editorContainer.classList.add('fullscreen-editor');
        portraitUsLetterDiv.classList.remove('portraitUsLetter');

        // Make everything outside the editor inert
        others.forEach((el) => {
          el.inert = true;
        });
        editorContainer.setAttribute('tabindex', '-1');
        editorContainer.focus();

        // Add keydown listener for cycling focus
        editorContainer.addEventListener('keydown', handleKeyDown);
      } else {
        document.body.style.overflow = '';
        editorContainer.classList.remove('fullscreen-editor');
        portraitUsLetterDiv.classList.add('portraitUsLetter');

        // Un-make everything outside the editor inert
        others.forEach((el) => {
          el.inert = false;
        });
        editorContainer.removeAttribute('tabindex');

        // Remove keydown listener
        editorContainer.removeEventListener('keydown', handleKeyDown);
      }
    }

    return () => {
      // Cleanup: Remove keydown listener
      editorContainer.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, editorId]);

  const calculateSpace = (el) => {
    if (!el || !el.getBoundingClientRect) {
      setDynamicPosition({ vertical: 'bottom', horizontal: 'left' });
      return;
    }
    const rect = el.getBoundingClientRect();
    const enoughSpaceBelow = window.innerHeight - rect.bottom > 200;
    setDynamicPosition({
      vertical: enoughSpaceBelow ? 'bottom' : 'top',
      horizontal: 'left',
    });
  };

  const handleAlignMenuOpen = () => {
    calculateSpace(alignMenuRef);
    setAlignMenuAnchor(alignMenuRef.current);
  };

  const handleAlignMenuClose = () => setAlignMenuAnchor(null);

  const handleBlockTypeMenuOpen = () => {
    editor.focus();
    calculateSpace(blockTypeMenuRef);
    const buttonElement = blockTypeMenuRef.current;
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      setBlockMenuWidth(rect.width);
    }
    setBlockTypeMenuAnchor(blockTypeMenuRef.current);
  };

  const handleBlockTypeMenuClose = () => setBlockTypeMenuAnchor(null);

  const handleTableCreatorOpen = () => {
    editor.focus();
    calculateSpace(tableCreatorRef);
    setTableCreatorAnchor(tableCreatorRef.current);
  };

  const handleTableCreatorClose = () => {
    setTimeout(() => {
      setTableCreatorAnchor(null);
    }, 0);
  };

  const dispatchAction = (command, name = undefined) => {
    editor.dispatchCommand(command, name);
  };

  const handleBlockTypeChange = useCallback(
    (newBlockType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (newBlockType === 'paragraph') {
            $setBlocksType(selection, () => $createParagraphNode());
          } else {
            $setBlocksType(selection, () => $createHeadingNode(newBlockType));
          }
        }
      });
    },
    [editor]
  );

  const toggleToolBar = () => {
    setCurBtnList(curBtnList.length === 0 ? [toolList.leftSide, toolList.rightSide] : []);
    setShowToolBar(!showToolBar);
  };

  const pasteAction = () => {
    navigator.clipboard.read().then(async () => {
      const data = new DataTransfer();

      const items = await navigator.clipboard.read();
      const item = items[0];
      const itemTypes = await Promise.all(item.types.map((type) => item.getType(type)));
      const itemTypeTexts = await Promise.all(itemTypes.map((itemType) => itemType.text()));
      itemTypes.forEach((itemType, i) => {
        const itemTypeText = itemTypeTexts[i];
        data.setData(itemType.type, itemTypeText);
      });

      const event = new ClipboardEvent('paste', { clipboardData: data });
      dispatchAction(PASTE_COMMAND, event);
    });
  };

  const handleEndnoteAction = () => {
    if (currentEndnote) {
      // If we're on an existing endnote, show the modal to edit it
      setShowAddEndnoteModal(true);
    } else if (canCreateEndnote) {
      // If we can create a new endnote, show the modal to create it
      setShowAddEndnoteModal(true);
    }
  };

  const handleListMenuOpen = () => {
    if (listMenuAnchor) {
      setListMenuAnchor(null);
    } else {
      calculateSpace(listMenuRef);
      setListMenuAnchor(listMenuRef.current);
    }
  };
  const handleListMenuClose = () => setListMenuAnchor(null);

  const OL_TYPE_MAP = {
    'lower-roman': 'i',
    'upper-roman': 'I',
    'lower-alpha': 'a',
    'upper-alpha': 'A',
  };

  const clearOrderedTypeOnNearestList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      let node = selection.anchor.getNode();
      while (node && !$isListNode(node)) node = node.getParent();

      if ($isListNode(node)) {
        // Clear ListNode style (for export persistence)
        node.setStyle('');

        // Clear live DOM (for immediate visual feedback)
        const elem = editor.getElementByKey(node.getKey());
        if (elem && elem.tagName === 'OL') {
          elem.removeAttribute('type');
          elem.style.removeProperty('list-style-type');
        }
      }
    });
  };

  // Apply custom ordered list numbering style
  const applyOrderedListType = (typeKey /* '', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha' */) => {
    // Ensure we're in an ordered list first
    dispatchAction(INSERT_ORDERED_LIST_COMMAND, undefined);
    // Apply styling after DOM is flushed
    queueMicrotask(() => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        let node = selection.anchor.getNode();
        while (node && !$isListNode(node)) node = node.getParent();

        if ($isListNode(node) && node.getListType() === 'number') {
          if (!typeKey) {
            // Default decimal: clear all styling
            node.setStyle('');
            const elem = editor.getElementByKey(node.getKey());
            if (elem && elem.tagName === 'OL') {
              elem.removeAttribute('type');
              elem.style.removeProperty('list-style-type');
            }
          } else {
            // Custom style: persist on node + apply to DOM
            node.setStyle(`list-style-type: ${typeKey} !important`);

            const elem = editor.getElementByKey(node.getKey());
            if (elem && elem.tagName === 'OL') {
              elem.setAttribute('type', OL_TYPE_MAP[typeKey]);
              elem.style.setProperty('list-style-type', typeKey, 'important');
            }
          }
        }
      });
    });

    handleListMenuClose();
  };

  const alignBtns = {
    alignleft: {
      id: 'alignleft',
      label: 'Align Left',
      title: 'Align Left',
      icon: <JustifyLeft />,
      action: () => {
        handleAlignMenuClose();
        dispatchAction(FORMAT_ELEMENT_COMMAND, 'left');
      },
    },
    aligncenter: {
      id: 'aligncenter',
      label: 'Align Center',
      title: 'Align Center',
      icon: <TextCenter />,
      action: () => {
        handleAlignMenuClose();
        dispatchAction(FORMAT_ELEMENT_COMMAND, 'center');
      },
    },
    alignright: {
      id: 'alignright',
      label: 'Align Right',
      title: 'Align Right',
      icon: <JustifyRight />,
      action: () => {
        handleAlignMenuClose();
        dispatchAction(FORMAT_ELEMENT_COMMAND, 'right');
      },
    },
    alignjustify: {
      id: 'alignjustify',
      label: 'Justify',
      title: 'Justify',
      icon: <Justify />,
      action: () => {
        handleAlignMenuClose();
        dispatchAction(FORMAT_ELEMENT_COMMAND, 'justify');
      },
    },
  };

  const blockTypeBtns = {
    paragraph: {
      id: 'paragraph',
      label: 'Paragraph',
      title: 'Paragraph',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('paragraph');
      },
    },
    h1: {
      id: 'h1',
      label: 'Header 1',
      title: 'Header 1',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h1');
      },
    },
    h2: {
      id: 'h2',
      label: 'Header 2',
      title: 'Header 2',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h2');
      },
    },
    h3: {
      id: 'h3',
      label: 'Header 3',
      title: 'Header 3',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h3');
      },
    },
    h4: {
      id: 'h4',
      label: 'Header 4',
      title: 'Header 4',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h4');
      },
    },
    h5: {
      id: 'h5',
      label: 'Header 5',
      title: 'Header 5',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h5');
      },
    },
    h6: {
      id: 'h6',
      label: 'Header 6',
      title: 'Header 6',
      action: () => {
        handleBlockTypeMenuClose();
        handleBlockTypeChange('h6');
      },
    },
  };

  const listBtns = {
    bulleted: {
      id: 'bulleted',
      label: 'Bulleted',
      title: 'Bulleted List (●)',
      icon: <ListUl />,
      action: () => {
        editor.focus();
        handleListMenuClose();
        dispatchAction(INSERT_UNORDERED_LIST_COMMAND, undefined);
        // If we were in an OL with a type, clear it
        clearOrderedTypeOnNearestList();
      },
    },
    numbered: {
      id: 'numbered',
      label: 'Numbered',
      title: 'Numbered List (1, 2, 3)',
      icon: <ListOl />,
      action: () => {
        editor.focus();
        applyOrderedListType('');
      },
    },
    lowerRoman: {
      id: 'lowerRoman',
      label: 'Lowercase Roman Numeral',
      title: 'Lowercase Roman Numeral (i, ii, iii)',
      icon: ICON_LOWER_ROMAN,
      action: () => {
        editor.focus();
        applyOrderedListType('lower-roman');
      },
    },
    upperRoman: {
      id: 'upperRoman',
      label: 'Uppercase Roman Numeral',
      title: 'Uppercase Roman Numeral (I, II, III)',
      icon: ICON_UPPER_ROMAN,
      action: () => {
        editor.focus();
        applyOrderedListType('upper-roman');
      },
    },
    lowerAlpha: {
      id: 'lowerAlpha',
      label: 'Lowercase Alphabetical',
      title: 'Lowercase Alphabetical (a, b, c)',
      icon: ICON_LOWER_ALPHA,
      action: () => {
        editor.focus();
        applyOrderedListType('lower-alpha');
      },
    },
    upperAlpha: {
      id: 'upperAlpha',
      label: 'Uppercase Alphabetical',
      title: 'Uppercase Alphabetical (A, B, C)',
      icon: ICON_UPPER_ALPHA,
      action: () => {
        editor.focus();
        applyOrderedListType('upper-alpha');
      },
    },
  };

  const toolBarBtns = {
    blockType: {
      id: 'blockType',
      title: 'Paragraph Style',
      ariaLabel: 'Paragraph Style',
      icon: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: '12px',
            fontWeight: '500',
          }}>
          <span>Paragraph Style</span>
          {blockTypeMenuOpen ? <ChevronUp size="10" color="#ffffff" /> : <ChevronDown size="10" color="#ffffff" />}
        </div>
      ),
      ref: blockTypeMenuRef,
      action: handleBlockTypeMenuOpen,
    },
    bold: {
      id: 'bold',
      title: 'Format Bold',
      ariaLabel: 'Format Bold',
      icon: <TypeBold />,
      classes: isBold ? 'active' : '',
      action: () => dispatchAction(FORMAT_TEXT_COMMAND, 'bold'),
    },
    italic: {
      id: 'italic',
      title: 'Format Italic',
      ariaLabel: 'Format Italic',
      icon: <TypeItalic />,
      classes: isItalic ? 'active' : '',
      action: () => dispatchAction(FORMAT_TEXT_COMMAND, 'italic'),
    },
    underline: {
      id: 'underline',
      title: 'Format Underline',
      ariaLabel: 'Format Underline',
      icon: <TypeUnderline />,
      classes: isUnderline ? 'active' : '',
      action: () => dispatchAction(FORMAT_TEXT_COMMAND, 'underline'),
    },
    alignMenu: {
      id: 'alignMenu',
      title: 'Align Menu',
      ariaLabel: 'Align Menu',
      icon: <JustifyLeft />,
      ref: alignMenuRef,
      action: handleAlignMenuOpen,
    },
    lists: {
      id: 'lists',
      title: 'Insert List',
      ariaLabel: 'Insert List',
      icon: <ListUl />,
      ref: listMenuRef,
      action: handleListMenuOpen,
    },
    outdent: {
      id: 'outdent',
      title: 'Outdent',
      icon: <TextIndentRight />,
      ariaLabel: 'Outdent',
      action: () => dispatchAction(OUTDENT_CONTENT_COMMAND, undefined),
    },
    indent: {
      id: 'indent',
      title: 'Indent',
      ariaLabel: 'Indent',
      icon: <TextIndentLeft />,
      action: () => dispatchAction(INDENT_CONTENT_COMMAND, undefined),
    },
    table: {
      id: 'table',
      title: 'Insert Table',
      ariaLabel: 'Insert Table',
      ref: tableCreatorRef,
      icon: <Table />,
      action: handleTableCreatorOpen,
    },
    horizontalrule: {
      id: 'horizontalrule',
      title: 'Horizontal Rule',
      ariaLabel: 'Horizontal Rule',
      icon: <Hr />,
      action: () => dispatchAction(INSERT_HORIZONTAL_RULE_COMMAND, 'horizontalrule'),
    },
    undo: {
      id: 'undo',
      title: 'Undo',
      ariaLabel: `Undo${!canUndo ? ' (Deactivated)' : ''}`,
      readonly: !canUndo,
      icon: <ArrowCounterclockwise />,
      action: () => dispatchAction(UNDO_COMMAND, undefined),
    },
    redo: {
      id: 'redo',
      title: 'Redo',
      ariaLabel: `Redo${!canRedo ? ' (Deactivated)' : ''}`,
      icon: <ArrowClockwise />,
      readonly: !canRedo,
      action: () => dispatchAction(REDO_COMMAND, undefined),
    },
    copy: {
      id: 'copy',
      title: 'Copy',
      ariaLabel: 'Copy',
      icon: <Copy />,
      action: () => dispatchAction(COPY_COMMAND, null),
    },
    paste: {
      id: 'paste',
      title: 'Paste',
      ariaLabel: 'Paste',
      icon: <Clipboard />,
      action: pasteAction,
    },
    cut: {
      id: 'cut',
      ariaLabel: 'Cut',
      title: 'Cut',
      icon: <Scissors style={{ transform: 'rotate(90deg)' }} />,
      action: () => dispatchAction(CUT_COMMAND, null),
    },
    insert: {
      id: 'insert',
      title: 'Insert',
      ariaLabel: 'Insert Text',
      icon: <ArrowDownRightSquareFill />,
      action: () => setShowAddContentModal(true),
    },
    ...(featureFlags &&
      hasFlag(featureFlags, 'endnotes') && {
        endnote: {
          id: 'endnote',
          title: currentEndnote ? 'Edit Endnote' : 'Add Endnote',
          ariaLabel: currentEndnote ? 'Edit Endnote' : 'Add Endnote',
          readonly: !canCreateEndnote && !currentEndnote,
          icon: <Journal />,
          action: handleEndnoteAction,
        },
      }),
    highlight: {
      id: 'highlight',
      title: 'Highlight',
      ariaLabel: 'Highlight Text',
      icon: <Highlighter />,
      classes: isHighlight ? 'active' : '',
      action: () => dispatchAction('APPLY_HIGHLIGHT'),
    },
    sourceCode: {
      id: 'sourceCode',
      title: isSourceCodeView ? 'Switch to Editor View' : 'Switch to Source Code View',
      ariaLabel: isSourceCodeView ? 'Switch to Editor View' : 'Switch to Source Code View',
      icon: <Code />,
      classes: isSourceCodeView ? 'active' : '',
      action: toggleSourceCodeView,
    },
    fullscreen: {
      id: 'fullscreen',
      title: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      ariaLabel: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      icon: isFullscreen ? <FullscreenExit /> : <Fullscreen />,
      action: toggleFullscreen,
    },
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const backgroundColor = $getSelectionStyleValueForProperty(selection, 'background-color', '');
      setIsHighlight(backgroundColor === DEFAULT_HIGHLIGHT_COLOR);
      // Add block type detection with better error handling
      try {
        const anchorNode = selection.anchor.getNode();
        let element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

        if (element.getType() === 'text') {
          element = element.getParent();
        }
      } catch (error) {
        console.warn('Error detecting block type:', error);
      }
    }
  }, []);

  useEffect(() => {
    const container = toolBarRef.current;
    if (container) {
      const btns = container.querySelectorAll('button');
      btns[0].focus();
    }
  }, [showToolBar]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(() => updateToolbar())),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateToolbar();
            return false;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          CAN_UNDO_COMMAND,
          (payload) => {
            isCanUndo(payload);
            setCanUndo(payload);
            return false;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          CAN_REDO_COMMAND,
          (payload) => {
            isCanRedo(payload);
            setCanRedo(payload);
            return false;
          },
          COMMAND_PRIORITY_LOW
        )
      ),
    [editor, isCanRedo, isCanUndo, updateToolbar]
  );

  // Helper functions for menu ARIA attributes
  const getMenuAriaHaspopup = (name) => {
    if (name === 'lists' || name === 'alignMenu') return 'menu';
    return undefined;
  };

  const getMenuAriaExpanded = (name) => {
    if (name === 'lists') return listMenuOpen;
    if (name === 'alignMenu') return alignMenuOpen;
    return undefined;
  };

  const getMenuAriaControls = (name) => {
    if (name === 'lists') return 'list-style-menu';
    if (name === 'alignMenu') return 'text-align-menu';
    return undefined;
  };

  const styledBtnSize = `${minToolBarDefault ? 24 : 18}px`;

  const chevronGroup = (name) => {
    const groupedButtonWithChevron = name === 'lists' || name === 'alignMenu';
    let attrObj = {};

    if (groupedButtonWithChevron) {
      attrObj = { onClick: toolBarBtns[name].action, style: { cursor: 'pointer' } };
    }

    return attrObj;
  };

  return (
    <ToolBarContainer ref={toolBarRef} id={id}>
      <GeneralContainer>
        {curBtnList[0]?.map((name) => (
          <GeneralContainer key={`${editorId}Menu${name}`} {...chevronGroup(name)}>
            <StyledBtn
              type="button"
              id={toolBarBtns[name]?.id}
              ref={toolBarBtns[name]?.ref}
              aria-label={toolBarBtns[name]?.ariaLabel}
              title={toolBarBtns[name]?.title}
              onClick={toolBarBtns[name]?.action}
              readOnly={toolBarBtns[name]?.readonly}
              className={`toolbar-item spaced ${toolBarBtns[name]?.classes}`}
              size={styledBtnSize}
              aria-haspopup={getMenuAriaHaspopup(name)}
              aria-expanded={getMenuAriaExpanded(name)}
              aria-controls={getMenuAriaControls(name)}
              style={
                name === 'blockType'
                  ? { minWidth: '165px', width: 'auto', padding: '2px 8px', borderRadius: '0px', fontFamily: 'Arial, sans-serif' }
                  : {}
              }>
              {toolBarBtns[name]?.icon}
            </StyledBtn>

            {name === 'alignMenu' && (
              <>
                {!alignMenuAnchor && <ChevronDown aria-hidden="true" color="#ffffff" size="10" />}
                {alignMenuAnchor && <ChevronUp aria-hidden="true" color="#ffffff" size="10" />}
              </>
            )}
            {name === 'lists' && (
              <>
                {!listMenuAnchor && <ChevronDown aria-hidden="true" color="#ffffff" size="10" />}
                {listMenuAnchor && <ChevronUp aria-hidden="true" color="#ffffff" size="10" />}
              </>
            )}
          </GeneralContainer>
        ))}
      </GeneralContainer>
      <Menu
        anchorEl={alignMenuAnchor}
        open={alignMenuOpen}
        anchorOrigin={dynamicPosition}
        transformOrigin={{
          vertical: dynamicPosition.vertical === 'bottom' ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        onClose={handleAlignMenuClose}
        slotProps={{
          list: {
            sx: { padding: '0px' },
            id: 'text-align-menu',
            'aria-label': 'Text alignment',
          },
          paper: {
            sx: {
              background: '#707070',
              borderRadius: dynamicPosition.vertical === 'bottom' ? '0px 0px 12px 12px' : '12px 12px 0px 0px',
              boxShadow: 'none',
              padding: '6px 0px 6px 0px',
              margin: dynamicPosition.vertical === 'bottom' ? '3px 0px 0px -15px' : '-3px 0px 0px -15px',
            },
          },
        }}>
        {Object.keys(alignBtns)?.map((name) => {
          const labelId = `align-${name}-label`;
          return (
            <StyledMenuItem onClick={alignBtns[name].action} key={name} aria-labelledby={labelId} id={alignBtns[name].id}>
              <MenuGlyph aria-hidden="true">{alignBtns[name].icon}</MenuGlyph>
              <AlignLabel id={labelId}>{alignBtns[name].label}</AlignLabel>
            </StyledMenuItem>
          );
        })}
      </Menu>
      <Menu
        anchorEl={blockTypeMenuAnchor}
        open={blockTypeMenuOpen}
        anchorOrigin={dynamicPosition}
        transformOrigin={{
          vertical: dynamicPosition.vertical === 'bottom' ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        onClose={handleBlockTypeMenuClose}
        slotProps={{
          list: { sx: { padding: 0 } },
          paper: {
            sx: {
              background: '#707070',
              borderRadius: dynamicPosition.vertical === 'bottom' ? '0px 0px 12px 12px' : '12px 12px 0px 0px',
              boxShadow: 'none',
              width: blockMenuWidth,
              mt: dynamicPosition.vertical === 'bottom' ? 0.5 : 0,
              mb: dynamicPosition.vertical === 'top' ? 0.5 : 0,
            },
          },
        }}>
        {Object.keys(blockTypeBtns)?.map((name) => (
          <StyledMenuItem
            key={name}
            onClick={blockTypeBtns[name].action}
            sx={{
              px: 2,
              py: 1,
              '& h1, & h2, & h3, & h4, & h5, & h6, & p': {
                margin: 0,
                color: '#fff',
                fontWeight: 'revert',
                fontSize: 'revert',
                lineHeight: 1.2,
              },
            }}>
            {renderBlockPreview(name, blockTypeBtns[name].label)}
          </StyledMenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={listMenuAnchor}
        open={listMenuOpen}
        anchorOrigin={dynamicPosition}
        transformOrigin={{
          vertical: dynamicPosition.vertical === 'bottom' ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        onClose={handleListMenuClose}
        slotProps={{
          list: {
            sx: { padding: '0px' },
            id: 'list-style-menu',
            'aria-label': 'List styles',
          },
          paper: {
            sx: {
              background: '#707070',
              borderRadius: dynamicPosition.vertical === 'bottom' ? '0px 0px 12px 12px' : '12px 12px 0px 0px',
              boxShadow: 'none',
              padding: '6px 0px',
              margin: dynamicPosition.vertical === 'bottom' ? '3px 0px 0px -15px' : '-3px 0px 0px -15px',
            },
          },
        }}>
        {Object.keys(listBtns).map((name) => {
          const labelId = `list-${name}-label`;
          return (
            <StyledMenuItem onClick={listBtns[name].action} key={name} aria-labelledby={labelId} id={listBtns[name].id}>
              <MenuGlyph aria-hidden="true">{listBtns[name].icon}</MenuGlyph>
              <AlignLabel id={labelId}>{listBtns[name].label}</AlignLabel>
            </StyledMenuItem>
          );
        })}
      </Menu>

      <GeneralContainer>
        {curBtnList[1]?.map(
          (name) =>
            toolBarBtns[name] && (
              <React.Fragment key={name}>
                <StyledBtn
                  type="button"
                  id={toolBarBtns[name].id}
                  ref={toolBarBtns[name]?.ref}
                  aria-label={toolBarBtns[name].ariaLabel}
                  title={toolBarBtns[name].title}
                  onClick={toolBarBtns[name].action}
                  readOnly={toolBarBtns[name].readonly}
                  className={`toolbar-item spaced ${toolBarBtns[name].classes}`}
                  size={styledBtnSize}>
                  {toolBarBtns[name].icon}
                </StyledBtn>
              </React.Fragment>
            )
        )}

        <TableCreatorPlugin handleClose={handleTableCreatorClose} anchorEl={tableCreatorAnchor} dynamicPosition={dynamicPosition} />

        {minToolBarDefault && (
          <ToggleBtn
            title={showToolBar ? 'Hide Tool Bar' : 'Show Tool Bar'}
            aria-label={showToolBar ? 'Hide Tool Bar' : 'Show Tool Bar'}
            onClick={toggleToolBar}>
            {showToolBar ? <KeyboardDoubleArrowDown /> : <KeyboardDoubleArrowUp />}
          </ToggleBtn>
        )}
      </GeneralContainer>
    </ToolBarContainer>
  );
}

ToolbarPlugin.propTypes = {
  id: PropTypes.string,
  editorId: PropTypes.string.isRequired,
  toolList: PropTypes.shape({}),
  isCanUndo: PropTypes.func.isRequired,
  isCanRedo: PropTypes.func.isRequired,
  setShowAddContentModal: PropTypes.func.isRequired,
  setShowAddEndnoteModal: PropTypes.func.isRequired,
  alignMenuAnchor: AnchorElShape,
  setAlignMenuAnchor: PropTypes.func,
  tableCreatorAnchor: AnchorElShape,
  setTableCreatorAnchor: PropTypes.func,
  blockTypeMenuAnchor: AnchorElShape,
  setBlockTypeMenuAnchor: PropTypes.func,
  listMenuAnchor: AnchorElShape,
  setListMenuAnchor: PropTypes.func,
  canCreateEndnote: PropTypes.bool,
  currentEndnote: PropTypes.shape({}),
  minToolBarDefault: PropTypes.bool.isRequired,
  isSourceCodeView: PropTypes.bool,
  toggleSourceCodeView: PropTypes.func,
  isFullscreen: PropTypes.bool,
  toggleFullscreen: PropTypes.func,
};
