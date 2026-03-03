/* eslint-disable no-console */
/* eslint-disable react/forbid-prop-types */

import React, { forwardRef, useEffect, useState } from 'react';

import { DrButton } from '@druid/druid';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import './ScribeEditor.css';
import CommentHistory from '../../../components/CommentHistory';
import ConfirmModal from '../../../components/ConfirmModal';
import LeaveComment from '../../../components/LeaveComment';
import ReviewActionsBtn from '../../../components/ReviewActionsBtn';
import LetterInformationAccordion from '../../../components/scribeAccordion/LetterInformationAccordion';
import ScribeAccordion from '../../../components/scribeAccordion/ScribeAccordion';
import useModal from '../../../hooks/useModal';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { addCommentToletter, updateLetter, updateLetterStatus } from '../../../http/letters';
import { canApproveDisapproveLetter, canCreateComments, canRunSpellCheck, canSendForReview, canViewComments } from '../../../utils/actionHelpers';
import { showToastError, showToastSuccess, showToastWarning } from '../../../utils/toastHelpers';
import { setHeaderData, updateDraft } from '../LetterUtil';
import PrintPreviewErrorModal from '../PrintPreviewErrorsModal';
import { subscribeIssues } from './scribeDocument/lexical/plugins/spellChecker/SpellCheckBus';
import SpellCheckPluginAccordion from './scribeDocument/lexical/plugins/spellChecker/SpellCheckPluginAccordion';

function SpellcheckSidebarList() {
  const [issues, setIssues] = useState([]);
  useEffect(() => subscribeIssues(setIssues), []);
  return <SpellCheckPluginAccordion issues={issues} />;
}

function IssuesCountBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => subscribeIssues((merged) => setCount(merged.length)), []);
  return count;
}

function hasValidationErrors(draft) {
  return (
    draft.errors?.print ||
    draft.contacts?.some((contact) => contact.errors?.print) ||
    draft.contacts?.some((contact) => contact.address?.errors?.print)
  );
}

const ReviewActionsWrapper = forwardRef(
  ({ uuid, currentUser, documentDetail, isPreview, markAllClean, setDraft, draft, defaultSignature }, letterEditorRef) => {
    const [reload, setReload] = useState(false);
    const [draftData, setDraftData] = useState(documentDetail);

    // State for ConfirmModal
    const [confirmModalState, setConfirmModalState] = useState({
      show: false,
      action: null,
      letterType: null,
    });
    const [comment, setComment] = useState();
    const redirect = useNavigate();

    const { showModal, setModal, isModalOpen } = useModal({
      printPreviewError: false,
    });

    const setPrintPreviewErrorModalOpen = (shouldOpen) => setModal('printPreviewError', shouldOpen);

    const pageType = isPreview ? 'preview' : 'draft';

    const addComment = async (msg = '') => {
      const data = {
        letter_id: uuid,
        user_id: currentUser.id,
        comment: {
          content: msg || comment,
        },
      };

      setReload(false);

      try {
        await addCommentToletter(uuid, currentUser.id, data);
        showToastSuccess('Comment Created Successfully');
        setReload(true);
      } catch (err) {
        showToastError(err?.response?.data?.error);
      }

      setComment('');
    };

    const proceedWithAction = async (statusType) => {
      try {
        await updateLetterStatus(uuid, statusType);

        if (confirmModalState.action === 'approve') {
          addComment('Approved');
        }
        if (confirmModalState.action === 'disapprove') {
          addComment('Disapproved');
        }
        redirect('/');
      } catch (err) {
        showToastError(err?.response?.data?.error);
      }
    };

    const validateAndSendForReview = async (statusType) => {
      try {
        // 1. update the draft with any unsaved changes and mark clean for the letter change tracker
        let savedDraft = await updateDraft(setDraft, letterEditorRef, defaultSignature, draft, markAllClean);

        // 2. reset the rowcol data on the letter if the header doesn't apply
        if (!savedDraft.letterType?.headerIncluded || !savedDraft.header?.active) {
          savedDraft = setHeaderData(savedDraft, true, false);
        }

        // 3. Check for variable validation errors else update the letter status
        const validationErrors = hasValidationErrors(savedDraft);
        if (validationErrors.length > 0) {
          setDraftData(savedDraft);
          showModal('printPreviewError');
        } else {
          savedDraft.status = documentDetail.status;
          savedDraft.statusId = documentDetail.statusId;

          const response = await updateLetter(savedDraft.id, savedDraft);
          setDraftData(response.data);

          await proceedWithAction(statusType);
        }
      } catch (err) {
        console.error(err);
        showToastError('Failed to validate draft. Please try again.');
      }
    };

    const approveOrDisapproveLetter = () => {
      let statusType;
      if (confirmModalState.action === 'approve') statusType = 'submit_approval';
      if (confirmModalState.action === 'disapprove') statusType = 'submit_disapproval';
      if (confirmModalState.action === 'Send for Review') statusType = 'send_for_review';

      // If sending for review, validate recipients first
      if (confirmModalState.action === 'Send for Review') {
        validateAndSendForReview(statusType);
      } else {
        // For approve/disapprove, proceed as normal
        proceedWithAction(statusType);
      }

      setConfirmModalState({
        show: false,
        action: null,
        letterType: null,
      });
    };

    const canView = () => {
      const elements = document.querySelectorAll('#accordian-container');
      if (!elements) return;

      const commentElement = [...elements].find((el) => el.innerText === 'Comment History');
      if (commentElement && !canViewComments(pageType, currentUser, documentDetail)) {
        commentElement.style.display = 'none';
      }
    };

    useEffect(() => {
      canView();
    }, []);

    return (
      <>
        <PrintPreviewErrorModal
          showModal={isModalOpen('printPreviewError')}
          setShowModal={setPrintPreviewErrorModalOpen}
          linguisticErrors={[]}
          draft={draftData}
        />
        {canCreateComments(pageType, currentUser, documentDetail) && (
          <LeaveComment addComment={addComment} documentDetail={documentDetail} setComment={setComment} comment={comment} isPreview={isPreview} />
        )}
        {canApproveDisapproveLetter(pageType, currentUser, documentDetail) && (
          <ReviewActionsBtn setConfirmModalState={setConfirmModalState} isPreview={isPreview} />
        )}
        <ScribeAccordion
          panels={[
            {
              header: 'Comment History',
              content: <CommentHistory endpoint={`${APP_API_ENDPOINT}/letters/${uuid}/comments`} reload={reload} userId={currentUser.id} />,
            },
            {
              header: 'Letter Information',
              content: <LetterInformationAccordion draft={documentDetail} />,
            },
            ...(canRunSpellCheck(pageType, currentUser, documentDetail)
              ? [
                  {
                    header: (
                      <>
                        Spelling and Grammar (<IssuesCountBadge />)
                        <div className="sr-only" aria-live="polite">
                          <IssuesCountBadge /> number of Spelling and Grammar mistakes detected
                        </div>
                      </>
                    ),
                    content: <SpellcheckSidebarList />,
                  },
                ]
              : []),
          ]}
        />
        {canSendForReview(pageType, currentUser, documentDetail) && (
          <div className="d-grid mb-2" id="review-button">
            <DrButton
              onClick={() =>
                setConfirmModalState({
                  show: true,
                  action: 'Send for Review',
                  letterType: documentDetail.letterType?.name,
                })
              }
              styles={{ button: { width: '100%' } }}
              size="medium">
              Send for Review
            </DrButton>
          </div>
        )}
        <ConfirmModal
          showModal={confirmModalState.show}
          setShowModal={(show) => setConfirmModalState((prev) => ({ ...prev, show }))}
          title="Confirm Action"
          message={`Are you sure you want to ${confirmModalState.letterType ? `send ${confirmModalState.letterType} for supervisor review` : confirmModalState.action}?`}
          onConfirm={approveOrDisapproveLetter}
          onCancel={() => setConfirmModalState({ show: false, action: null })}
          confirmLabel="Yes"
          cancelLabel="No"
        />
      </>
    );
  }
);
export default ReviewActionsWrapper;

ReviewActionsWrapper.propTypes = {
  // Props
  uuid: PropTypes.string,
  markAllClean: PropTypes.bool,
  setDraft: PropTypes.any,
  draft: PropTypes.any,
  defaultSignature: PropTypes.any,
  documentDetail: PropTypes.shape({
    id: PropTypes.string,
    endsWith: PropTypes.string,
    startsWith: PropTypes.string,
    sectionsAttributes: PropTypes.array,
    aasmState: PropTypes.string,
    status: PropTypes.any,
    statusId: PropTypes.string,
    letterType: PropTypes.shape({
      name: PropTypes.string,
      headerIncluded: PropTypes.bool,
    }),
    header: PropTypes.any,
    organizationSignature: PropTypes.shape({
      id: PropTypes.string,
    }),
    condition: PropTypes.bool,
  }),
  currentUser: PropTypes.shape({
    id: PropTypes.string,
  }),
  setCommentsError: PropTypes.shape({
    show: PropTypes.bool,
    msg: PropTypes.string,
  }),
  isPreview: PropTypes.bool,
  letterEditorRef: PropTypes.shape({
    current: PropTypes.any,
  }),
};
