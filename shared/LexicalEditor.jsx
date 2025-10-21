/* eslint-disable no-shadow */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableNode } from '@lexical/table';
import PropTypes from 'prop-types';

import AddContentModal from './AddContentModal';
import AddEndnoteModal from './AddEndnoteModal';
import { useDataContext } from '../DataContext';
import DefaultHtmlValuePlugin from './DefaultHtmlValuePlugin';
import { useEndnotePlugin } from './EndnotePlugin';
import { cleanLexicalHtml, editorConfig, exportLexicalHtml, importLexicalHtml } from './lexicalUtil';
import { setEligible } from './plugins/spellChecker/SpellCheckBus';
import { SpellCheckPlugin } from './plugins/spellChecker/SpellCheckPlugin';
import './plugins/spellChecker/SpellCheckPlugin.css';
import SourceCodePlugin from './SourceCodePlugin';
import './styles/styles.css';
import './styles/tables.css';
import './styles/typeahead.css';
import TableActionPlugin from './tableActions/TableActionPlugin';
import ToolbarPlugin from './ToolbarPlugin';
import TreeViewPlugin from './TreeViewPlugin';
import WingButton from './WingButton';
import { useFeatureFlags } from '../../../../admin/flag/FeatureFlagsProvider';
import '../../../Letter.css';

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

// Inner component that has access to Lexical context
function LexicalEditorInner({
  type,
  id,
  sectionOpen,
  onChange,
  initialValue,
  editorRefAssignmentFunction,
  showVariableValues,
  lexicalPlugins,
  editable,
  ariaLabel,
  deleteConfirmation,
  section,
  toolList,
}) {
  const [lexicalEditor] = useLexicalComposerContext();
  const [isToolbarActive, setIsToolbarActive] = useState(false);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddEndnoteModal, setShowAddEndnoteModal] = useState(false);
  const [alignMenuAnchor, setAlignMenuAnchor] = useState(null);
  const [tableCreatorAnchor, setTableCreatorAnchor] = useState(null);
  const [blockTypeMenuAnchor, setBlockTypeMenuAnchor] = useState(null);
  const [listMenuAnchor, setListMenuAnchor] = useState(null);

  const [focusSectionMenuIndex, setFocusSectionMenuIndex] = useState(-1);
  const { draftState, setDraftState } = useDataContext();

  const [, setSelectedText] = useState('');
  const [canCreateEndnote, setCanCreateEndnote] = useState(false);
  const [currentEndnote, setCurrentEndnote] = useState(null);

  const [editorReady, setEditorReady] = useState(false);
  const [isSourceCodeView, setIsSourceCodeView] = useState(false);
  const [sourceCodeHtml, setSourceCodeHtml] = useState('');
  const [sourceError, setSourceError] = useState(null);

  const editorRef = useRef(null);
  const { featureFlags, hasFlag } = useFeatureFlags();

  // Refs
  const containerRef = useRef(null);
  const focusRef508 = useRef(null);
  const sourceCodeHtmlRef = useRef('');

  const handleSetSelectedText = useCallback((activeText) => {
    setSelectedText(activeText);
  }, []);

  const handleSetCanCreateEndnote = useCallback((canCreate) => {
    setCanCreateEndnote(canCreate);
  }, []);

  const handleSetCurrentEndnote = useCallback((endnoteNode) => {
    setCurrentEndnote(endnoteNode);
  }, []);

  const handleSourceCodeHtmlChange = useCallback((newHtml) => {
    setSourceCodeHtml(newHtml);
    sourceCodeHtmlRef.current = newHtml;
    setSourceError(null);
  }, []);

  const wrapLooseText = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Process all child nodes of body
    const { body } = doc;
    const children = Array.from(body.childNodes);
    children.forEach((node) => {
      // If it's a text node with actual content (not just whitespace)
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = doc.createElement('p');
        p.textContent = node.textContent.trim();
        body.replaceChild(p, node);
      }
    });
    return body.innerHTML;
  };

  const toggleSourceCodeView = useCallback(() => {
    if (!isSourceCodeView) {
      if (lexicalEditor) {
        lexicalEditor.getEditorState().read(() => {
          const serialized = exportLexicalHtml(lexicalEditor);

          const cleanHtml = cleanLexicalHtml(serialized);
          setSourceCodeHtml(cleanHtml);
          sourceCodeHtmlRef.current = cleanHtml;
        });
      }
      setIsSourceCodeView(true);
      return;
    }

    if (!lexicalEditor) return;

    try {
      let htmlToImport = sourceCodeHtmlRef.current?.trim() || '';
      // If completely empty, create an empty paragraph
      if (!htmlToImport || htmlToImport === '<p><br/></p>' || htmlToImport === '<p><br></p>') {
        htmlToImport = '<p></p>';
      } else {
        // Wrap any loose text in paragraphs
        htmlToImport = wrapLooseText(htmlToImport);
      }

      importLexicalHtml(lexicalEditor, htmlToImport);

      setSourceError(null);
      setIsSourceCodeView(false);
    } catch (err) {
      console.error('ERROR during import:', err);
      setSourceError('We couldnt apply your HTML. Please check for invalid tags/structure and try again.');
    }
  }, [isSourceCodeView, lexicalEditor]);

  // Add event listener for endnote click events
  useEffect(() => {
    const handleEndnoteModalShow = (event) => {
      const { id, text, value } = event.detail;
      setCurrentEndnote({
        getEndnoteId: () => id,
        getTextContent: () => text,
        getEndnoteValue: () => value,
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
        tableCreatorAnchor ||
        blockTypeMenuAnchor ||
        listMenuAnchor
      );
    },
    [showAddEndnoteModal, showAddContentModal, alignMenuAnchor, tableCreatorAnchor, blockTypeMenuAnchor, listMenuAnchor]
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
    [toggleToolbarFocus]
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

  // Event Handlers
  const handleUndo = useCallback(() => {}, []);
  const handleRedo = useCallback(() => {}, []);

  const blurCheck = useCallback(
    (ev) => {
      if (isTargetInsideOfEditor(ev.type === 'mousedown' ? ev.target : ev.relatedTarget)) return;
      showVariableValues();
    },
    [showVariableValues, isTargetInsideOfEditor]
  );

  const editorId = `editor-${id ?? '1'}`;

  useEffect(() => {
    setEligible(editorId, featureFlags && hasFlag(featureFlags, 'spell_check') && !!editable);
  }, [editorId, editable, hasFlag, featureFlags]);

  return (
    <>
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
            blockTypeMenuAnchor={blockTypeMenuAnchor}
            setBlockTypeMenuAnchor={setBlockTypeMenuAnchor}
            listMenuAnchor={listMenuAnchor}
            setListMenuAnchor={setListMenuAnchor}
            minToolBarDefault={!!type.includes('4admin')}
            isSourceCodeView={isSourceCodeView}
            toggleSourceCodeView={toggleSourceCodeView}
          />
        ) : null}

        <TextEditorArea editable={editable} id="editor-container" className="tree-view">
          {isSourceCodeView ? (
            <SourceCodePlugin
              isSourceCodeView={isSourceCodeView}
              onHtmlChange={handleSourceCodeHtmlChange}
              initialHtml={isSourceCodeView ? sourceCodeHtml : ''}
              error={sourceError}
              onExitShortcut={toggleSourceCodeView}
            />
          ) : (
            <RichTextPlugin
              ErrorBoundary={LexicalErrorBoundary}
              contentEditable={
                <div className="lexical-editor-inner" ref={editorRef}>
                  <ContentEditable
                    ariaLabel={ariaLabel}
                    spellCheck={false}
                    className={`lexical-editor-input ${editable ? '' : 'lexical-readonly'}`}
                    id={CONTENT_EDITABLE_PREFIX + id}
                  />
                </div>
              }
            />
          )}

          {/* Always mounted so they don't re-hydrate on toggle */}
          <OnChangePlugin onChange={onChange} />
          <DefaultHtmlValuePlugin initialValue={initialValue} onChange={onChange} disabled={isSourceCodeView} />

          {/* Only show the rest when not in source view */}
          {!isSourceCodeView && (
            <>
              <TablePlugin />
              {editorReady && <TableActionPlugin />}
              {lexicalPlugins.map((lexicalPlugin) => lexicalPlugin)}
              <HistoryPlugin />
              {false && <TreeViewPlugin />}
              <ListPlugin />
              <HorizontalRulePlugin />
              {featureFlags && hasFlag(featureFlags, 'endnotes') && (
                <EndnotePluginWrapper
                  handleSetSelectedText={handleSetSelectedText}
                  handleSetCanCreateEndnote={handleSetCanCreateEndnote}
                  handleSetCurrentEndnote={handleSetCurrentEndnote}
                />
              )}
              {featureFlags && hasFlag(featureFlags, 'spell_check') && <SpellCheckPlugin editorId={editorId} />}
            </>
          )}
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
      <AddEndnoteModal showAddEndnoteModal={showAddEndnoteModal} setShowAddEndnoteModal={setShowAddEndnoteModal} currentEndnote={currentEndnote} />
    </>
  );
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
  const themeWhitoutHeadings = useMemo(() => {
    const base = editorConfig?.theme ?? {};
    const { heading, ...rest } = base;
    return rest;
  }, []);

  return (
    <div onFocus={() => showWings(id)} onMouseDown={() => showWings(id)}>
      <LexicalComposer initialConfig={{ ...editorConfig, theme: themeWhitoutHeadings, editable }}>
        <LexicalEditorInner
          type={type}
          id={id}
          sectionOpen={sectionOpen}
          onChange={onChange}
          initialValue={initialValue}
          editorRefAssignmentFunction={editorRefAssignmentFunction}
          showVariableValues={showVariableValues}
          lexicalPlugins={lexicalPlugins}
          editable={editable}
          ariaLabel={ariaLabel}
          deleteConfirmation={deleteConfirmation}
          section={section}
          toolList={toolList}
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
  sectionOpen: PropTypes.shape({ showWings: PropTypes.bool }),
};
