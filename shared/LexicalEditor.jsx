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
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import PropTypes from 'prop-types';

import AddContentModal from './AddContentModal/AddContentModal';
import AddEndnoteModal from './AddEndnoteModal';
import { useDataContext } from '../DataContext';
import DefaultHtmlValuePlugin from './DefaultHtmlValuePlugin';
import { useEndnotePlugin } from './EndnotePlugin';
import applyListNodePatch from './letterEditor/nodes/ListNodePatch';
import { cleanLexicalHtml, editorConfig, exportLexicalHtml, importLexicalHtml } from './lexicalUtil';
import { publishIssues, setEligible } from './plugins/spellChecker/SpellCheckBus';
import { SpellCheckProvider, useSpellCheckContext } from './plugins/spellChecker/SpellCheckContext';
import { SpellCheckPlugin } from './plugins/spellChecker/SpellCheckPlugin';
import './plugins/spellChecker/SpellCheckPlugin.css';
import SourceCodePlugin from './SourceCodePlugin';
import './styles/styles.css';
import './styles/tables.css';
import './styles/typeahead.css';
import TableActionPlugin from './tableActions/TableActionPlugin';
import TableAttributeHandler from './TableAttributeHandler';
import './tableNodePatches';
import TableWidthSeedPlugin from './TableWidthSeedPlugin';
import ToolbarPlugin from './ToolbarPlugin';
import TreeViewPlugin from './TreeViewPlugin';
import WingButton from './WingButton';
import { useFeatureFlags } from '../../../../admin/flag/hooks/FeatureFlagsProvider';
import '../../../Letter.css';
import { convertInchesToPixels } from '../../../LetterUtil';

// replace top with :has selector https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has
const Wing = styled.div`
  position: absolute;
  top: 0px;
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
  padding: 0.5em;
  border: ${(props) => (props.editable ? '1px solid black' : '1px dashed black')};
  font-feature-settings:
    'liga' off,
    'dlig' off,
    'hlig' off,
    'rlig' off;
`;

const SpellCheckerSrOnly = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// Constants
const CONTENT_EDITABLE_PREFIX = 'content-editable-';
const PARENT_LEXICAL_ID_ATTRIBUTE = 'data-parent-lexical-id';

export const generateParentLexicalIdAttribute = (editor) => ({
  [PARENT_LEXICAL_ID_ATTRIBUTE]: editor.getRootElement().getAttribute('id'),
});

applyListNodePatch();

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
  isFullscreen,
  toggleFullscreen,
  forAdmin,
  initialToolbarActive = false,
}) {
  const [lexicalEditor] = useLexicalComposerContext();
  const [isToolbarActive, setIsToolbarActive] = useState(initialToolbarActive);
  const [isEditorActive, setIsEditorActive] = useState(initialToolbarActive);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAddEndnoteModal, setShowAddEndnoteModal] = useState(false);
  const [alignMenuAnchor, setAlignMenuAnchor] = useState(null);
  const [tableCreatorAnchor, setTableCreatorAnchor] = useState(null);
  const [blockTypeMenuAnchor, setBlockTypeMenuAnchor] = useState(null);
  const [listMenuAnchor, setListMenuAnchor] = useState(null);
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState(null);
  const [clipboardMenuAnchor, setClipboardMenuAnchor] = useState(null);
  const [characterMenuAnchor, setCharacterMenuAnchor] = useState(null);

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
  const { hasFlag } = useFeatureFlags();

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
    if (!lexicalEditor) return;

    // ENTER
    if (!isSourceCodeView) {
      lexicalEditor.getEditorState().read(() => {
        const serialized = exportLexicalHtml(lexicalEditor, { includePdfCss: false });
        const cleanHtml = cleanLexicalHtml(serialized);
        setSourceCodeHtml(cleanHtml);
        setSourceError(null);
      });

      setIsSourceCodeView(true);
      return;
    }

    // EXIT
    try {
      let htmlToImport = (sourceCodeHtml || '').trim();

      if (!htmlToImport || htmlToImport === '<p><br/></p>' || htmlToImport === '<p><br></p>') {
        htmlToImport = '<p></p>';
      } else {
        htmlToImport = wrapLooseText(htmlToImport);
      }

      importLexicalHtml(lexicalEditor, htmlToImport);

      setIsSourceCodeView(false);
      setSourceError(null);

      // Let parent know editor state changed after import
      if (onChange) {
        // next tick is safest so import update lands first
        const nextTick = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 0));

        nextTick(() => onChange(lexicalEditor.getEditorState(), lexicalEditor));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('ERROR during import:', err);
      setSourceError(err?.message || "We couldn't apply your HTML. Please check for invalid tags/structure and try again.");
    }
  }, [isSourceCodeView, lexicalEditor, sourceCodeHtml, onChange]);

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
        listMenuAnchor ||
        clipboardMenuAnchor ||
        historyMenuAnchor ||
        characterMenuAnchor ||
        target?.closest('.table-actions-dropdown') ||
        target?.closest('.editor-wing') ||
        target?.closest('.spellcheck-popup')
      );
    },
    [
      characterMenuAnchor,
      clipboardMenuAnchor,
      historyMenuAnchor,
      showAddEndnoteModal,
      showAddContentModal,
      alignMenuAnchor,
      tableCreatorAnchor,
      blockTypeMenuAnchor,
      listMenuAnchor,
    ]
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
      if (isFullscreen) {
        // Disable the keydown handler when in fullscreen mode
        return;
      }

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
    [isFullscreen, toggleToolbarFocus, setIsToolbarActive, setIsEditorActive]
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
  const [htmlLoaded, setHtmlLoaded] = useState(false);
  const handleHtmlReady = useCallback(() => setHtmlLoaded(true), []);

  useEffect(() => {
    if (htmlLoaded) {
      showVariableValues();
    }
  }, [htmlLoaded]);

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

  // Refresh SpellChecker Modal and Sidebar on Editor change/deletion/addition
  useEffect(() => {
    setEligible(editorId, !!editable);

    return () => {
      setEligible(editorId, false);
      publishIssues(editorId, []); // push changes to sidebar
    };
  }, [editorId, editable, hasFlag]);

  return (
    <>
      {!type?.includes('4admin') && (
        <LeftWing className="editor-wing" unHide={sectionOpen?.showWings} clicked={isToolbarActive && editable}>
          <WingButton
            isDisabled={!editable}
            action={(e) => {
              // Stop propagation so this click doesn't trigger the parent onFocus
              if (e && e.stopPropagation) e.stopPropagation();
              setIsToolbarActive(!isToolbarActive);
            }}
            type="Format Text"
          />
          <WingButton isDisabled={type === 'startsEnds'} action={() => deleteConfirmation(section?.frontEndId)} type="Delete Paragraph Text" />
        </LeftWing>
      )}

      <SpellCheckProvider>
        <LexicalEditorInnerWithSpellcheck
          setIsToolbarActive={setIsToolbarActive}
          setIsEditorActive={setIsEditorActive}
          isTargetInsideOfEditor={isTargetInsideOfEditor}
          showVariableValues={showVariableValues}
        />

        <EditorContainer
          className="lexical-editor-container"
          id={id}
          onFocus={() => {
            setIsEditorActive(true);
            if (!isToolbarActive) {
              setIsToolbarActive(true);
            }
          }}
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
              characterMenuAnchor={characterMenuAnchor}
              setCharacterMenuAnchor={setCharacterMenuAnchor}
              historyMenuAnchor={historyMenuAnchor}
              setHistoryMenuAnchor={setHistoryMenuAnchor}
              clipboardMenuAnchor={clipboardMenuAnchor}
              setClipboardMenuAnchor={setClipboardMenuAnchor}
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
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              forAdmin={forAdmin}
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
            <DefaultHtmlValuePlugin initialValue={initialValue} onChange={onChange} disabled={isSourceCodeView} onReady={handleHtmlReady} />

            <TableAttributeHandler disabled={isSourceCodeView} />
            <TableWidthSeedPlugin disabled={isSourceCodeView} />

            {/* Only show the rest when not in source view */}
            {!isSourceCodeView && (
              <>
                <TablePlugin hasCellMerge hasCellBackgroundColor={false} />
                {editorReady && <TableActionPlugin />}
                {lexicalPlugins.map((lexicalPlugin) => lexicalPlugin)}
                <HistoryPlugin />
                {false && <TreeViewPlugin />}
                <ListPlugin />
                <HorizontalRulePlugin />
                {hasFlag('endnotes') && (
                  <EndnotePluginWrapper
                    handleSetSelectedText={handleSetSelectedText}
                    handleSetCanCreateEndnote={handleSetCanCreateEndnote}
                    handleSetCurrentEndnote={handleSetCurrentEndnote}
                  />
                )}
                <SpellCheckPlugin editorId={editorId} type={type} isToolbarActive={isToolbarActive} />
              </>
            )}
          </TextEditorArea>
        </EditorContainer>
        <LexicalEditorInnerWithSpellCheckAriaLive />
      </SpellCheckProvider>

      {!type?.includes('4admin') && (
        <RightWing className="editor-wing" unHide={sectionOpen?.showWings}>
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

// closeSpellcheckPopup needs to be inside handleFocusOutside AND a child of SpellCheckProvider
function LexicalEditorInnerWithSpellcheck(props) {
  const { closeSpellcheckPopup } = useSpellCheckContext();
  const showVariableValuesRef = useRef(props.showVariableValues);

  useEffect(() => {
    showVariableValuesRef.current = props.showVariableValues;
  }, [props.showVariableValues]);

  useEffect(() => {
    const handleFocusOutside = (event) => {
      if (event.type !== 'mousedown') return;

      if (!props.isTargetInsideOfEditor(event.target)) {
        props.setIsToolbarActive(false);
        props.setIsEditorActive(false);
        closeSpellcheckPopup();

        if (showVariableValuesRef.current) showVariableValuesRef.current();
      }
    };

    document.addEventListener('mousedown', handleFocusOutside);
    return () => document.removeEventListener('mousedown', handleFocusOutside);
  }, [props.isTargetInsideOfEditor, closeSpellcheckPopup]);
}

// Aria-Live region needs to be outside SpellCheckerPluginPopup.jsx but inside a child of SpellCheckProvider
export function LexicalEditorInnerWithSpellCheckAriaLive() {
  const { issues } = useSpellCheckContext();

  // Find the latest issue node by highest nodeKey
  const latestIssue = issues.reduce((latest, current) => (Number(current.nodeKey) > Number(latest.nodeKey) ? current : latest), issues[0]);

  // Determine display type
  const displayType = latestIssue && latestIssue.issueType === 'misspelling' ? 'spelling' : 'grammar';

  return (
    <>
      <SpellCheckerSrOnly aria-live="polite" aria-atomic="true">
        {issues.length > 0
          ? `Spelling/Grammar: ${issues.length} issue${issues.length === 1 ? '' : 's'} remaining.`
          : 'All spelling/grammar errors have been resolved.'}
      </SpellCheckerSrOnly>
      <SpellCheckerSrOnly aria-live="polite" aria-atomic="true">
        {latestIssue ? `new ${displayType} error: ${latestIssue.originalText}` : ''}
      </SpellCheckerSrOnly>
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
  isFullscreen,
  toggleFullscreen,
  forAdmin = false,
  initialToolbarActive = false,
}) {
  const composerConfig = useMemo(() => {
    const baseNodes = editorConfig?.nodes || [];

    const filteredNodes = baseNodes.filter((node) => node !== TableNode && node !== TableCellNode && node !== TableRowNode);

    const { heading, ...cleanTheme } = editorConfig?.theme || {};

    return {
      ...editorConfig,
      nodes: [...filteredNodes, TableNode, TableCellNode, TableRowNode],
      theme: cleanTheme,
      editable,
    };
  }, [editable]);

  return (
    <div onFocus={() => showWings(id)} onMouseDown={() => showWings(id)}>
      <LexicalComposer initialConfig={composerConfig}>
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
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          forAdmin={forAdmin}
          initialToolbarActive={initialToolbarActive}
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
  isFullscreen: PropTypes.bool,
  toggleFullscreen: PropTypes.func,
};
