/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/prop-types */

/* eslint-disable react/require-default-props */
import { useEffect, useRef, useState } from 'react';

import { DrAlert, DrSwitch } from '@druid/druid';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

import ContactSideBar from '../ContactSideBar';
import { GeneratePdfObject } from '../LetterUtil';
import LetterEditorGuideModal from './LetterEditorGuideModal';
import ReviewActionsWrapper from './ReviewActionsWrapper';
import ScribeDocument from './scribeDocument/ScribeDocument';
import QuestionCircleIcon from '../../../assets/letter-editor-guide/Tooltip Menu Icon.svg';
import { BtnContainer, StyledHr } from '../../../components/designedComponents';
import ScribeAccordion from '../../../components/scribeAccordion/ScribeAccordion';
import Timer from '../../../components/Timer';
import { H1, H2 } from '../../../components/typography';
import { returnLetterToDraftStatus } from '../../../http/letters';
import { isCentralPrint } from '../../../utils/letterStatusHelpers';
import { showToastError, showToastSuccess } from '../../../utils/toastHelpers';
import { useFeatureFlags } from '../../admin/flag/FeatureFlagsProvider';
import { subscribeIssues } from './scribeDocument/lexical/plugins/spellChecker/SpellCheckBus';
import SpellCheckPluginAccordion from './scribeDocument/lexical/plugins/spellChecker/SpellCheckPluginAccordion';

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
  currentUser,
  isPreview,
  letterChangeTracking,
  supportingDocs = false,
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
  const [showCentralPrintBanner, setShowCentralPrintBanner] = useState(false);
  const [spellingErrorCount, setSpellingErrorCount] = useState(0);
  const [spellingErrors, setSpellingErrors] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (isCentralPrint(documentDetail?.status?.name) && documentDetail?.leavesCentralPrintQueueAt) {
      setShowCentralPrintBanner(true);
    } else {
      setShowCentralPrintBanner(false);
    }
  }, [documentDetail?.status?.name, documentDetail?.leavesCentralPrintQueueAt]);

  // listens to how many spelling errors are in document
  useEffect(() => {
    const spellingErrorCallback = (issue) => {
      setSpellingErrors(issue);
      setSpellingErrorCount(issue.length);
    };
    subscribeIssues(spellingErrorCallback);
  }, []);

  const handleCentralPrintExpire = () => {
    showToastSuccess('UUID sent to Central Print!', {
      toastId: 'toastCentralPrint',
    });
    setShowCentralPrintBanner(false);
  };

  const cancelCentralPrintJob = async () => {
    try {
      returnLetterToDraftStatus(documentDetail.id);
      setShowCentralPrintBanner(false);
      showToastSuccess('Central print job successfully cancelled!', {
        toastId: 'toastCancelCentralPrint',
      });
      setTimeout(() => {
        navigate(`/draft/${documentDetail.id}`);
      }, 1000);
    } catch (e) {
      showToastError('There was an error cancelling Central print job.', {
        toastId: 'toastCancelCentralPrintError',
      });
    }
  };

  const { featureFlags, hasFlag } = useFeatureFlags();

  const supportDocsSpellcheckEnabled = () => supportingDocs && featureFlags && hasFlag(featureFlags, 'spell_check');

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
                {showCentralPrintBanner && (
                  <DrAlert type="warn" noCloseBtn>
                    <span>
                      Time left until letter goes to Central Print and can no longer be changed:{' '}
                      <Timer
                        expiresAt={documentDetail?.leavesCentralPrintQueueAt}
                        isActive={isCentralPrint(documentDetail?.status?.name)}
                        onExpire={handleCentralPrintExpire}
                      />
                      {'. '}
                      <button type="button" className="link-button" onClick={cancelCentralPrintJob}>
                        Cancel print job.
                      </button>
                    </span>
                  </DrAlert>
                )}
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
                  currentUser={currentUser}
                  height={letterHeight}
                  setHeight={setHeight}
                  toolList={scribeEditorConfig.toolList}
                  SignaturePreview={SignaturePreview}
                  showDocumentHeader={showDocumentHeader}
                  useSignature={scribeEditorConfig.useSignature}
                  ref={letterEditorRef}
                  letterChangeTracking={letterChangeTracking}
                />
              </div>
            )}

            {showPdf && (
              <div className={pdfData ? 'portraitUsLetterObject' : ''}>
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
              {isPreview && (
                <div className="side-menu px-2 pt-2 pb-4">
                  <H2>Review Actions</H2>
                  <ReviewActionsWrapper uuid={uuid} currentUser={currentUser} documentDetail={documentDetail} isPreview={isPreview} />
                </div>
              )}
              {!showPdf && Array.isArray(reviewActions) && reviewActions.length > 0 && (
                <div className="side-menu px-2 pt-2 pb-4">
                  <H2>Review Actions</H2>
                  <ReviewActionsWrapper uuid={uuid} currentUser={currentUser} documentDetail={documentDetail} isPreview={isPreview} />
                  <div className="d-grid gap-2">
                    {reviewActions.map((action, index) => {
                      const ActionComponent = action.component;
                      // Check if there's a condition and if it's false
                      if (action.condition === false) {
                        return null;
                      }

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
              {supportDocsSpellcheckEnabled() && (
                <div className="side-menu px-2 pt-2 pb-4">
                  <H2>Review Actions</H2>
                  <ScribeAccordion
                    panels={[
                      {
                        header: <>Spelling and Grammar {spellingErrorCount}</>,
                        content: <SpellCheckPluginAccordion issues={spellingErrors} />,
                      },
                    ]}
                  />
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
        condition: PropTypes.bool,
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
  letterChangeTracking: PropTypes.object,
  // Handlers
  handlePdfToggle: PropTypes.func,
  handleCardOnClick: PropTypes.func,
  handleDoubleSidedToggle: PropTypes.func,
  setHeight: PropTypes.func,
  isPreview: PropTypes.bool,
  supportingDocs: PropTypes.bool,
};

export default ScribeEditor;
