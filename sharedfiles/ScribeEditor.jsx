/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/require-default-props */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { DrSwitch } from '@druid/druid';
import { GeneratePdfObject } from '../LetterUtil';
import { H1, H2 } from '../../../components/typography';
import ScribeDocument from './scribeDocument/ScribeDocument';
import ContactSideBar from '../ContactSideBar';
import LetterEditorGuideModal from './LetterEditorGuideModal';
import QuestionCircleIcon from '../../../assets/letter-editor-guide/Tooltip Menu Icon.svg';
import { BtnContainer, StyledHr } from '../../../components/designedComponents';

function ScribeEditor({
  documentDetail,
  letterEditorRef,
  letterContainerRowRef,
  showPdf,
  pdfData,
  inlinePdfScale,
  letterHeight,
  uuid,
  SignaturePreview,
  scribeEditorConfig,
  handlePdfToggle,
  handleCardOnClick,
  setHeight,
  handleDoubleSidedToggle,
  previewRecipientId,
}) {
  // Default Prop Values
  const {
    doubleSided = false,
    letterPreviewMode = false,
    showDocumentHeader = false,
    showPdfPreviewToggle = false,
    showLetterRecipients = false,
    showManageContacts = false,
    editorTitle = 'Scribe Editor',
    buttonActions = [],
    reviewActions = [],
    quickActions = [],
    updatedDateTime = '',
  } = scribeEditorConfig;

  const [showLetterEditorGuideModal, setShowLetterEditorGuideModal] = useState(false);

  return (
    <>
      <LetterEditorGuideModal showModal={showLetterEditorGuideModal} setShowModal={setShowLetterEditorGuideModal} />

      <div className="mb-5">
        <div className="row">
          <div className="col-sm-2" />
          <div className="col-sm-8 center-content">
            <div className="editorMenuTop">
              <div className="float-start">
                <div className="header" data-testid="header">
                  <H1>{editorTitle}</H1>
                  <Button
                    data-testid="viewLetterEditorGuide"
                    id="viewLetterEditorGuide"
                    className="question-mark"
                    alt="Letter Editor Guide"
                    aria-label="Letter Editor Guide"
                    title="Letter Editor Guide"
                    onClick={() => setShowLetterEditorGuideModal(true)}>
                    <img
                      src={QuestionCircleIcon}
                      className="question-mark-icon"
                      alt="Letter Editor Guide Icon"
                      aria-label="Letter Editor Guide Icon"
                    />
                  </Button>
                </div>
              </div>

              <div className="float-end">
                {showPdfPreviewToggle && (
                  <DrSwitch
                    label="Preview Letter"
                    checked={showPdf}
                    ondr-change={handlePdfToggle}
                    value="conrolledSwitch"
                    onLabel=""
                    offLabel=""
                    data-testid="previewLetterToggle"
                    styles={{ container: { marginBottom: '0px;' } }}
                  />
                )}
              </div>
              <div className="float-end">
                {doubleSided && (
                  <DrSwitch
                    id="double-sided-switch"
                    data-testid="double-sided-switch"
                    label="Double Sided"
                    checked={doubleSided}
                    onChange={() => handleDoubleSidedToggle()}
                    onLabel="On"
                    offLabel="Off"
                    title={doubleSided ? 'Double Sided On' : 'Double Sided Off'}
                    styles={{ container: { marginBottom: '0' } }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row" ref={letterContainerRowRef} data-testid="letterContainerRow">
          <div className="col-sm-2 d-flex flex-column">
            {(letterPreviewMode || !showPdf) && ( // Letter Prevew shows side bar in PDF view
              <div className="sidebar">
                <span aria-live="polite" role="status">
                  Saved: {updatedDateTime}
                </span>

                <div className="side-menu ps-2 p-2 mb-4">
                  <H2>Quick Actions</H2>

                  {quickActions.map((action, index) => {
                    const ActionComponent = action.component;
                    // Check if there's a condition and if it's false
                    if (action.condition !== undefined && !action.condition) {
                      return null;
                    }

                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <div className="mb-3 mt-3" key={`quick-action-${index}`}>
                        <ActionComponent {...action.props} />
                      </div>
                    );
                  })}
                </div>

                {documentDetail && showLetterRecipients && (
                  <ContactSideBar
                    uuid={uuid}
                    contacts={documentDetail?.contacts || []}
                    showManageContacts={showManageContacts}
                    useRecipientCards={letterPreviewMode} // Letter Prevew shows clickable cards
                    handleCardOnClick={handleCardOnClick}
                    selectedRecipientId={previewRecipientId}
                  />
                )}
              </div>
            )}
          </div>

          <div className="col-8">
            {!showPdf && documentDetail && (
              <div style={{ height: letterHeight }}>
                <ScribeDocument
                  draft={documentDetail}
                  height={letterHeight}
                  setHeight={setHeight}
                  toolList={scribeEditorConfig.toolList}
                  SignaturePreview={SignaturePreview}
                  showDocumentHeader={showDocumentHeader}
                  useSignature={scribeEditorConfig.useSignature}
                  ref={letterEditorRef}
                />
              </div>
            )}

            {showPdf && pdfData && (
              <div className="portraitUsLetterObject">
                <GeneratePdfObject pdfData={pdfData} inlinePdfScale={inlinePdfScale} />
              </div>
            )}
            {Array.isArray(buttonActions) && buttonActions.length > 0 && (
              <>
                <div className="row">
                  <div className="col-sm-11">
                    <StyledHr />
                  </div>
                </div>
                <BtnContainer>
                  {buttonActions.map((action, index) => {
                    const ActionComponent = action.component;
                    // Check if there's a condition and if it's false
                    if (action.condition !== undefined && !action.condition) {
                      return null;
                    }

                    return (
                      <div
                        // eslint-disable-next-line react/no-array-index-key
                        key={`button-action-${index}`}
                        className="mb-3 mt-3">
                        <ActionComponent {...action.props} />
                      </div>
                    );
                  })}
                </BtnContainer>
              </>
            )}
          </div>

          <div className="col-sm-2">
            <div className="sidebar">
              {Array.isArray(reviewActions) && reviewActions.length > 0 && (
                <div className="side-menu ps-2 pt-2 pb-4">
                  <H2>Review Actions</H2>

                  <div className="d-grid gap-2">
                    {reviewActions.map((action, index) => {
                      const ActionComponent = action.component;
                      return (
                        <ActionComponent
                          // eslint-disable-next-line react/no-array-index-key
                          key={`review-action-${index}`}
                          {...action.props}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

ScribeEditor.propTypes = {
  // Props
  documentDetail: PropTypes.object,
  letterEditorRef: PropTypes.object,
  letterContainerRowRef: PropTypes.object,
  showPdf: PropTypes.bool,
  pdfData: PropTypes.string,
  inlinePdfScale: PropTypes.string,
  letterHeight: PropTypes.number,
  uuid: PropTypes.string.isRequired,
  previewRecipientId: PropTypes.string,
  scribeEditorConfig: PropTypes.shape({
    doubleSided: PropTypes.bool,
    showDocumentHeader: PropTypes.bool,
    showPdfPreviewToggle: PropTypes.bool,
    showLetterRecipients: PropTypes.bool,
    showManageContacts: PropTypes.bool,
    editorTitle: PropTypes.string,
    letterPreviewMode: PropTypes.bool,
    updatedDateTime: PropTypes.string,
    reviewActions: PropTypes.arrayOf(
      PropTypes.shape({
        component: PropTypes.elementType.isRequired,
        props: PropTypes.object,
      })
    ),
    quickActions: PropTypes.arrayOf(
      PropTypes.shape({
        component: PropTypes.elementType.isRequired,
        props: PropTypes.object,
        condition: PropTypes.bool,
      })
    ),
    margins: PropTypes.arrayOf(PropTypes.number),
    toolList: PropTypes.shape({}),
    buttonActions: PropTypes.arrayOf(
      PropTypes.shape({
        component: PropTypes.elementType.isRequired,
        props: PropTypes.object,
        condition: PropTypes.bool,
      })
    ),
  }),

  // Handlers
  handlePdfToggle: PropTypes.func,
  handleCardOnClick: PropTypes.func,
  handleDoubleSidedToggle: PropTypes.func,
  setHeight: PropTypes.func,
};

export default ScribeEditor;
