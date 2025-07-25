/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { DateTime } from 'luxon';
import { DrButton } from '@druid/druid';
import { FloppyFill, EnvelopeFill, PenFill, Trash3Fill, Paperclip } from 'react-bootstrap-icons';
import { renderToStaticMarkup } from 'react-dom/server';
import renderPdfHtml from './htmlTo508CompliantPdfHtml';
import ActionButton from '../../components/actionButton/ActionButton';
import { createAuthenticatedAxios, APP_API_ENDPOINT, PDF_ENDPOINT } from '../../http/authenticatedAxios';
import './Letter.css';
import { AppContext } from '../../AppProvider';
import { DISABLE_DRAFT_PAGE } from '../../constants';
import VawaModal from '../../components/vawa/VawaModal';

// Import modal components
import ChangeSignatureModal from './ChangeSignatureModal';
import DeleteLetterModal from './DeleteLetterModal';
import PrintPreviewErrorModal from './PrintPreviewErrorsModal';
import ChangeHeaderModal from './ChangeHeaderModal';

// Import our presentational component
import ScribeEditor from './scribeEditor/ScribeEditor';
import SignaturePreview from '../admin/organizations/SignaturePreview';
import AddEnclosureModal from './AddEnclosureModal';
import PrintedFooter from './PrintedFooter';
import LoadingFallback from '../../utils/LoadingFallback';

const standardList = ['undo', 'redo', 'bold', 'italic', 'underline', 'indent', 'outdent', 'numlist', 'bullist', 'alignMenu', 'cut', 'copy', 'paste'];

const letterToolList = {
  leftSide: standardList,
  rightSide: ['endnote', 'table', 'insert'],
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
      text="Change Header"
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
    <DrButton data-testid="localPrintButton" aria-label="Local Print" onClick={onClick}>
      Local Print
    </DrButton>
  );
}

function CentralPrintButton({ onClick }) {
  return (
    <DrButton data-testid="centralPrintButton" aria-label="Central Print" onClick={onClick}>
      Central Print
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

export default function Letter() {
  // Extract parameters and initialize hooks
  const { id: uuid } = useParams();
  const { setDraftOrganization } = useContext(AppContext);
  const navigate = useNavigate();
  const axios = createAuthenticatedAxios();

  // Create refs
  const letterEditorRef = useRef(null);
  const letterContainerRowRef = useRef(null);

  // State hooks
  const [showPdf, setShowPdf] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [curHtml, setCurHtml] = useState({});
  const [defaultSignature, setDefaultSignature] = useState(null);
  const [showChangeSignatureModal, setShowChangeSignatureModal] = useState(false);
  const [showPrintPreviewErrorsModal, setShowPrintPreviewErrorsModal] = useState(false);
  const [showChangeHeaderModal, setShowChangeHeaderModal] = useState(false);
  const [showDeleteLetterModal, setShowDeleteLetterModal] = useState(false);
  const [showAddEnclosureModal, setShowAddEnclosureModal] = useState(false);
  const [inlinePdfScale, setInlinePdfScale] = useState(null);
  const [letterHeight, setLetterHeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVawaModal, setShowVawaModal] = useState(false);

  // Handler functions
  const confirmDeleteLetter = () => {
    axios
      .delete(`${APP_API_ENDPOINT}/letters/${uuid}`)
      .then(() => {
        navigate('/search');
      })
      .catch(() =>
        toast.error('Something went wrong, please try again.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
  };

  const draftUpdatedTime = () => {
    if (!draft) return '';

    const date = DateTime.fromISO(draft.updatedAt);
    return `${date.toLocaleString(DateTime.DATE_SHORT)} @ ${date.toLocaleString(DateTime.TIME_WITH_SECONDS)}`;
  };

  const saveDraft = async () => {
    const draftData = {
      ...letterEditorRef.current.letterDraftData(),
      organizationSignatureId: defaultSignature?.id,
    };

    return axios
      .put(`${APP_API_ENDPOINT}/letters/${draft.id}`, { letter: draftData })
      .then((response) => {
        setDraft(response.data);
        return response.data;
      })
      .catch(() =>
        toast.error('Something went wrong, please try again.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );
  };

  // printType is a string of either 'local' or 'central'
  const finalizeDraft = async (printType) => {
    saveDraft().then((savedDraft) => {
      const draftPrintErrors = savedDraft.errors?.print;
      const contactPrintErrors = savedDraft.contacts?.some((contact) => contact.errors?.print);
      const addressPrintErrors = savedDraft.contacts?.some((contact) => contact.address?.errors?.print);
      if (draftPrintErrors || contactPrintErrors || addressPrintErrors) setShowPrintPreviewErrorsModal(true);
      else
        navigate(`/${DISABLE_DRAFT_PAGE}/preview/${uuid}`, {
          state: {
            totalPageCount: letterEditorRef.current.estimatePrintPages(),
            printType,
          },
        });
    });
  };

  const onSubmitChangeSignature = async (data) => {
    const params = { letter: data };
    const response = await axios.put(`${APP_API_ENDPOINT}/letters/${draft.id}/update_letter_signature`, params);
    setShowChangeSignatureModal(false);
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
    setShowChangeHeaderModal(false);
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

    const printedFooter = renderToStaticMarkup(<PrintedFooter draft={draft} />);
    const finalHtml = printedFooter + htmlContent; // We don't want to join printedFooter with the page break, theres no reason to.

    const data = renderPdfHtml(finalHtml, draft);

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
    if (draft?.statusId?.includes('complete')) navigate(`/letter/preview/${uuid}`);
  }, [draft?.statusId]);

  useEffect(() => {
    // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--us-letter-inline-pdf-scale').trim();
    setInlinePdfScale(scale);

    axios
      .get(`${APP_API_ENDPOINT}/letters/${uuid}`)
      .then((response) => {
        if (response.data.vawa) {
          setShowVawaModal(true);
        }
        setDraft(response.data);
        setDraftOrganization(response.data.organizationId);

        if (response.data.letterType.signatureIncluded && response.data.organizationSignature) {
          setDefaultSignature(response.data.organizationSignature);
        }
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
    showLetterRecipients: draft?.letterType?.headerIncluded ?? true,
    showManageContacts: true,
    updatedDateTime: draftUpdatedTime(),
    reviewActions: [
      {
        component: LocalPrintButton,
        props: { onClick: () => finalizeDraft('local') },
      },
      {
        component: CentralPrintButton,
        props: { onClick: () => finalizeDraft('central') },
      },
    ],
    quickActions: [
      { component: SaveButton, props: { onClick: saveDraft } },
      {
        component: ChangeHeaderButton,
        props: { onClick: () => setShowChangeHeaderModal(true) },
        condition: draft?.letterType?.headerIncluded ?? true,
      },
      {
        component: ChangeSignatureButton,
        props: { onClick: () => setShowChangeSignatureModal(true) },
        condition: draft?.letterType?.signatureIncluded,
      },
      {
        component: AddEnclosureButton,
        props: { onClick: () => setShowAddEnclosureModal(true) },
      },
      {
        component: DeleteButton,
        props: { onClick: () => setShowDeleteLetterModal(true) },
      },
    ],
    toolList: letterToolList,
  };

  if (loading) return <LoadingFallback />;

  return (
    <>
      {draft?.letterType?.signatureIncluded && (
        <ChangeSignatureModal
          showModal={showChangeSignatureModal}
          setShowModal={setShowChangeSignatureModal}
          onSubmit={onSubmitChangeSignature}
          draft={draft}
        />
      )}

      <DeleteLetterModal showModal={showDeleteLetterModal} setShowModal={setShowDeleteLetterModal} confirmDeleteLetter={confirmDeleteLetter} />

      {draft && (
        <>
          <AddEnclosureModal showModal={showAddEnclosureModal} setShowModal={setShowAddEnclosureModal} setLetter={setDraft} letter={draft} />

          <PrintPreviewErrorModal
            showModal={showPrintPreviewErrorsModal}
            setShowModal={setShowPrintPreviewErrorsModal}
            linguisticErrors={[]}
            draft={draft}
          />

          <ChangeHeaderModal
            showModal={showChangeHeaderModal}
            setShowModal={setShowChangeHeaderModal}
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
        scribeEditorConfig={scribeEditorConfig}
        handlePdfToggle={handlePdfToggle}
        setHeight={setLetterHeight}
      />
      <VawaModal showModal={showVawaModal} setShowModal={setShowVawaModal} />
    </>
  );
}
