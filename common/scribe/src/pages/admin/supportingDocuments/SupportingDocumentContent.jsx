/* eslint-disable react/button-has-type, react/prop-types, require-loading-check-for-axios  */
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { DateTime } from 'luxon';
import { ArrowLeft, PrinterFill } from 'react-bootstrap-icons';
import { DrButton } from '@druid/druid';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import ActionButton from '../../../components/actionButton/ActionButton';
import ScribeEditor from '../../draft/scribeEditor/ScribeEditor';

const standardList = ['undo', 'redo', 'bold', 'italic', 'underline', 'indent', 'outdent', 'numlist', 'bullist', 'alignMenu', 'cut', 'copy', 'paste'];

const letterToolList = {
  leftSide: standardList,
  rightSide: ['table', 'insert'],
};

// Quick Actions
function SaveSupportingDocumentQuickAction({ onClick }) {
  return (
    <ActionButton
      data-testid="saveDocument"
      id="saveDocument"
      title="Save Supporting Document"
      aria-label="Save Supporting Document"
      onClick={onClick}
      icon={PrinterFill}
      text="Save Supporting Document"
    />
  );
}

function BackToDocumentDetailsQuickAction({ onClick }) {
  return (
    <ActionButton
      data-testid="backToDocumentDetails"
      id="backToDocumentDetails"
      title="Back to Document Details"
      aria-label="Back to Document Details"
      onClick={onClick}
      icon={ArrowLeft}
      text="Back to Document Details"
    />
  );
}

// Buttons
function SaveSupportingDocumentButton({ onClick }) {
  return (
    <DrButton data-testid="saveButton" id="create-button" className="btn-size" onClick={onClick}>
      Save
    </DrButton>
  );
}

function BackToDocumentDetailsButton({ onClick }) {
  return (
    <DrButton data-testid="backButton" className="btn-size" ariaLabel="Back to Details" onClick={onClick}>
      Back to Details
    </DrButton>
  );
}
function CancelButton({ onClick }) {
  return (
    <DrButton data-testid="cancelButton" className="btn-size" variant="secondary" ariaLabel="Cancel" onClick={onClick}>
      Cancel
    </DrButton>
  );
}

export default function SupportingDocumentContent() {
  // Extract parameters and initialize hooks
  const { id: uuid } = useParams();

  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();

  // Create refs
  const letterEditorRef = useRef(null);
  const letterContainerRowRef = useRef(null);

  // State hooks
  const [supportingDocument, setSupportingDocument] = useState(null);
  const [inlinePdfScale, setInlinePdfScale] = useState(null);
  const [letterHeight, setLetterHeight] = useState(null);

  const draftUpdatedTime = () => {
    if (!supportingDocument) return '';

    const date = DateTime.fromISO(supportingDocument.updatedAt);
    return `${date.toLocaleString(DateTime.DATE_SHORT)} @ ${date.toLocaleString(DateTime.TIME_WITH_SECONDS)}`;
  };

  const saveDraft = async () => {
    const contentData = {
      supporting_document: {
        id: uuid,
        supporting_document_sections_attributes: letterEditorRef?.current?.letterDraftData()?.sectionsAttributes,
      },
    };

    return axios
      .post(`${APP_API_ENDPOINT}/supporting_documents/create_update_section/${uuid}`, contentData)
      .then((response) => {
        // Add section key to supportingDocument
        response.data.sections = response.data.supportingDocumentSections;
        setSupportingDocument(response.data);
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

  useEffect(() => {
    // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--us-letter-inline-pdf-scale').trim();
    setInlinePdfScale(scale);

    axios.get(`${APP_API_ENDPOINT}/supporting_documents/${uuid}`).then((response) => {
      // Add a sections key for the ScribeEditor
      response.data.sections = response.data.supportingDocumentSections;
      setSupportingDocument(response.data);
    });
  }, []);

  useEffect(() => {
    const curHeight = letterEditorRef?.current?.portraitUsLetterRef?.current.getBoundingClientRect().height;
    if (curHeight !== letterHeight) setLetterHeight(curHeight);
  });

  const backToDocumentDetails = () => redirect(`/admin/supportingdocuments/${uuid}`);

  const backToSupportDocumentList = () => redirect(`/admin/supportingdocuments`);

  // Create editor configuration
  const scribeEditorConfig = {
    useSignature: false,
    editorTitle: 'Supporting Document Content',
    updatedDateTime: draftUpdatedTime(),
    reviewActions: [],
    quickActions: [
      {
        component: BackToDocumentDetailsQuickAction,
        props: { onClick: () => backToDocumentDetails() },
      },
      {
        component: SaveSupportingDocumentQuickAction,
        props: { onClick: () => saveDraft() },
      },
    ],
    toolList: letterToolList,
    buttonActions: [
      {
        component: SaveSupportingDocumentButton,
        props: { onClick: () => saveDraft() },
      },
      {
        component: BackToDocumentDetailsButton,
        props: { onClick: () => backToDocumentDetails() },
      },
      {
        component: CancelButton,
        props: { onClick: () => backToSupportDocumentList() },
      },
    ],
  };

  return (
    <ScribeEditor
      documentDetail={supportingDocument}
      letterEditorRef={letterEditorRef}
      letterContainerRowRef={letterContainerRowRef}
      inlinePdfScale={inlinePdfScale}
      letterHeight={letterHeight}
      uuid={uuid}
      scribeEditorConfig={scribeEditorConfig}
      setHeight={setLetterHeight}
    />
  );
}
