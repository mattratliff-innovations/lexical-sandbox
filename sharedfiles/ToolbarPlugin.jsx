import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { Menu, MenuItem } from '@mui/material';
import Button from 'react-bootstrap/Button';
import {
  ArrowCounterclockwise,
  ArrowClockwise,
  TypeBold,
  Scissors,
  TypeItalic,
  TypeUnderline,
  TextIndentLeft,
  TextIndentRight,
  ListOl,
  ListUl,
  Justify,
  JustifyLeft,
  JustifyRight,
  Copy,
  Clipboard,
  Table,
  ArrowDownRightSquareFill,
  ChevronDown,
  ChevronUp,
  TextCenter,
  Journal,
} from 'react-bootstrap-icons';
import { KeyboardDoubleArrowDown, KeyboardDoubleArrowUp } from '@mui/icons-material';
import styled from '@emotion/styled/macro';
import PropTypes from 'prop-types';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  PASTE_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
} from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import TableCreatorPlugin from './TableCreatorPlugin';

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

const MenuBtn = styled(StyledBtn)`
  height: 25px;
  width: 25px;
`;

const StyledMenuItem = styled(MenuItem)`
  display: flex;
  gap: 8px;
  &:focus-visible > ${MenuBtn} {
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

const AlignLabel = styled.label`
  color: #ffffff;
  font-size: 12px;
`;

export default function ToolbarPlugin({
  id = '',
  toolList = {},
  isCanUndo,
  isCanRedo,
  alignMenuAnchor = {},
  setAlignMenuAnchor = () => {},
  canCreateEndnote = false,
  currentEndnote = null,
  tableCreatorAnchor = {},
  setTableCreatorAnchor = () => {},
  editorId,
  setShowAddContentModal,
  setShowAddEndnoteModal,
  minToolBarDefault,
}) {
  const [editor] = useLexicalComposerContext();
  const toolBarRef = useRef(null);
  const alignMenuRef = useRef(null);
  const tableCreatorRef = useRef(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showToolBar, setShowToolBar] = useState(false);
  const [curBtnList, setCurBtnList] = useState([toolList.leftSide, toolList.rightSide]);
  const [dynamicPosition, setDynamicPosition] = useState({ vertical: 'bottom', horizontal: 'left' });

  const alignMenuOpen = Boolean(alignMenuAnchor);

  const calculateSpace = (ref) => {
    const rect = ref?.current?.getBoundingClientRect();
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

  const handleTableCreatorOpen = () => {
    calculateSpace(tableCreatorRef);
    setTableCreatorAnchor(tableCreatorRef.current);
  };

  const handleTableCreatorClose = () => setTableCreatorAnchor(null);

  const dispatchAction = (command, name = undefined) => {
    handleAlignMenuClose();
    editor.dispatchCommand(command, name);
  };

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
  console.log('ToolbarPlugin - handleEndnoteAction called:', { currentEndnote, canCreateEndnote });
  
  // Ensure toolbar stays open when opening endnote modal
  if (currentEndnote) {
    console.log('ToolbarPlugin - Opening modal for existing endnote');
    setShowAddEndnoteModal(true);
  } else if (canCreateEndnote) {
    console.log('ToolbarPlugin - Opening modal for new endnote');
    setShowAddEndnoteModal(true);
  } else {
    console.log('ToolbarPlugin - Cannot create or edit endnote');
  }
};

  const alignBtns = {
    alignleft: {
      id: 'alignleft',
      label: 'Align Left',
      title: 'Align Left',
      icon: <JustifyLeft />,
      action: () => dispatchAction(FORMAT_ELEMENT_COMMAND, 'left'),
    },
    aligncenter: {
      id: 'aligncenter',
      label: 'Align Center',
      title: 'Align Center',
      icon: <TextCenter />,
      action: () => dispatchAction(FORMAT_ELEMENT_COMMAND, 'center'),
    },
    alignright: {
      id: 'alignright',
      label: 'Align Right',
      title: 'Align Right',
      icon: <JustifyRight />,
      action: () => dispatchAction(FORMAT_ELEMENT_COMMAND, 'right'),
    },
    alignjustify: {
      id: 'alignjustify',
      label: 'Justify',
      title: 'Justify',
      icon: <Justify />,
      action: () => dispatchAction(FORMAT_ELEMENT_COMMAND, 'justify'),
    },
  };

  const toolBarBtns = {
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
    bullist: {
      id: 'bullist',
      title: 'Bulleted List',
      ariaLabel: 'Bulleted List',
      icon: <ListUl />,
      action: () => dispatchAction(INSERT_UNORDERED_LIST_COMMAND, undefined),
    },
    numlist: {
      id: 'numlist',
      title: 'Numbered List',
      ariaLabel: 'Numbered List',
      icon: <ListOl />,
      action: () => dispatchAction(INSERT_ORDERED_LIST_COMMAND, undefined),
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
    endnote: {
      id: 'endnote',
      title: currentEndnote ? 'Edit Endnote' : 'Add Endnote',
      ariaLabel: currentEndnote ? 'Edit Endnote' : 'Add Endnote',
      readonly: !canCreateEndnote && !currentEndnote,
      icon: <Journal />,
      action: handleEndnoteAction,
    },
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    setCurBtnList(showToolBar || !minToolBarDefault ? [toolList.leftSide, toolList.rightSide] : []);
  }, [toolList]);

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
    [editor, updateToolbar]
  );

  const styledBtnSize = `${minToolBarDefault ? 24 : 18}px`;

  return (
    <ToolBarContainer ref={toolBarRef} id={id}>
      <GeneralContainer>
        {curBtnList[0]?.map((name) => (
          <GeneralContainer key={`${editorId}Menu${name}`}>
            <StyledBtn
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

            {name === 'alignMenu' && (
              <>
                {!alignMenuAnchor && <ChevronDown onClick={toolBarBtns.alignMenu.action} color="#ffffff" size="10" />}
                {alignMenuAnchor && <ChevronUp onClick={toolBarBtns.alignMenu.action} color="#ffffff" size="10" />}
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
          list: { sx: { padding: '0px' } },
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
        {Object.keys(alignBtns)?.map((name) => (
          <StyledMenuItem onClick={alignBtns[name].action} key={name}>
            <MenuBtn id={alignBtns[name].id} title={alignBtns[name].title}>
              {alignBtns[name].icon}
            </MenuBtn>

            <AlignLabel>{alignBtns[name].label}</AlignLabel>
          </StyledMenuItem>
        ))}
      </Menu>

      <GeneralContainer>
        {curBtnList[1]?.map((name) => (
          <React.Fragment key={name}>
            <StyledBtn
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
        ))}

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
  alignMenuAnchor: PropTypes.shape({}),
  setAlignMenuAnchor: PropTypes.func,
  tableCreatorAnchor: PropTypes.shape({}),
  setTableCreatorAnchor: PropTypes.func,
  canCreateEndnote: PropTypes.bool,
  currentEndnote: PropTypes.shape({}),
  minToolBarDefault: PropTypes.bool.isRequired,
};
