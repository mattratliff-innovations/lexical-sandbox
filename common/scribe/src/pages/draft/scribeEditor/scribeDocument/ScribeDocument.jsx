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
import { getEnclosuresHtml } from '../../LetterUtil';

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

    const letterHtml = () => {
      const hydratedLetterHeader = renderToStaticMarkup(renderHeader());
      const startsWithHtml = exportLexicalHtml(editorsRef.current['starts-with-editor']);

      const sectionsHtml = draftState.sections.map((section) => exportLexicalHtml(editorsRef.current[section.frontEndId])).join('\n');

      const endsWithHtml = exportLexicalHtml(editorsRef.current['ends-with-editor']);
      const signature = organizationSignature ? renderToStaticMarkup(generateSignatureContent(organizationSignature)) : '';

      const enclosuresHtml = renderToStaticMarkup(getEnclosuresHtml(draftState?.enclosures || []));

      return `${hydratedLetterHeader}
        <div data-testid="startsWithHtml">${startsWithHtml}</div>
        <div data-testid="sectionsHtml">${sectionsHtml}</div>
        <div data-testid="endsWithHtml">${endsWithHtml}</div>
        <div data-testid="signature">${signature}</div>
        <div data-testid="enclosure">${enclosuresHtml}</div>`;
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
          sectionsAttributes: formattedSections,
          startsWith: exportLexicalHtml(editorsRef.current['starts-with-editor']),
          endsWith: exportLexicalHtml(editorsRef.current['ends-with-editor']),
        };
      }
      return {
        sectionsAttributes: formattedSections,
        startsWith: exportLexicalHtml(editorsRef.current['starts-with-editor']),
        endsWith: exportLexicalHtml(editorsRef.current['ends-with-editor']),
      };
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
