import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
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
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import * as React from 'react';
import FontSizeWidget from './FontSizeWidget';
import TablePlugin from './TablePlugin';

function ToolbarButton({
  classes = '',
  disabled = false, ...props
}) {
  const {
    id, ariaLabel, onClick, iconName,
  } = props;
  return (
    <button
      type="button"
      id={id}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => onClick()}
      disabled={disabled}
      className={`toolbar-item spaced ${classes}`}
    >
      <i className={`format ${iconName}`} />
    </button>
  );
}

ToolbarButton.propTypes = {
  id: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  classes: PropTypes.string,
  disabled: PropTypes.bool,
  iconName: PropTypes.string.isRequired,
};

export default function ToolbarPlugin({
  id = '',
  toolList = '',
  showToolbar = false,
  isCanUndo,
  isCanRedo,
  editorId, customTools = [],
}) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isTablePoppedUp, setIsTablePoppedUp] = useState(false);


  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  const toolbarNameButtonMap = {
    fontcase: <ToolbarButton
    id="font-case"
    ariaLabel="font-case"
    classes={isBold ? 'active' : ''}
    iconName="font-case"
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'font-case')}
  />,
    horizontalrule: <ToolbarButton
    id="horizontal-rule"
    ariaLabel="horizontal-rule"
    classes={isBold ? 'active' : ''}
    iconName="horizontal-rule"
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'horizontal-rule')}
  />,
    maximize: <ToolbarButton
    id="maximize"
    ariaLabel="maximize"
    classes={isBold ? 'active' : ''}
    iconName="maximize"
    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'maximize')}
  />,
  footnote: <ToolbarButton
  id="footnote"
  ariaLabel="Add Footnote"
  classes={isBold ? 'active' : ''}
  iconName="footnote"
  onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'footnote')}
/>,
  source: <ToolbarButton
  id="source"
  ariaLabel="View Source"
  classes={isBold ? 'active' : ''}
  iconName="source"
  onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'source')}
/>,
  pasteword: <ToolbarButton
  id="pasteword"
  ariaLabel="Paste From Word"
  classes={isBold ? 'active' : ''}
  iconName="pasteword"
  onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'pasteword')}
/>,
    spellcheck: <ToolbarButton
      id="spellcheck"
      ariaLabel="Check Spelling"
      classes={isBold ? 'active' : ''}
      iconName="spellcheck"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'spellcheck')}
    />,
    bold: <ToolbarButton
      id="formatbold"
      ariaLabel="Format Bold"
      classes={isBold ? 'active' : ''}
      iconName="bold"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
    />,
    italic: <ToolbarButton
      id="formatitalics"
      ariaLabel="Format Italics"
      classes={isItalic ? 'active' : ''}
      iconName="italic"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
    />,
    subscript: <ToolbarButton
      id="formatsubscript"
      ariaLabel="Format Subscript"
      classes={isSubscript ? 'active' : ''}
      iconName="subscript"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
    />,
    superscript: <ToolbarButton
      id="formatsuperscript"
      ariaLabel="Format Superscript"
      classes={isSuperscript ? 'active' : ''}
      iconName="superscript"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
    />,
    underline: <ToolbarButton
      id="formatunderline"
      ariaLabel="Format Underline"
      classes={isUnderline ? 'active' : ''}
      iconName="underline"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
    />,
    alignleft: <ToolbarButton
      id="alignleft"
      ariaLabel="Left Align"
      iconName="left-align"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
    />,
    aligncenter: <ToolbarButton
      id="aligncenter"
      ariaLabel="Center Align"
      iconName="center-align"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
    />,
    alignright: <ToolbarButton
      id="alignright"
      ariaLabel="Right Align"
      iconName="right-align"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
    />,
    alignjustify: <ToolbarButton
      id="justifyalign"
      ariaLabel="Justify Align"
      iconName="justify-align"
      onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
    />,
    bullist: <ToolbarButton
      id="bulletedlist"
      ariaLabel="Bulleted List"
      iconName="bulleted-list"
      onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
    />,
    numlist: <ToolbarButton
      id="numberedlist"
      ariaLabel="Numbered List"
      iconName="numbered-list"
      onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
    />,
    outdent: <ToolbarButton
      id="outdent"
      ariaLabel="Outdent"
      iconName="outdent"
      onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
    />,
    indent: <ToolbarButton
      id="indent"
      ariaLabel="Indent"
      iconName="indent"
      onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
    />,
    table:
  <div id="lexical-table-icon" className="lexical-table-popup-container">
    <ToolbarButton
      ariaLabel="Insert Table"
      iconName="create-table"
      onClick={() => setIsTablePoppedUp(true)}
    />
    {isTablePoppedUp && (
    <TablePlugin isTablePoppedUp={isTablePoppedUp} setIsTablePoppedUp={setIsTablePoppedUp} />
    )}
  </div>,
    undo: <ToolbarButton
      id="undo"
      ariaLabel="Undo"
      iconName="undo"
      disabled={!canUndo}
      onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
    />,
    redo: <ToolbarButton
      id="redo"
      ariaLabel="Redo"
      iconName="redo"
      disabled={!canRedo}
      onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
    />,
    copy: <ToolbarButton
      id="copy"
      ariaLabel="Copy"
      iconName="clipboard"
      onClick={() => editor.dispatchCommand(COPY_COMMAND, null)}
    />,
    paste: <ToolbarButton
      id="paste"
      ariaLabel="Paste"
      iconName="paste"
      onClick={() => {
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
          const event = new ClipboardEvent('paste', {
            clipboardData: data,
          });
          editor.dispatchCommand(PASTE_COMMAND, event);
        });
      }}
    />,
    cut: <ToolbarButton
      id="cut"
      ariaLabel="Cut"
      iconName="cut"
      onClick={() => editor.dispatchCommand(CUT_COMMAND, null)}
    />,
    fontSize: <FontSizeWidget />,
  };

  const buildToolbarButton = (name) => {
    const buttonComponent = toolbarNameButtonMap[name];
    if (buttonComponent) {
      return buttonComponent;
    }
    const customToolConfig = customTools.find((customTool) => name === customTool.name);
    if (!customToolConfig) return null;
    return (
      <ToolbarButton
        ariaLabel={customToolConfig.buttonTitle}
        iconName={customToolConfig.buttonIcon}
        onClick={() => customToolConfig.onClick(editor)}
      />
    );
  };

  const toolbarList = () => toolList.trim().split(/\s+/);

  useEffect(() => mergeRegister(
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    }),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (/* _payload, newEditor */) => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        isCanUndo(payload);
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        isCanRedo(payload);
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
  ), [editor, updateToolbar]);

  return (
    <>
      <div className="toolbar" id={id} ref={toolbarRef}>
        {toolbarList().map((toolbarNameOption) => (
          <React.Fragment key={`${editorId}Menu${toolbarNameOption}`}>
            {buildToolbarButton(toolbarNameOption)}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export const customToolProps = PropTypes.arrayOf(PropTypes.shape({
  buttonIcon: PropTypes.string.isRequired,
  buttonTitle: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}));

ToolbarPlugin.propTypes = {
  id: PropTypes.string,
  editorId: PropTypes.string.isRequired,
  toolList: PropTypes.string,
  isCanUndo: PropTypes.func.isRequired,
  isCanRedo: PropTypes.func.isRequired,
  showToolbar: PropTypes.bool,
  customTools: customToolProps,
};