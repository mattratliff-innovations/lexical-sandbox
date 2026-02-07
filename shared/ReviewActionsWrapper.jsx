import React, { useEffect, useState } from 'react';

import { DrButton } from '@druid/druid';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Flip, toast } from 'react-toastify';

import './ScribeEditor.css';
import CommentHistory from '../../../components/CommentHistory';
import ConfirmModal from '../../../components/ConfirmModal';
import LeaveComment from '../../../components/LeaveComment';
import ReviewActionsBtn from '../../../components/ReviewActionsBtn';
import LetterInformationAccordion from '../../../components/scribeAccordion/LetterInformationAccordion';
import ScribeAccordion from '../../../components/scribeAccordion/ScribeAccordion';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../../http/authenticatedAxios';
import { canApproveDisapproveLetter, canCreateComments, canRunSpellCheck, canSendForReview, canViewComments } from '../../../utils/actionHelpers';
import { subscribeIssues } from './scribeDocument/lexical/plugins/spellChecker/SpellCheckBus';
import SpellCheckPluginAccordion from './scribeDocument/lexical/plugins/spellChecker/SpellCheckPluginAccordion';

export default function ReviewActionsWrapper({ uuid, currentUser, documentDetail, isPreview }) {
  const axios = createAuthenticatedAxios();
  const [reload, setReload] = useState(false);
  // State for ConfirmModal
  const [confirmModalState, setConfirmModalState] = useState({
    show: false,
    action: null,
    letterType: null,
  });
  const [comment, setComment] = useState();
  const redirect = useNavigate();

  const pageType = isPreview ? 'preview' : 'draft';

  const addComment = (msg = '') => {
    const data = {
      letter_id: uuid,
      comment: {
        content: msg || comment,
      },
    };

    axios
      .post(`${APP_API_ENDPOINT}/letters/${uuid}/comments/create/${currentUser.id}`, data, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => {
        setReload(true);
      })
      .catch((err) =>
        toast.error(err?.response?.data?.error, {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );

    setReload(false);
    setComment('');
  };

  const approveOrDisapproveLetter = () => {
    let statusType;
    if (confirmModalState.action === 'approve') statusType = 'submit_approval';
    if (confirmModalState.action === 'disapprove') statusType = 'submit_disapproval';
    if (confirmModalState.action === 'Send for Review') statusType = 'send_for_review';

    axios.put(`${APP_API_ENDPOINT}/letters/${uuid}/${statusType}`).then(() => {
      if (confirmModalState.action === 'approve') {
        addComment('Approved');
      }
      if (confirmModalState.action === 'disapprove') {
        addComment('Disapproved');
      }
      redirect('/');
    });

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
      {canCreateComments(pageType, currentUser, documentDetail) && (
        <LeaveComment
          className="mb-4"
          addComment={addComment}
          documentDetail={documentDetail}
          setComment={setComment}
          comment={comment}
          isPreview={isPreview}
        />
      )}
      {canApproveDisapproveLetter(pageType, currentUser, documentDetail) && (
        <ReviewActionsBtn setConfirmModalState={setConfirmModalState} isPreview={isPreview} />
      )}
      <ScribeAccordion
        panels={[
          {
            header: 'Comment History',
            content: <CommentHistory endpoint={`/api/scribe/v1/letters/${uuid}/comments/accessible_by/${currentUser.id}`} reload={reload} />,
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

ReviewActionsWrapper.propTypes = {
  // Props
  uuid: PropTypes.string,
  documentDetail: PropTypes.shape({
    aasmState: PropTypes.string,
    letterType: PropTypes.shape({
      name: PropTypes.string,
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
};

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
