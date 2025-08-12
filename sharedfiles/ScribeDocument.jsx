/* eslint-disable react/require-default-props */
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Paragraph } from 'react-bootstrap-icons';
import { v4 as uuidv4 } from 'uuid';
import { renderToStaticMarkup } from 'react-dom/server';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { DataContext } from './DataContext';
import ScribeDocumentPropTypes from './ScribeDocumentPropTypes';
import { convertInchesToPixels, generateSignatureContent, findOrganizationSignature } from '../ScribeEditorUtil';
import LexicalEditor from './lexical/LexicalEditor';
import Header from '../../Header';
import ActionButton from '../../../../components/actionButton/ActionButton';
import DefaultModal from '../../../util/DefaultModal';
import VariablePlugin, { showVariableValues, hydrateVariablesHeadlessly } from './lexical/letterEditor/plugins/VariablePlugin';
import { exportLexicalHtml } from './lexical/lexicalUtil';
import './ScribeDocument.css';
import SnippetPlugin from './lexical/letterEditor/plugins/SnippetPlugin';
import { getEnclosuresHtml, getEndNotesHtml, extractEndnotesFromHtml } from '../../LetterUtil';

import { $getRoot, $createTextNode } from 'lexical';
import { $createEndnoteNode } from './lexical/EndnotePlugin';

const EditorSection = styled.div``;

const HEADER_ROW_COL_LIST = ['row1Col1', 'row1Col2', 'row2Col1', 'row2Col2', 'row3Col1', 'row3Col2'];

const ScribeDocument = forwardRef(
  // eslint-disable-next-line react/prop-types
  ({ draft, height = '', setHeight = () => {}, toolList = {}, SignaturePreview, showDocumentHeader = false, useSignature = false }, ref) => {
    const editorsRef = useRef({});
    const [draftState, setDraftState] = useState(draft);
    const [frontEndIdToDelete, setFrontEndIdToDelete] = useState(null);
    const [showSectionDeleteModal, setShowSectionDeleteModal] = useState(false);
    const [organizationSignature, setOrganizationSignature] = useState(null);
    const [openSections, setOpenSections] = useState([]);

    const portraitUsLetterRef = useRef(null);

    const heightCheck = () => {
      const curHeight = portraitUsLetterRef?.current.getBoundingClientRect().height;
      if (curHeight !== height) setHeight(curHeight);
    };

    const showDeleteConfirmationModalForSection = (frontEndId) => {
      setShowSectionDeleteModal(true);
      setFrontEndIdToDelete(frontEndId);
    };

    const contextValue = useMemo(() => ({ draftState, setDraftState }), [draftState, setDraftState]);

    const estimatePrintPages = () => {
      const contentHeight = document.getElementsByClassName('portraitUsLetter')[0]?.scrollHeight;

      // 11 inches converted to pixels at 96 pixels per inch which is typical for most screens
      const pageHeight = 11 * 96;
      return Math.ceil(contentHeight / pageHeight);
    };

    const renderHeader = () => <Header draft={draftState} totalPageCount={estimatePrintPages()} useLexical />;

    // Helper function to extract endnotes from all editor content
    const extractAllEndnotes = () => {
      // Use global endnote manager if available
      if (window.endnoteManager) {
        const globalEndnotes = window.endnoteManager.getAllEndnotes();
        console.log('Using global endnote manager, found:', globalEndnotes);
        return globalEndnotes;
      }

      console.log('Global endnote manager not available, falling back to editor extraction');
      const allEndnotes = [];

      // Helper function to extract endnotes from a single editor
      const extractFromEditor = (editorRef, editorName) => {
        if (!editorRef) {
          console.log(`Editor ${editorName} not found`);
          return [];
        }

        const endnotes = [];
        try {
          editorRef.getEditorState().read(() => {
            const root = editorRef.getEditorState()._nodeMap || new Map();
            console.log(`Checking editor ${editorName}, node map size:`, root.size);

            for (const [key, node] of root) {
              console.log(`Node type: ${node.__type}, key: ${key}`);
              if (node.__type === 'footnote') {
                console.log(
                  `Found endnote: ID=${node.__footnoteId}, value="${node.__endnoteValue}", text="${node.__text}", ref="${node.__endnoteRef}"`
                );
                endnotes.push({
                  index: node.__footnoteId,
                  value: node.__endnoteValue || '',
                  text: node.__text || '',
                  ref: node.__endnoteRef || `endnote-ref-${node.__footnoteId}`,
                });
              }
            }
          });
        } catch (e) {
          console.warn(`Could not extract endnotes from editor ${editorName}:`, e);
          // Fallback to HTML extraction
          try {
            const html = exportLexicalHtml(editorRef);
            console.log(`Fallback HTML extraction for ${editorName}:`, html);
            const htmlEndnotes = extractEndnotesFromHtml(html);
            console.log(`Extracted from HTML:`, htmlEndnotes);
            return htmlEndnotes;
          } catch (htmlError) {
            console.warn(`HTML extraction also failed for ${editorName}:`, htmlError);
          }
        }

        return endnotes;
      };

      // Extract from starts-with editor
      console.log('Extracting from starts-with editor...');
      allEndnotes.push(...extractFromEditor(editorsRef.current['starts-with-editor'], 'starts-with-editor'));

      // Extract from section editors
      console.log('Extracting from section editors...');
      draftState.sections.forEach((section) => {
        console.log(`Checking section ${section.frontEndId}`);
        allEndnotes.push(...extractFromEditor(editorsRef.current[section.frontEndId], section.frontEndId));
      });

      // Extract from ends-with editor
      console.log('Extracting from ends-with editor...');
      allEndnotes.push(...extractFromEditor(editorsRef.current['ends-with-editor'], 'ends-with-editor'));

      console.log('All extracted endnotes before dedup:', allEndnotes);

      // Remove duplicates and sort by index
      const uniqueEndnotes = allEndnotes.filter((endnote, index, self) => index === self.findIndex((e) => e.index === endnote.index));

      console.log('Final unique endnotes:', uniqueEndnotes);
      return uniqueEndnotes.sort((a, b) => parseInt(a.index) - parseInt(b.index));
    };

    const letterHtml = () => {
      const hydratedLetterHeader = renderToStaticMarkup(renderHeader());
      const startsWithHtml = exportLexicalHtml(editorsRef.current['starts-with-editor']);

      const sectionsHtml = draftState.sections.map((section) => exportLexicalHtml(editorsRef.current[section.frontEndId])).join('\n');

      const endsWithHtml = exportLexicalHtml(editorsRef.current['ends-with-editor']);
      const signature = organizationSignature ? renderToStaticMarkup(generateSignatureContent(organizationSignature)) : '';

      const enclosuresHtml = renderToStaticMarkup(getEnclosuresHtml(draftState?.enclosures || []));

      // Extract all endnotes from the content - use global manager if available
      const allEndnotes = window.endnoteManager ? window.endnoteManager.getAllEndnotes() : extractAllEndnotes();
      const endNotesHtml = renderToStaticMarkup(getEndNotesHtml(allEndnotes));

      return `${hydratedLetterHeader}
        <div data-testid="startsWithHtml">${startsWithHtml}</div>
        <div data-testid="sectionsHtml">${sectionsHtml}</div>
        <div data-testid="endsWithHtml">${endsWithHtml}</div>
        <div data-testid="signature">${signature}</div>
        <div data-testid="enclosure">${enclosuresHtml}</div>
        <div data-testid="endnotes">${endNotesHtml}</div>`;
    };

    const letterDraftData = () => {
      const formattedSections = draftState.sections.map((section, i) => {
        const sectionValue = section._destroy ? null : exportLexicalHtml(editorsRef.current[section.frontEndId]);

        const sectionAttributes = {
          id: section.id,
          text: sectionValue,
          order: i,
        };
        return {
          ...sectionAttributes,
          ...(section._destroy && { _destroy: section._destroy }),
        };
      });

      // Extract endnotes for storage - use global manager if available
      const allEndnotes = window.endnoteManager ? window.endnoteManager.getAllEndnotes() : extractAllEndnotes();

      const draftData = {
        sectionsAttributes: formattedSections,
        startsWith: exportLexicalHtml(editorsRef.current['starts-with-editor']),
        endsWith: exportLexicalHtml(editorsRef.current['ends-with-editor']),
        endNotes: allEndnotes, // Add endnotes to draft data
      };

      if (showDocumentHeader) {
        const hydratedHeaders = HEADER_ROW_COL_LIST.reduce(
          (resultMap, rowCol) => ({
            ...resultMap,
            [rowCol]: hydrateVariablesHeadlessly(draft[rowCol], draft),
          }),
          {}
        );

        return {
          ...hydratedHeaders,
          ...draftData,
        };
      }

      return draftData;
    };

    useImperativeHandle(ref, () => ({
      letterHtml,
      letterDraftData,
      estimatePrintPages,
      portraitUsLetterRef,
    }));

    const nonDestroyedSections = (currentDraft) => currentDraft.sections.filter((sec) => sec._destroy === undefined);

    const deleteSection = (frontEndId) => {
      setDraftState((currentDraftState) => {
        const section = currentDraftState.sections.find((p) => p.frontEndId === frontEndId);
        const otherSections = currentDraftState.sections.filter((p) => p.frontEndId !== frontEndId);

        // Setting _destroy to 1 on an association will mark it for destruction on update
        const doomedSection = { ...section, _destroy: 1 };
        const nextSections = [...otherSections, doomedSection];
        delete editorsRef.current[frontEndId];
        return { ...currentDraftState, sections: nextSections };
      });

      setShowSectionDeleteModal(false);
    };

    const showWings = (curId) => {
      const allSections = [
        ...draftState.sections.map((section) => ({
          frontEndId: section.frontEndId,
          showWings: `editor-${section.frontEndId}` === curId,
        })),
        {
          frontEndId: 'starts-with-editor',
          showWings: curId === 'editor-starts-with-editor',
        },
        {
          frontEndId: 'ends-with-editor',
          showWings: curId === 'editor-ends-with-editor',
        },
      ];

      setOpenSections(allSections);
    };

    const addSection = () => {
      const newSection = {
        id: null, // The db id
        frontEndId: uuidv4(), // Used like an html id for referring to sections that don't have a db id.
        text: '',
        locked: false,
      };

      setDraftState((currentDraftState) => ({
        ...currentDraftState,
        sections: [...draftState.sections, newSection],
      }));
    };

    const forceFocusToLastParagraph = () => {
      const inputs = document.querySelectorAll('.lexical-editor-input');
      if (inputs[inputs.length - 1].id !== 'content-editable-editor-ends-with-editor') {
        inputs[inputs.length - 1].focus();
      } else {
        inputs[inputs.length - 2].focus();
      }
    };

    const onAddParagraph = async () => {
      // This throws a TypeScript error for async/await that is a IDE issue as we are not using TS.
      // Ignore this error as it does not effect the linting tool for scribe_ui
      await addSection();
      await heightCheck();
      forceFocusToLastParagraph();
    };

    const createEditor = (frontEndId, initialValue, editable, section = {}) => {
      const sectionOpen = openSections?.filter((item) => item.frontEndId?.includes(frontEndId));

      return (
        <div>
          <LexicalEditor
            key={`editor-${frontEndId}`}
            id={`editor-${frontEndId}`}
            sectionOpen={sectionOpen[0]}
            type={frontEndId.includes('starts') || frontEndId.includes('ends') ? 'startsEnds' : ''}
            showWings={showWings}
            deleteConfirmation={showDeleteConfirmationModalForSection}
            section={section}
            editable={editable}
            initialValue={initialValue}
            onChange={heightCheck}
            editorRefAssignmentFunction={(editor) => {
              editorsRef.current[frontEndId] = editor;
            }}
            lexicalPlugins={[
              <VariablePlugin draft={draftState} key={`variable-plugin-${frontEndId}`} />,
              <SnippetPlugin key={`snippet-plugin-${frontEndId}`} />,
            ]}
            showVariableValues={() => showVariableValues(editorsRef.current[frontEndId], draftState)}
            toolList={toolList}
          />
        </div>
      );
    };

    useEffect(() => {
      const nextSections = draft.sections
        .map((section) => ({ ...section, frontEndId: section.id ?? uuidv4() }))
        .toSorted((a, b) => a.order - b.order);

      setDraftState({ ...draft, ...{ sections: nextSections } });
      setOrganizationSignature(findOrganizationSignature(draft));
    }, [draft]);

    useEffect(() => {
  // Restore endnotes when draft state changes
  if (draftState?.endNotes && Array.isArray(draftState.endNotes) && draftState.endNotes.length > 0) {
    console.log('ScribeDocument - Restoring endnotes from draft state:', draftState.endNotes);
    
    // Initialize global endnote manager
    if (window.endnoteManager) {
      window.endnoteManager.initializeFromLetter({ endNotes: draftState.endNotes });
    }
    
    // Scan all editors and convert text patterns back to endnote nodes
    setTimeout(() => {
      Object.entries(editorsRef.current).forEach(([editorKey, editor]) => {
        if (editor) {
          console.log(`ScribeDocument - Scanning editor ${editorKey} for endnote restoration`);
          
          editor.update(() => {
            const root = $getRoot();
            let restoredCount = 0;
            
            const scanAndRestore = (node) => {
              // Look for text nodes that contain endnote patterns
              if (node.getType && node.getType() === 'extended-text') {
                const text = node.getTextContent();
                const endnotePattern = /([^[]*)\[(\d+)\]/g;
                const matches = [];
                let match;
                
                // Find all endnote patterns in the text
                while ((match = endnotePattern.exec(text)) !== null) {
                  matches.push({
                    fullText: match[0],
                    beforeText: match[1],
                    endnoteId: match[2],
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                  });
                }
                
                // Process matches in reverse order to maintain text positions
                matches.reverse().forEach(matchData => {
                  const endnoteData = draftState.endNotes.find(e => 
                    String(e.index) === matchData.endnoteId
                  );
                  
                  if (endnoteData) {
                    console.log(`ScribeDocument - Restoring endnote ${matchData.endnoteId} in ${editorKey}`);
                    
                    // Split the text and replace with endnote node
                    const beforeMatch = text.substring(0, matchData.startIndex);
                    const afterMatch = text.substring(matchData.endIndex);
                    
                    const newNodes = [];
                    
                    // Add text before the endnote if it exists
                    if (beforeMatch) {
                      newNodes.push($createTextNode(beforeMatch));
                    }
                    
                    // Add the endnote node
                    const endnoteNode = $createEndnoteNode(
                      matchData.beforeText, 
                      parseInt(matchData.endnoteId), 
                      endnoteData.value || ''
                    );
                    newNodes.push(endnoteNode);
                    
                    // Add text after the endnote if it exists
                    if (afterMatch) {
                      newNodes.push($createTextNode(afterMatch));
                    }
                    
                    // Replace the original text node
                    if (newNodes.length > 0) {
                      node.replace(newNodes[0]);
                      for (let i = 1; i < newNodes.length; i++) {
                        newNodes[i - 1].insertAfter(newNodes[i]);
                      }
                      restoredCount++;
                    }
                  }
                });
              }
              
              // Recursively scan child nodes
              if (node.getChildren) {
                node.getChildren().forEach(scanAndRestore);
              }
            };
            
            root.getChildren().forEach(scanAndRestore);
            
            if (restoredCount > 0) {
              console.log(`ScribeDocument - Restored ${restoredCount} endnotes in editor ${editorKey}`);
            }
          });
        }
      });
    }, 1000); // Give editors time to fully initialize
  }
}, [draftState?.endNotes]);

    return (
      <DataContext.Provider value={contextValue}>
        <div className="portraitUsLetter" ref={portraitUsLetterRef} data-testid="portraitUsLetter">
          <div
            className="portraitUsLetterEditor"
            data-testid="portraitUsLetterEditor"
            style={{
              marginLeft: `${convertInchesToPixels(draftState.marginLeft)}px`,
              marginRight: `${convertInchesToPixels(draftState.marginRight)}px`,
              marginTop: `${convertInchesToPixels(draftState.marginTop)}px`,
            }}>
            {showDocumentHeader && renderHeader()}

            {draftState.startsWith && (
              <div className="editorContainer lock-container">
                {createEditor('starts-with-editor', draftState.startsWith, !draftState.startsWithLocked)}
              </div>
            )}

            {nonDestroyedSections(draftState)
              .filter((item) => item.frontEndId)
              .map((section) => (
                <EditorSection
                  key={`container-${section.frontEndId}`}
                  data-testid={`container-${section.frontEndId}`}
                  style={{ position: 'relative' }}
                  locked={section.locked}
                  className="editorContainer sectionContainer">
                  {createEditor(section.frontEndId, section.text, !section.locked, section)}
                </EditorSection>
              ))}

            {draftState.endsWith && (
              <div className="editorContainer lock-container">
                {createEditor('ends-with-editor', draftState.endsWith, !draftState.endsWithLocked)}
              </div>
            )}

            <div className="t-center">
              <div className="add-paragraph-wrapper">
                <ActionButton
                  data-testid="addSectionButton"
                  icon={Paragraph}
                  id="addSectionButton"
                  title="Add Blank Paragraph"
                  aria-label="Add Blank Paragraph"
                  onClick={() => onAddParagraph()}
                  text="Add Blank Paragraph"
                />
              </div>
            </div>

            {organizationSignature && useSignature && (
              <div className="signature-container">
                <SignaturePreview
                  id={`image-for-${organizationSignature.id}`}
                  signatureImageUrl={organizationSignature.signatureImageUrl}
                  signatoryName={organizationSignature.signatoryName}
                  signatoryTitle={organizationSignature.signatoryTitle}
                  signatureImageClass="signature-preview-image"
                />
              </div>
            )}

            {getEnclosuresHtml(draft?.enclosures)}

            <div data-testid="endnotes-section">
              {(() => {
                const allEndnotes = extractAllEndnotes();
                return getEndNotesHtml(allEndnotes);
              })()}
            </div>
          </div>

          <div className="bottomMarginPlaceholder" data-testid="bottomMarginPlaceholder" style={{ height: `${draftState.marginBottom}px` }} />

          <DefaultModal
            defaultMessage="Are you sure you want to delete this section? This action can not be undone."
            onSubmit={() => deleteSection(frontEndIdToDelete)}
            showModal={showSectionDeleteModal}
            setShowModal={setShowSectionDeleteModal}
          />
        </div>
      </DataContext.Provider>
    );
  }
);
export default ScribeDocument;

ScribeDocument.propTypes = {
  height: PropTypes.number,
  setHeight: PropTypes.func.isRequired,
  draft: ScribeDocumentPropTypes.isRequired,
  toolList: PropTypes.shape({}),
  SignaturePreview: PropTypes.shape({}),
  showDocumentHeader: PropTypes.bool,
  useSignature: PropTypes.bool,
};
