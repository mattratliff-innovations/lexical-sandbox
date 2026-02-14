/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useRef, useState } from 'react';

import { DrButton } from '@druid/druid';
import { DateTime } from 'luxon';
import { ClockHistory, EnvelopeFill, FloppyFill, Paperclip, PenFill, Trash3Fill } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Flip, toast } from 'react-toastify';

import ActivityLogModal from './ActivityLogModal';
import AddEnclosureModal from './AddEnclosureModal';
import ChangeHeaderModal from './ChangeHeaderModal';
import ChangeSignatureModal from './ChangeSignatureModal';
import DeleteLetterModal from './DeleteLetterModal';
import renderPdfHtml from './htmlTo508CompliantPdfHtml';
import './Letter.css';
import { sortSectionsByOrder } from './LetterUtil';
import PrintPreviewErrorModal from './PrintPreviewErrorsModal';
import ReassignLetterButton from './ReassignLetterButton';
import { LetterChangeTracker } from './scribeEditor/scribeDocument/LetterChangeTracker';
import hasLetterAccess from './utils/checkLetterAccess';
import { AppContext } from '../../AppProvider';
import ScribeEditor from './scribeEditor/ScribeEditor';
import ActionButton from '../../components/actionButton/ActionButton';
import InvalidStatus from '../../components/InvalidStatus';
import Unauthorized from '../../components/Unauthorized';
import VawaModal from '../../components/vawa/VawaModal';
import { RESOURCES } from '../../constants/navigation';
import useModal from '../../hooks/useModal';
import { APP_API_ENDPOINT, createAuthenticatedAxios, PDF_ENDPOINT } from '../../http/authenticatedAxios';
import { deleteLetter } from '../../http/letters';
import LoadingFallback from '../../utils/LoadingFallback';
import SignaturePreview from '../admin/organizations/SignaturePreview';
import useModalCheck from '../util/customHooks/useModalCheck';
import UtilityModal from '../util/UtilityModal';
import { letterEditorToolList } from './scribeEditor/scribeDocument/lexical/lexicalToolbarHelper';

const reviewButtonStyles = {
  button: {
    width: '100%',
  },
};

// Define action button components
function SaveButton({ onClick }) {
  return (
    <ActionButton
      data-testid="saveDraft"
      id="saveDraft"
      title="Save Letter"
      aria-label="Save Letter"
      onClick={onClick}
      icon={FloppyFill}
      text="Save Letter"
    />
  );
}

function ChangeHeaderButton({ onClick }) {
  return (
    <ActionButton
      data-testid="changeHeader"
      id="changeHeader"
      title="Change Header"
      aria-label="Change Header"
      onClick={onClick}
      icon={EnvelopeFill}
      text="Change Header/Date"
    />
  );
}

function ChangeSignatureButton({ onClick }) {
  return (
    <ActionButton
      data-testid="changeSignature"
      id="changeSignature"
      title="Change Signature"
      aria-label="Change Signature"
      onClick={onClick}
      icon={PenFill}
      text="Change Signature"
    />
  );
}

function DeleteButton({ onClick }) {
  return (
    <ActionButton
      data-testid="deleteDraft"
      id="deleteDraft"
      title="Delete Letter"
      aria-label="Delete Letter"
      onClick={onClick}
      icon={Trash3Fill}
      text="Delete Letter"
    />
  );
}

function LocalPrintButton({ onClick }) {
  return (
    <DrButton styles={reviewButtonStyles} data-testid="localPrintButton" aria-label="Local Print" onClick={onClick}>
      Local Print
    </DrButton>
  );
}

function CentralPrintButton({ onClick }) {
  return (
    <DrButton styles={reviewButtonStyles} data-testid="centralPrintButton" aria-label="Central Print" onClick={onClick}>
      Central Print
    </DrButton>
  );
}

function CompleteWithoutPrintingButton({ onClick }) {
  return (
    <DrButton styles={reviewButtonStyles} data-testid="completeWithoutPrintingButton" aria-label="Complete Without Printing" onClick={onClick}>
      Complete Without Printing
    </DrButton>
  );
}

function AddEnclosureButton({ onClick }) {
  return (
    <ActionButton
      data-testid="addEnclosureButton"
      id="addEnclosureButton"
      title="Add Enclosure"
      aria-label="Add Enclosure"
      onClick={onClick}
      icon={Paperclip}
      text="Add Enclosure"
    />
  );
}

function ActivityLogButton({ onClick }) {
  return (
    <ActionButton
      data-testid="activityLogButton"
      id="activityLogButton"
      title="Activity Log"
      aria-label="Activity Log"
      onClick={onClick}
      icon={ClockHistory}
      text="Activity Log"
    />
  );
}

export default function Letter() {
  // Extract parameters and initialize hooks
  const { id: uuid } = useParams();
  const { setDraftOrganization } = useContext(AppContext);
  const navigate = useNavigate();
  const axios = createAuthenticatedAxios();

  // Create refs
  const letterEditorRef = useRef(null);
  const letterContainerRowRef = useRef(null);

  const { showModal, setModal, isModalOpen, hideModal } = useModal({
    addEnclosure: false,
    activityLog: false,
    changeHeader: false,
    changeSignature: false,
    deleteLetter: false,
    printPreviewError: false,
  });

  const setAddEnclosureModalOpen = (shouldOpen) => setModal('addEnclosure', shouldOpen);
  const setChangeHeaderModalOpen = (shouldOpen) => setModal('changeHeader', shouldOpen);
  const setChangeSignatureModalOpen = (shouldOpen) => setModal('changeSignature', shouldOpen);
  const setDeleteLetterModalOpen = (shouldOpen) => setModal('deleteLetter', shouldOpen);
  const setPrintPreviewErrorModalOpen = (shouldOpen) => setModal('printPreviewError', shouldOpen);

  // State hooks
  const [showPdf, setShowPdf] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [initialDraft, setInitialDraft] = useState(null);
  const [curHtml, setCurHtml] = useState({});
  const [defaultSignature, setDefaultSignature] = useState(null);
  const [inlinePdfScale, setInlinePdfScale] = useState(null);
  const [letterHeight, setLetterHeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVawaModal, setShowVawaModal] = useState(false);
  const [showCentralPrintButton, setShowCentralPrintButton] = useState(false);
  const { currentUser } = useContext(AppContext);
  const [unauthorized, setUnauthorized] = useState(false);
  const [invalidStatus, setInvalidStatus] = useState(false);
  const checkForChangesRef = useRef(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastHasChangesRef = useRef(false);

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(hasUnsavedChanges);

  // Reset endnote manager when component unmounts or navigates away
  useEffect(
    () => () => {
      if (window.endnoteManager) {
        window.endnoteManager.reset();
      }
    },
    []
  );

  // Used for track changes
  useEffect(() => {
    if (!initialDraft) return; // Do not start interval until initialDraft is set
    const intervalId = setInterval(() => {
      if (checkForChangesRef.current) {
        try {
          const result = checkForChangesRef.current();
          const { hasChanges } = result;

          // Log details for debugging
          if (hasChanges !== lastHasChangesRef.current) {
            lastHasChangesRef.current = hasChanges;
            setHasUnsavedChanges(hasChanges);
          }
        } catch (error) {
          console.error('Error checking for changes:', error);
        }
      }
    }, 1000);
    // eslint-disable-next-line consistent-return
    return () => clearInterval(intervalId);
  }, [initialDraft]); // Only run when initialDraft is set

  const renderToast = (type, message) => {
    toast[type](message, {
      position: 'top-center',
      autoClose: 750,
      transition: Flip,
      theme: 'dark',
      toastId: 'toastContact',
    });
  };

  // Handler functions
  const confirmDeleteLetter = () => {
    deleteLetter(uuid)
      .then(() => {
        navigate('/search');
      })
      .catch(() => renderToast('error', 'Something went wrong, please try again.'));
  };

  const draftUpdatedTime = () => {
    if (!draft) return '';

    const date = DateTime.fromISO(draft.updatedAt);
    return `${date.toLocaleString(DateTime.DATE_SHORT)} @ ${date.toLocaleString(DateTime.TIME_WITH_SECONDS)}`;
  };

  const openLocalPrintPreview = (printType) => {
    navigate(`/${RESOURCES.drafts}/${uuid}/preview/local-print`, {
      state: {
        totalPageCount: letterEditorRef.current.estimatePrintPages(),
        printType,
      },
    });
  };

  const openCentralPrintPreview = (printType) => {
    navigate(`/${RESOURCES.drafts}/${uuid}/preview/central-print`, {
      state: {
        totalPageCount: letterEditorRef.current.estimatePrintPages(),
        printType,
      },
    });
  };

  const openCompleteWithoutPrintingPreview = (printType) => {
    navigate(`/${RESOURCES.drafts}/${uuid}/preview/complete-without-printing`, {
      state: {
        totalPageCount: letterEditorRef.current.estimatePrintPages(),
        printType,
      },
    });
  };

  const openPreviewFor = (printType) => {
    switch (printType) {
      case 'local':
        openLocalPrintPreview(printType);
        break;
      case 'central':
        openCentralPrintPreview(printType);
        break;
      case 'noprint':
        openCompleteWithoutPrintingPreview(printType);
        break;
      default:
        break;
    }
  };

  const saveDraft = async (markAllClean) => {
    const draftData = {
      ...letterEditorRef.current.letterDraftData(),
      organizationSignatureId: defaultSignature?.id,
    };
    return axios
      .put(`${APP_API_ENDPOINT}/letters/${draft.id}`, { letter: draftData })
      .then((response) => {
        setDraft((prev) => ({
          ...prev,
          sections: response.data.sections,
        }));
        // Update initial draft to reflect saved state
        if (letterEditorRef.current?.draftState) {
          setInitialDraft(sortSectionsByOrder(letterEditorRef.current.draftState));
        }
        // Mark all changes as clean in the tracker
        if (markAllClean) {
          markAllClean();
        }
        renderToast('success', 'Letter successfully saved');
        return response.data;
      })
      .catch(() => renderToast('error', 'Something went wrong, please try again.'));
  };

  // printType is a string of either 'local' or 'central'
  const finalizeDraft = async (printType) => {
    saveDraft().then((savedDraft) => {
      setDraft({ ...savedDraft });

      const draftPrintErrors = savedDraft.errors?.print;
      const contactPrintErrors = savedDraft.contacts?.some((contact) => contact.errors?.print);
      const addressPrintErrors = savedDraft.contacts?.some((contact) => contact.address?.errors?.print);
      if (draftPrintErrors || contactPrintErrors || addressPrintErrors) showModal('printPreviewError');
      else openPreviewFor(printType);
    });
  };

  const onSubmitChangeSignature = async (data) => {
    const params = { letter: data };
    const response = await axios.put(`${APP_API_ENDPOINT}/letters/${draft.id}/update_letter_signature`, params);
    hideModal('changeSignature');
    setDefaultSignature(response.data.organizationSignature);
    setDraft({
      ...draft,
      organizationSignatureId: response.data.organizationSignatureId,
      organizationSignature: response.data.organizationSignature,
    });
  };

  const onSubmitChangeHeader = async (data) => {
    const response = await axios.put(`${APP_API_ENDPOINT}/letters/${draft.id}`, {
      letter: data,
    });
    hideModal('changeHeader');
    setDraft(response.data);
  };

  const generatePdf = async () => {
    const htmlContent = letterEditorRef.current.letterHtml();
    if (curHtml === htmlContent) return;

    const newSections = letterEditorRef.current.letterDraftData().sectionsAttributes.map((section) => ({
      ...section,
      locked: false,
      draftId: draft.id,
    }));

    setDraft({
      ...draft,
      ...letterEditorRef.current.letterDraftData(),
      organizationSignatureId: defaultSignature?.id,
      sections: newSections,
    });

    setCurHtml(htmlContent);
    const data = renderPdfHtml(htmlContent, draft);

    axios
      .post(`${PDF_ENDPOINT}/from_html`, data, {
        responseType: 'blob',
        headers: { 'Content-Type': 'application/html' },
      })
      .then((response) => {
        const urlPdf = URL.createObjectURL(response.data);
        setPdfData(urlPdf);
        URL.revokeObjectURL(pdfData);
      });
  };

  const handlePdfToggle = () => {
    if (!showPdf) generatePdf();
    setShowPdf(!showPdf);
  };

  // Effects
  useEffect(() => {
    if (draft?.status?.name?.includes('individualprint.complete')) navigate(`/letter/preview/${uuid}`);
  }, [draft?.status?.name]);

  useEffect(() => {
    // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--us-letter-inline-pdf-scale').trim();
    setInlinePdfScale(scale);

    axios
      .get(`${APP_API_ENDPOINT}/letters/${uuid}`)
      .then((response) => {
        if (response.data.id !== uuid) {
          navigate(`/draft/${response.data.id}`, { replace: true });
        }

        const letter = response.data;
        if (letter.maySubmitToCentralPrint) setShowCentralPrintButton(true);

        // status must be draft / draft.*
        const status = (letter.status?.name || '').toLowerCase();
        const statusIsDraft = status === 'draft' || status.startsWith('draft.');
        if (!statusIsDraft) {
          setInvalidStatus(true);
          return Promise.reject(Object.assign(new Error('skip'), { skipToast: true }));
        }

        // role / org rules
        const allowed = hasLetterAccess(letter, currentUser);

        if (!allowed) {
          setUnauthorized(true);
          return Promise.reject(Object.assign(new Error('skip'), { skipToast: true }));
        }

        // normal load
        if (letter.vawa) setShowVawaModal(true);
        if (window.endnoteManager) window.endnoteManager.initializeFromLetter(letter);

        setDraft(letter);
        setInitialDraft(sortSectionsByOrder(letter)); // Save initial state for change tracking
        setDraftOrganization(letter.organizationId);
        if (letter.letterType.signatureIncluded && letter.organizationSignature) {
          setDefaultSignature(letter.organizationSignature);
        }
        return null;
      })
      .catch((err) => {
        if (err && err.skipToast) return; // suppress toast for intentional rejections
        renderToast('error', 'Something went wrong, please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const curHeight = letterEditorRef?.current?.portraitUsLetterRef?.current.getBoundingClientRect().height;
    if (curHeight !== letterHeight) setLetterHeight(curHeight);
  });

  // Create editor configuration
  const scribeEditorConfig = {
    showDocumentHeader: draft?.letterType?.headerIncluded ?? true,
    useSignature: true,
    editorTitle: 'Letter Editor',
    showPdfPreviewToggle: true,
    doubleSided: false,
    showLetterRecipients: true,
    showManageContacts: true,
    updatedDateTime: draftUpdatedTime(),
    reviewActions: [
      {
        component: LocalPrintButton,
        props: { onClick: () => finalizeDraft('local') },
        condition: true,
      },
      {
        component: CentralPrintButton,
        props: { onClick: () => finalizeDraft('central') },
        condition: showCentralPrintButton,
      },
      {
        component: CompleteWithoutPrintingButton,
        props: { onClick: () => finalizeDraft('noprint') },
        condition: true,
      },
    ],
    quickActions: [
      { component: SaveButton, props: { onClick: saveDraft } },
      {
        component: ChangeHeaderButton,
        props: { onClick: () => showModal('changeHeader') },
        condition: draft?.letterType?.headerIncluded ?? true,
      },
      {
        component: ChangeSignatureButton,
        props: { onClick: () => showModal('changeSignature') },
        condition: draft?.letterType?.signatureIncluded,
      },
      {
        component: ReassignLetterButton,
        props: { draft, setDraft },
      },
      {
        component: AddEnclosureButton,
        props: { onClick: () => showModal('addEnclosure') },
      },
      {
        component: ActivityLogButton,
        props: { onClick: () => showModal('activityLog') },
      },
      {
        component: DeleteButton,
        props: { onClick: () => showModal('deleteLetter') },
      },
    ],

    toolList: letterEditorToolList,
  };

  if (loading) return <LoadingFallback />;
  if (invalidStatus) return <InvalidStatus heading="Something Went Wrong" />;
  if (unauthorized) return <Unauthorized />;

  return (
    <LetterChangeTracker letterEditorRef={letterEditorRef} initialLetter={initialDraft}>
      {({
        checkForChanges,
        hasDirtyEditors,
        dirtyEditorsCount,
        registerSectionEditor,
        unregisterSectionEditor,
        handleSectionEditorDirty,
        markAllClean,
      }) => {
        // Store checkForChanges in ref for navigation blocking
        checkForChangesRef.current = checkForChanges;

        return (
          <>
            {draft?.letterType?.signatureIncluded && (
              <ChangeSignatureModal
                showModal={isModalOpen('changeSignature')}
                setShowModal={setChangeSignatureModalOpen}
                onSubmit={onSubmitChangeSignature}
                draft={draft}
              />
            )}

            <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} />

            <ActivityLogModal showModal={isModalOpen('activityLog')} hideModal={() => hideModal('activityLog')} letterId={draft.id} />
            <DeleteLetterModal
              showModal={isModalOpen('deleteLetter')}
              setShowModal={setDeleteLetterModalOpen}
              confirmDeleteLetter={confirmDeleteLetter}
            />

            {draft && (
              <>
                <AddEnclosureModal
                  showModal={isModalOpen('addEnclosure')}
                  setShowModal={setAddEnclosureModalOpen}
                  setLetter={setDraft}
                  letter={draft}
                />

                <PrintPreviewErrorModal
                  showModal={isModalOpen('printPreviewError')}
                  setShowModal={setPrintPreviewErrorModalOpen}
                  linguisticErrors={[]}
                  draft={draft}
                />

                <ChangeHeaderModal
                  showModal={isModalOpen('changeHeader')}
                  setShowModal={setChangeHeaderModalOpen}
                  onSubmit={onSubmitChangeHeader}
                  draft={draft}
                />
              </>
            )}

            <ScribeEditor
              documentDetail={draft}
              letterEditorRef={letterEditorRef}
              letterContainerRowRef={letterContainerRowRef}
              showPdf={showPdf}
              pdfData={pdfData}
              defaultSignature={defaultSignature}
              inlinePdfScale={inlinePdfScale}
              letterHeight={letterHeight}
              uuid={uuid}
              SignaturePreview={SignaturePreview}
              scribeEditorConfig={{
                ...scribeEditorConfig,
                quickActions: [
                  { component: SaveButton, props: { onClick: () => saveDraft(markAllClean) } },

                  {
                    component: ChangeHeaderButton,
                    props: { onClick: () => showModal('changeHeader') },
                    condition: draft?.letterType?.headerIncluded ?? true,
                  },
                  {
                    component: ChangeSignatureButton,
                    props: { onClick: () => showModal('changeSignature') },
                    condition: draft?.letterType?.signatureIncluded,
                  },
                  {
                    component: ReassignLetterButton,
                    props: { draft, setDraft },
                  },
                  {
                    component: AddEnclosureButton,
                    props: { onClick: () => showModal('addEnclosure') },
                  },
                  {
                    component: ActivityLogButton,
                    props: { onClick: () => showModal('activityLog') },
                  },
                  {
                    component: DeleteButton,
                    props: { onClick: () => showModal('deleteLetter') },
                  },
                ],
              }}
              handlePdfToggle={handlePdfToggle}
              setHeight={setLetterHeight}
              currentUser={currentUser}
              letterChangeTracking={{
                registerSectionEditor,
                unregisterSectionEditor,
                handleSectionEditorDirty,
              }}
            />
            <VawaModal showModal={showVawaModal} setShowModal={setShowVawaModal} confirmBtnText="Acknowledge" negativeBtnText="Go Back" />
          </>
        );
      }}
    </LetterChangeTracker>
  );
}
