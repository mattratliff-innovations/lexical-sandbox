/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TableNode } from '@lexical/table';
import styled from '@emotion/styled';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import PropTypes from 'prop-types';
import TableAlignmentHandler from './TableAlignmentHandler';
import DefaultHtmlValuePlugin from './DefaultHtmlValuePlugin';
import ToolbarPlugin from './ToolbarPlugin';
import { useDataContext } from '../DataContext';
import TreeViewPlugin from './TreeViewPlugin';
import { editorConfig } from './lexicalUtil';
import TableActionPlugin from './tableActions/TableActionPlugin';
import WingButton from './WingButton';
import AddContentModal from './AddContentModal';
import '../../../Letter.css';
import './styles/styles.css';
import './styles/tables.css';
import './styles/typeahead.css';
import AddEndnoteModal from './AddEndnoteModal';
import { useEndnotePlugin } from './EndnotePlugin';

const Wing = styled.div`
  position: absolute;
  top: ${(props) => (props.clicked ? '28px' : '0px')};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: #707070;
  min-height: 50px;
  width: 36px;
  opacity: ${(props) => (props.unHide ? 1 : 0)};
`;

const LeftWing = styled(Wing)`
  left: -35px;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
`;

const RightWing = styled(Wing)`
  right: -35px;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
`;

const EditorContainer = styled.div`
  margin-bottom: 14px;
  background: ${(props) => (props.editable ? '#eeeeee' : '#ffffff')};
  border-radius: ${(props) => props.toolbarOpen && '10px 10px 0 0'};
`;

const TextEditorArea = styled.div`
  border: ${(props) => (props.editable ? '1px solid black' : '1px dashed black')};
`;

// Constants
const CONTENT_EDITABLE_PREFIX = 'content-editable-';
const PARENT_LEXICAL_ID_ATTRIBUTE = 'data-parent-lexical-id';

export const generateParentLexicalIdAttribute = (editor) => ({
  [PARENT_LEXICAL_ID_ATTRIBUTE]: editor.getRootElement().getAttribute('id'),
});

const originalExportJSON = TableNode.prototype.exportJSON;

TableNode.prototype.exportJSON = () => ({
  ...originalExportJSON.call(this),
  alignment: this.__alignment || 'left',
});

const originalImportJSON = TableNode.importJSON;

TableNode.importJSON = (serializedNode) => {
  const node = originalImportJSON(serializedNode);
  node.__alignment = serializedNode.alignment || 'left';
  return node;
};

function EndnotePluginWrapper({ handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote }) {
  useEndnotePlugin(handleSetSelectedText, handleSetCanCreateEndnote, handleSetCurrentEndnote);
  return null;
}

export default function LexicalEditor({
  toolList = {},
  type = '',
  id,
  sectionOpen = {},
  showWings = () => {},
  onChange = () => {},
  initialValue = '',
  editorRefAssignmentFunction = undefined,
  showVariableValues = () => {},
  lexicalPlugins = [],
  editable = true,
  ariaLabel = '',
  deleteConfirmation = () => {},
  section = {},
}) {
  const [isToolbarActive, setIsToolbarActive] = useState(false);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddEndnoteModal, setShowAddEndnoteModal] = useState(false);
  const [alignMenuAnchor, setAlignMenuAnchor] = useState(null);
  const [tableCreatorAnchor, setTableCreatorAnchor] = useState(null);

  const [focusSectionMenuIndex, setFocusSectionMenuIndex] = useState(-1);
  const { draftState, setDraftState } = useDataContext();

  const [selectedText, setSelectedText] = useState('');
  const [canCreateEndnote, setCanCreateEndnote] = useState(false);
  const [currentEndnote, setCurrentEndnote] = useState(null);

  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef(null);

  // Refs
  const containerRef = useRef(null);
  const focusRef508 = useRef(null);

  const handleSetSelectedText = useCallback((activeText) => {
    setSelectedText(activeText);
  }, []);

  const handleSetCanCreateEndnote = useCallback((canCreate) => {
    setCanCreateEndnote(canCreate);
  }, []);

  const handleSetCurrentEndnote = useCallback((endnoteNode) => {
    setCurrentEndnote(endnoteNode);
  }, []);

  // Add event listener for endnote click events
  useEffect(() => {
    const handleEndnoteModalShow = (event) => {
      const { id, text, value } = event.detail;
      setCurrentEndnote({ 
        getEndnoteId: () => id, 
        getTextContent: () => text, 
        getEndnoteValue: () => value 
      });
      setShowAddEndnoteModal(true);
    };

    document.addEventListener('showEndnoteModal', handleEndnoteModalShow);
    return () => {
      document.removeEventListener('showEndnoteModal', handleEndnoteModalShow);
    };
  }, []);

  // Memoized handlers
  const isTargetInsideOfEditor = useCallback(
    (target) => {
      if (!containerRef.current) return false;

      const lexicalParentId = containerRef.current.getAttribute('id');
      return (
        containerRef.current.contains(target) ||
        target?.closest(`[${PARENT_LEXICAL_ID_ATTRIBUTE}="${CONTENT_EDITABLE_PREFIX + lexicalParentId}"]`) ||
        showAddEndnoteModal ||
        showAddContentModal ||
        alignMenuAnchor ||
        tableCreatorAnchor
      );
    },
    [showAddEndnoteModal, showAddContentModal, alignMenuAnchor, tableCreatorAnchor]
  );

  const toggleToolbarFocus = useCallback(() => {
    if (isEditorActive) {
      setIsToolbarActive(!isToolbarActive);

      if (isToolbarActive && containerRef.current) {
        containerRef.current.querySelector('[class="lexical-editor-input "]')?.focus();
      }
    }
  }, [isEditorActive, isToolbarActive]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault();
        toggleToolbarFocus();
      }

      const isTabWithoutShift = event.key === 'Tab' && !event.shiftKey;

      if (isTabWithoutShift && event.target?.id.includes(CONTENT_EDITABLE_PREFIX)) {
        setIsToolbarActive(false);
        setIsEditorActive(true);
      }
    },
    [canUndo, canRedo, toggleToolbarFocus]
  );

  const swapSections = (oldIndex, newIndex, currentSections) => {
    const oldIndexSection = currentSections[oldIndex];
    const newIndexSection = currentSections[newIndex];

    const nextSections = currentSections.map((item, i) => {
      if (i === oldIndex) return newIndexSection;
      if (i === newIndex) return oldIndexSection;
      return item;
    });

    return nextSections;
  };

  const moveSectionUp = (frontEndId) => {
    setDraftState((currentDraftState) => {
      const oldIndex = currentDraftState.sections.findIndex((item) => item.frontEndId === frontEndId);
      if (oldIndex === 0) return { ...currentDraftState };

      const newIndex = oldIndex - 1;
      const nextSections = swapSections(oldIndex, newIndex, currentDraftState.sections);
      return { ...currentDraftState, sections: nextSections };
    });
  };

  const moveSectionDown = (frontEndId) => {
    setDraftState((currentDraftState) => {
      const oldIndex = currentDraftState.sections.findIndex((item) => item.frontEndId === frontEndId);
      if (oldIndex === currentDraftState.sections.length - 1) return { ...currentDraftState };

      const newIndex = oldIndex + 1;
      const nextSections = swapSections(oldIndex, newIndex, currentDraftState.sections);
      return { ...currentDraftState, sections: nextSections };
    });
  };

  // Effects
  useEffect(() => showVariableValues(), []);

  useEffect(() => {
    const handleFocusOutside = (event) => {
      if (!isTargetInsideOfEditor(event.type === 'mousedown' ? event.target : event.relatedTarget)) {
        setIsToolbarActive(false);
        setIsEditorActive(false);
      }
    };

    document.addEventListener('mousedown', handleFocusOutside);
    return () => document.removeEventListener('mousedown', handleFocusOutside);
  }, [isTargetInsideOfEditor]);

  // This useEffect is for proper focusing on a button as we move sections up and down
  useEffect(() => {
    if (focusSectionMenuIndex < 0) return;

    focusRef508.current.focus();
    setFocusSectionMenuIndex(-1);
  }, [draftState?.sections]);

  useEffect(() => {
    if (editorRef.current) setEditorReady(true);
  }, [editorRef.current]);

  useEffect(() => {
  // Initialize endnote manager when draft state changes
  if (draftState?.endNotes && window.endnoteManager) {
    console.log('LexicalEditor - Initializing endnote manager with draft state:', draftState.endNotes);
    window.endnoteManager.initializeFromLetter({ endNotes: draftState.endNotes });
  }
}, [draftState?.endNotes]);

  // Event Handlers
  const handleUndo = useCallback((undo) => setCanUndo(undo), []);
  const handleRedo = useCallback((redo) => setCanRedo(redo), []);

  const blurCheck = useCallback(
    (ev) => {
      if (isTargetInsideOfEditor(ev.type === 'mousedown' ? ev.target : ev.relatedTarget)) return;
      showVariableValues();
    },
    [showVariableValues, isTargetInsideOfEditor]
  );

  return (
    <div onFocus={() => showWings(id)} onMouseDown={() => showWings(id)}>
      <LexicalComposer initialConfig={{ ...editorConfig, editable }}>
        {!type?.includes('4admin') && (
          <LeftWing unHide={sectionOpen?.showWings} clicked={isToolbarActive}>
            <WingButton isDisabled={!editable} action={() => setIsToolbarActive(!isToolbarActive)} type="Format Text" />

            <WingButton isDisabled={type === 'startsEnds'} action={() => deleteConfirmation(section?.frontEndId)} type="Delete Paragraph Text" />
          </LeftWing>
        )}

        <EditorContainer
          className="lexical-editor-container"
          id={id}
          onFocus={() => setIsEditorActive(true)}
          onMouseDown={() => setIsEditorActive(true)}
          onKeyDown={handleKeyDown}
          toolbarOpen={isToolbarActive}
          onBlur={blurCheck}
          ref={containerRef}>
          {editorRefAssignmentFunction && <EditorRefPlugin editorRef={editorRefAssignmentFunction} />}

          {type.includes('4admin') || (editable && isToolbarActive) ? (
            <ToolbarPlugin
              id={`lexical-toolbar-${id}`}
              toolList={toolList}
              setShowAddContentModal={setShowAddContentModal}
              showAddContentModal={showAddContentModal}
              setShowAddEndnoteModal={setShowAddEndnoteModal}
              showAddEndnoteModal={showAddEndnoteModal}
              isCanUndo={handleUndo}
              isCanRedo={handleRedo}
              editorId={id}
              alignMenuAnchor={alignMenuAnchor}
              setAlignMenuAnchor={setAlignMenuAnchor}
              canCreateEndnote={canCreateEndnote || !!currentEndnote}
              currentEndnote={currentEndnote}
              tableCreatorAnchor={tableCreatorAnchor}
              setTableCreatorAnchor={setTableCreatorAnchor}
              minToolBarDefault={!!type.includes('4admin')}
            />
          ) : null}

          <TextEditorArea editable={editable} id="editor-container" className="tree-view">
            <RichTextPlugin
              ErrorBoundary={LexicalErrorBoundary}
              contentEditable={
                <div className="lexical-editor-inner" ref={editorRef}>
                  <ContentEditable
                    ariaLabel={ariaLabel}
                    className={`lexical-editor-input ${editable ? '' : 'lexical-readonly'}`}
                    id={CONTENT_EDITABLE_PREFIX + id}
                  />
                </div>
              }
            />

            <TableAlignmentHandler />

            <TablePlugin />
            {editorReady && <TableActionPlugin />}

            {lexicalPlugins.map((lexicalPlugin) => lexicalPlugin)}

            <HistoryPlugin />
            <OnChangePlugin onChange={onChange} />
            <DefaultHtmlValuePlugin initialValue={initialValue} onChange={onChange} />

            {/* change to true for debugging logs lexical */}
            {false && <TreeViewPlugin />}

            <ListPlugin />
            <EndnotePluginWrapper 
              handleSetSelectedText={handleSetSelectedText} 
              handleSetCanCreateEndnote={handleSetCanCreateEndnote}
              handleSetCurrentEndnote={handleSetCurrentEndnote}
            />
          </TextEditorArea>
        </EditorContainer>

        {!type?.includes('4admin') && (
          <RightWing unHide={sectionOpen?.showWings} clicked={isToolbarActive}>
            <WingButton
              isDisabled={draftState.sections.indexOf(section) === 0 || type === 'startsEnds'}
              action={() => moveSectionUp(section?.frontEndId)}
              type="Move Paragraph Up"
              ref={focusRef508}
            />

            <WingButton
              isDisabled={draftState.sections.indexOf(section) === draftState.sections.length - 1 || type === 'startsEnds'}
              action={() => moveSectionDown(section?.frontEndId)}
              type="Move Paragraph Down"
              ref={focusRef508}
            />
          </RightWing>
        )}

        <AddContentModal showAddContentModal={showAddContentModal} setShowAddContentModal={setShowAddContentModal} />
        <AddEndnoteModal 
          showAddEndnoteModal={showAddEndnoteModal} 
          setShowAddEndnoteModal={setShowAddEndnoteModal}
          currentEndnote={currentEndnote}
        />
      </LexicalComposer>
    </div>
  );
}

LexicalEditor.propTypes = {
  toolList: PropTypes.shape({}),
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  onChange: PropTypes.func,
  showVariableValues: PropTypes.func,
  initialValue: PropTypes.string,
  editorRefAssignmentFunction: PropTypes.func,
  showWings: PropTypes.func,
  editable: PropTypes.bool,
  ariaLabel: PropTypes.string,
  lexicalPlugins: PropTypes.arrayOf(PropTypes.shape({})),
  deleteConfirmation: PropTypes.func,
  section: PropTypes.shape({
    frontEndId: PropTypes.string,
    locked: PropTypes.bool,
  }),
  sectionOpen: PropTypes.shape({ showWing: PropTypes.bool }),
};