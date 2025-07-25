/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import { React, useState, useEffect, useRef } from 'react';
import { toast, Flip } from 'react-toastify';
import { DISABLE_DRAFT_PAGE } from '../../../constants';
import ActionButton from '../../../components/actionButton/ActionButton';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import * as Util from '../../contacts/ContactUtils';
import './DraftPreview.css';
import DefaultModal from '../../util/DefaultModal';
import DecisionModal from '../../util/DecisionModal';
import ScribeEditor from '../scribeEditor/ScribeEditor';
import * as PreviewUtil from './PreviewUtils';
import { PrintAllLettersButton, generatePdf, printMergedPdf } from './PreviewUtils';
import LoadingGuard from '../../../guards/LoadingGuard';

export const PAGE_BREAK = '<div style="break-after: page;"></div>';
export const LOCAL_COMPLETE_STATUS = 'complete-local';
export const CONFIRMATION_MESSAGE = 'Are you sure you want to print all letters?';
export const CONFIRMATION_MESSAGE_NOTE = 'Note: This will move the letter from Draft status to Done and it will no longer be editable.';
export const DIRECTION_MESSAGE = 'It can be searched and viewed on the Search tab by hitting the View Letter option below.';

function BackToDraftButton({ onClick }) {
  return (
    <ActionButton
      data-testid="backToDraft"
      id="backToDraft"
      title="Back to Draft"
      aria-label="Back to Draft"
      onClick={onClick}
      icon={ArrowLeft}
      text="Back to Draft"
    />
  );
}

export default function DraftPreview() {
  const axios = createAuthenticatedAxios();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [draft, setDraft] = useState(null);
  const [previewRecipientId, setPreviewRecipientId] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [doubleSided, setDoubleSided] = useState(false);
  const [totalPageCount] = useState(location.state?.totalPageCount || 0);
  const [printType] = useState(location.state?.printType || 'local');
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [supportingDocuments, setSupportingDocuments] = useState(null);
  const letterContainerRowRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const contacts = () => draft?.contacts || [];
  const recipients = Util.letterRecipients(contacts());

  const getTotalPages = () => (doubleSided ? totalPageCount / 2 : totalPageCount);

  const [inlinePdfScale, setInlinePdfScale] = useState(null);
  // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
  useEffect(() => {
    setInlinePdfScale(PreviewUtil.pdfScale());
  }, []);

  useEffect(() => {
    const firstContact = recipients[0];
    if (!draft || !firstContact || !supportingDocuments) return;

    setPreviewRecipientId(firstContact.id);
    generatePdf(draft, firstContact.id, supportingDocuments, pdfData, setPdfData, getTotalPages());
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
    doubleSided,
    supportingDocuments,
    draft?.enclosures,
  ]);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letters/${id}`)
      .then((letterResponse) => {
        setDraft(letterResponse.data);
        return axios.get(`${APP_API_ENDPOINT}/supporting_documents/supporting_documents_for_lettertype_formtype`, {
          params: {
            letter_type_id: letterResponse.data?.letterTypeId,
            form_type_code: letterResponse.data?.registration?.formTypeName,
          },
        });
      })
      .then((supportingDocResponse) => {
        setSupportingDocuments(supportingDocResponse.data);
      })
      .catch(() => {
        toast.error('Encountered an unknown error retrieving the draft.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCardOnClick = (recipientId) => {
    setPreviewRecipientId(recipientId);
    generatePdf(draft, recipientId, supportingDocuments, pdfData, setPdfData, getTotalPages());
  };

  const updateStatus = async () => {
    const params = { letter: { statusId: LOCAL_COMPLETE_STATUS } };
    axios.put(`${APP_API_ENDPOINT}/letters/${draft.id}/update_status`, params).then(async (response) => {
      setDraft({
        ...draft,
        statusId: response.data.statusId,
      });
    });
  };

  const markLocalComplete = () => {
    printMergedPdf(draft, supportingDocuments);
    if (draft.statusId !== LOCAL_COMPLETE_STATUS) updateStatus();
    setShowDefaultModal(false);
  };

  const confirmPrintAll = () => {
    setShowDefaultModal(false);
    markLocalComplete();
    setShowDecisionModal(true);
  };

  const handleDoubleSidedToggle = () => setDoubleSided((previousDoubleSided) => !previousDoubleSided);

  const backToDraft = () => navigate(`/${DISABLE_DRAFT_PAGE}/${id}`);

  // Create editor configuration
  const scribeEditorConfig = {
    showDocumentHeader: true,
    editorTitle: `${PreviewUtil.capitalizeFirstLetter(printType)} Print Preview`,
    doubleSided: true,
    showLetterRecipients: true,
    showManageContacts: true,
    letterPreviewMode: true,
    quickActions: [
      {
        component: PrintAllLettersButton,
        props: { onClick: () => setShowDefaultModal(true) },
      },
      {
        component: BackToDraftButton,
        props: { onClick: () => backToDraft() },
      },
    ],
  };

  const returnHome = () => {
    navigate('/');
  };

  const viewLetter = () => {
    navigate('/searchLetters');
  };

  const creatStatusUpdateMessage = () => {
    const message = `Letter ${draft?.locatorCode} was moved to Complete-Local. ${DIRECTION_MESSAGE}`;
    return message;
  };

  return (
    <LoadingGuard loading={loading} blank>
      <>
        <DefaultModal
          showModal={showDefaultModal}
          setShowModal={setShowDefaultModal}
          onSubmit={confirmPrintAll}
          defaultMessage={CONFIRMATION_MESSAGE}
          declineButton="Cancel"
          confirmButton="Confirm"
          defaultNote={CONFIRMATION_MESSAGE_NOTE}
        />

        <DecisionModal
          showModal={showDecisionModal}
          setShowModal={setShowDecisionModal}
          onSubmitOptionOne={returnHome}
          onSubmitOptionTwo={viewLetter}
          message={creatStatusUpdateMessage()}
          header="Status Updated"
          optionOneLabel="Return Home"
          optionTwoLabel="View Letter"
        />

        <ScribeEditor
          documentDetail={draft}
          letterContainerRowRef={letterContainerRowRef}
          showPdf
          pdfData={pdfData}
          inlinePdfScale={inlinePdfScale}
          uuid={id}
          scribeEditorConfig={scribeEditorConfig}
          handleCardOnClick={handleCardOnClick} // Letter Preview recipient cards
          handleDoubleSidedToggle={handleDoubleSidedToggle}
          previewRecipientId={previewRecipientId}
        />
      </>
    </LoadingGuard>
  );
}
