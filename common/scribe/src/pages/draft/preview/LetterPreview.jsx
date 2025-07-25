/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
import { toast, Flip } from 'react-toastify';
import { ArrowLeft, ArrowCounterclockwise } from 'react-bootstrap-icons';
import fileDownload from 'js-file-download';
import { renderToStaticMarkup } from 'react-dom/server';
import ActionButton from '../../../components/actionButton/ActionButton';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import * as Util from '../../contacts/ContactUtils';
import './DraftPreview.css';
import renderPdfHtml from '../htmlTo508CompliantPdfHtml';
import { draftToPdfHtml } from '../scribeEditor/scribeDocument/ScribeDocumentUtil';
import ChangeStatusModal from './ChangeStatusModal';
import ScribeEditor from '../scribeEditor/ScribeEditor';
import * as PreviewUtil from './PreviewUtils';
import PrintedFooter from '../PrintedFooter';
import { generatePdf, DownLoadPdfButton } from './PreviewUtils';
import useMultiRequestLoading from '../../../hooks/useMultiRequestLoading';
import LoadingGuard from '../../../guards/LoadingGuard';
import VawaModal from '../../../components/vawa/VawaModal';

export const PAGE_BREAK = '<div style="break-after: page;"></div>';

// Define action button components
function BackToSearchButton({ onClick }) {
  return (
    <ActionButton
      data-testid="backToSearch"
      id="saveDrbackToSearch"
      title="Back to Search"
      aria-label="Back to search"
      onClick={onClick}
      icon={ArrowLeft}
      text="Back to Search"
    />
  );
}

function RevertDeletionButton({ onClick }) {
  return (
    <ActionButton
      data-testid="changeStatusButton"
      id="changeStatusButton"
      title="Revert Deletion"
      aria-label="Revert Deletion"
      onClick={onClick}
      icon={ArrowCounterclockwise}
      text="Revert Deletion"
    />
  );
}

export default function LetterPreview() {
  const navigate = useNavigate();
  const DELETED_STATUS = 'deleted';
  const DRAFT_STATUS = 'draft';
  const axios = createAuthenticatedAxios();
  const { id: uuid } = useParams();

  const letterEditorRef = useRef(null);
  const letterContainerRowRef = useRef(null);

  // State hooks
  const [draft, setDraft] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [inlinePdfScale, setInlinePdfScale] = useState(null);

  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [supportingDocuments, setSupportingDocuments] = useState(null);
  const [showVawaModal, setShowVawaModal] = useState(false);

  const contacts = () => draft?.contacts || [];
  const recipients = Util.letterRecipients(contacts());
  const { loading, markFinished } = useMultiRequestLoading(2);

  // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
  useEffect(() => {
    setInlinePdfScale(PreviewUtil.pdfScale());
  }, []);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const firstContact = recipients[0];

    if (!firstContact) {
      return;
    }

    setSelectedRecipientId(firstContact.id);
    generatePdf(draft, firstContact.id, supportingDocuments, pdfData, setPdfData, 0);
  }, [
    draft?.row1Col1,
    draft?.row1Col2,
    draft?.row2Col1,
    draft?.row2Col2,
    draft?.row3Col1,
    draft?.row3Col2,
    draft?.startsWith,
    draft?.endsWith,
    draft?.sections,
    supportingDocuments,
  ]);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letters/${uuid}`)
      .then((response) => {
        setDraft(response.data);
        if (response.data.vawa) {
          setShowVawaModal(true);
        }
      })
      .catch(() => {
        toast.error('Encountered an unknown error retrieving the draft.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  }, []);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/supporting_documents/supporting_documents_for_lettertype_formtype`, {
        params: {
          letter_type_id: draft?.letterTypeId,
          form_type_code: draft?.registration?.formTypeName,
        },
      })
      .then((response) => {
        setSupportingDocuments(response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Supporting Document list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  }, [draft]);

  const changeStatusToDraft = () => {
    const params = { letter: { statusId: DRAFT_STATUS } };
    axios.put(`${APP_API_ENDPOINT}/letters/${draft.id}/update_status`, params).then(async (response) => {
      setDraft({ ...draft, statusId: response.data.statusId });
      navigate('/');
    });
  };

  const handleCardOnClick = (recipientId) => {
    setSelectedRecipientId(recipientId);
    generatePdf(draft, recipientId, supportingDocuments, pdfData, setPdfData, 0);
  };

  const downloadPdf = () => {
    if (!draft) {
      return;
    }

    const html = draftToPdfHtml(draft, { recipientId: selectedRecipientId });
    const pdfHtml = renderPdfHtml(html, draft);
    const recipient = recipients.find((item) => item.id === selectedRecipientId);

    const { prependSupportingDocuments, appendSupportingDocuments } = PreviewUtil.splitSupportingDocuments(supportingDocuments, recipient);

    const htmlDocumentFinalPageBreak = [...prependSupportingDocuments, pdfHtml, ...appendSupportingDocuments].join(PAGE_BREAK);

    const printedFooter = renderToStaticMarkup(<PrintedFooter draft={draft} />);
    const finalHtml = printedFooter + htmlDocumentFinalPageBreak;

    PreviewUtil.pdfGenerationCall(finalHtml).then((response) => {
      if (response && response.data) {
        if (pdfData) URL.revokeObjectURL(pdfData);

        const urlPdf = URL.createObjectURL(response.data);
        setPdfData(urlPdf);

        fileDownload(response.data, `${PreviewUtil.letterFileName(draft)}.pdf`);

        toast.success('PDF Letter Generating!', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
          toastId: 'draft',
          autoClose: 600,
        });
      }
    });
  };

  const returnToSearch = () => navigate('/searchLetters');

  const getQuickActions = () => {
    const defaultQuickActions = [
      {
        component: BackToSearchButton,
        props: { onClick: () => returnToSearch() },
      },
      {
        component: DownLoadPdfButton,
        props: { onClick: () => downloadPdf() },
      },
    ];

    if (draft?.statusId === DELETED_STATUS) {
      defaultQuickActions.push({
        component: RevertDeletionButton,
        props: { onClick: () => setShowChangeStatusModal(true) },
      });
    }
    return defaultQuickActions;
  };

  // Create editor configuration
  const scribeEditorConfig = {
    showDocumentHeader: true,
    editorTitle: `View ${PreviewUtil.capitalizeFirstLetter(draft?.statusId)} Letter | ${draft?.registration?.receiptNumber}`,
    showLetterRecipients: true,
    letterPreviewMode: true,
    quickActions: getQuickActions(),
  };

  return (
    <LoadingGuard loading={loading} blank>
      <>
        <ChangeStatusModal
          showChangeStatusModal={showChangeStatusModal}
          setShowChangeStatusModal={setShowChangeStatusModal}
          changeStatus={changeStatusToDraft}
        />

        {draft && (
          <ScribeEditor
            documentDetail={draft}
            letterEditorRef={letterEditorRef}
            letterContainerRowRef={letterContainerRowRef}
            showPdf
            pdfData={pdfData}
            inlinePdfScale={inlinePdfScale}
            uuid={uuid}
            scribeEditorConfig={scribeEditorConfig}
            handleCardOnClick={handleCardOnClick} // Letter Preview recipient cards
            previewRecipientId={selectedRecipientId}
          />
        )}

        <VawaModal showModal={showVawaModal} setShowModal={setShowVawaModal} />
      </>
    </LoadingGuard>
  );
}
