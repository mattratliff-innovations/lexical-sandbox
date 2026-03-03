/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

import ReviewActionsWrapper from './ReviewActionsWrapper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { canApproveDisapproveLetter, canCreateComments, canRunSpellCheck, canSendForReview, canViewComments } from '../../../utils/actionHelpers';

// Mock dependencies FIRST - before any imports that might use them
const mockAxios = new MockAdapter(axios);
const mockedUseNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
  Flip: 'Flip',
}));

// Mock spell check bus - this is critical
jest.mock('./scribeDocument/lexical/plugins/spellChecker/SpellCheckBus', () => ({
  subscribeIssues: jest.fn((callback) => {
    // Immediately call the callback with empty array
    callback([]);
    // Return unsubscribe function
    return jest.fn();
  }),
}));

// Mock all action helpers
jest.mock('../../../utils/actionHelpers', () => ({
  canApproveDisapproveLetter: jest.fn(),
  canCreateComments: jest.fn(),
  canRunSpellCheck: jest.fn(),
  canSendForReview: jest.fn(),
  canViewComments: jest.fn(),
}));

// Mock all child components - using factory functions
jest.mock('../../../components/CommentHistory', () => ({
  __esModule: true,
  default: function MockCommentHistory({ endpoint, reload }) {
    return (
      <div data-testid="comment-history">
        Comment History
        <span data-testid="comment-history-endpoint">{endpoint}</span>
        <span data-testid="comment-history-reload">{reload ? 'true' : 'false'}</span>
      </div>
    );
  },
}));

jest.mock('../../../components/ConfirmModal', () => ({
  __esModule: true,
  default: function MockConfirmModal({ showModal, onConfirm, onCancel, message, title }) {
    if (!showModal) return null;
    return (
      <div data-testid="confirm-modal">
        <h3>{title}</h3>
        <p data-testid="modal-message">{message}</p>
        <button data-testid="modal-confirm" onClick={onConfirm}>
          Confirm
        </button>
        <button data-testid="modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('../../../components/LeaveComment', () => ({
  __esModule: true,
  default: function MockLeaveComment({ addComment, setComment, comment, _documentDetail, _isPreview }) {
    return (
      <div data-testid="leave-comment">
        <input data-testid="comment-input" type="text" value={comment || ''} onChange={(e) => setComment(e.target.value)} />
        <button data-testid="add-comment-button" onClick={() => addComment()}>
          Add Comment
        </button>
      </div>
    );
  },
}));

jest.mock('../../../components/ReviewActionsBtn', () => ({
  __esModule: true,
  default: function MockReviewActionsBtn({ setConfirmModalState, _isPreview }) {
    return (
      <div data-testid="review-actions-btn">
        <button
          data-testid="approve-button"
          onClick={() =>
            setConfirmModalState({
              show: true,
              action: 'approve',
              letterType: null,
            })
          }>
          Approve
        </button>
        <button
          data-testid="disapprove-button"
          onClick={() =>
            setConfirmModalState({
              show: true,
              action: 'disapprove',
              letterType: null,
            })
          }>
          Disapprove
        </button>
      </div>
    );
  },
}));

jest.mock('../../../components/scribeAccordion/LetterInformationAccordion', () => ({
  __esModule: true,
  default: function MockLetterInformationAccordion({ _draft }) {
    return <div data-testid="letter-information">Letter Information</div>;
  },
}));

jest.mock('../../../components/scribeAccordion/ScribeAccordion', () => ({
  __esModule: true,
  default: function MockScribeAccordion({ panels }) {
    return (
      <div data-testid="scribe-accordion">
        {panels.map((panel, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} data-testid={`accordion-panel-${index}`} id="accordian-container">
            <div data-testid={`accordion-header-${index}`}>{typeof panel.header === 'string' ? panel.header : 'Header with Component'}</div>
            <div data-testid={`accordion-content-${index}`}>{panel.content}</div>
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('./scribeDocument/lexical/plugins/spellChecker/SpellCheckPluginAccordion', () => ({
  __esModule: true,
  default: function MockSpellCheckPluginAccordion({ issues }) {
    return <div data-testid="spell-check-accordion">Spell Check Issues: {issues?.length || 0}</div>;
  },
}));

// Test data
const mockCurrentUser = {
  id: 'user-123',
  role: 'reviewer',
};

const mockDocumentDetail = {
  id: 'letter-456',
  aasmState: 'draft',
  letterType: {
    id: 'letter-type-789',
    name: 'I-485 Adjustment of Status',
  },
  condition: true,
};

const mockUuid = 'letter-456';

// Helper function to render component
const renderComponent = (props = {}) => {
  const defaultProps = {
    uuid: mockUuid,
    currentUser: mockCurrentUser,
    documentDetail: mockDocumentDetail,
    isPreview: false,
    ...props,
  };

  return render(
    <MemoryRouter>
      <ReviewActionsWrapper {...defaultProps} />
    </MemoryRouter>
  );
};

describe('ReviewActionsWrapper', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockedUseNavigate.mockClear();

    // Reset all action helper mocks to false by default
    canApproveDisapproveLetter.mockReturnValue(false);
    canCreateComments.mockReturnValue(false);
    canRunSpellCheck.mockReturnValue(false);
    canSendForReview.mockReturnValue(false);
    canViewComments.mockReturnValue(true);
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('scribe-accordion')).toBeInTheDocument();
    });

    it('always renders ScribeAccordion', () => {
      renderComponent();
      expect(screen.getByTestId('scribe-accordion')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Based on Permissions', () => {
    it('renders LeaveComment when user can create comments', () => {
      canCreateComments.mockReturnValue(true);
      renderComponent();

      expect(screen.getByTestId('leave-comment')).toBeInTheDocument();
      expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    });

    it('does not render LeaveComment when user cannot create comments', () => {
      canCreateComments.mockReturnValue(false);
      renderComponent();

      expect(screen.queryByTestId('leave-comment')).not.toBeInTheDocument();
    });

    it('renders ReviewActionsBtn when user can approve/disapprove', () => {
      canApproveDisapproveLetter.mockReturnValue(true);
      renderComponent();

      expect(screen.getByTestId('review-actions-btn')).toBeInTheDocument();
      expect(screen.getByTestId('approve-button')).toBeInTheDocument();
      expect(screen.getByTestId('disapprove-button')).toBeInTheDocument();
    });

    it('does not render ReviewActionsBtn when user cannot approve/disapprove', () => {
      canApproveDisapproveLetter.mockReturnValue(false);
      renderComponent();

      expect(screen.queryByTestId('review-actions-btn')).not.toBeInTheDocument();
    });

    it('renders Send for Review button when user can send for review', () => {
      canSendForReview.mockReturnValue(true);
      renderComponent();

      const sendButton = screen.getByText('Send for Review');
      expect(sendButton).toBeInTheDocument();
    });

    it('does not render Send for Review button when user cannot send for review', () => {
      canSendForReview.mockReturnValue(false);
      renderComponent();

      expect(screen.queryByText('Send for Review')).not.toBeInTheDocument();
    });

    it('includes spell check panel when user can run spell check', () => {
      canRunSpellCheck.mockReturnValue(true);
      renderComponent();

      expect(screen.getByTestId('spell-check-accordion')).toBeInTheDocument();
    });

    it('does not include spell check panel when user cannot run spell check', () => {
      canRunSpellCheck.mockReturnValue(false);
      renderComponent();

      expect(screen.queryByTestId('spell-check-accordion')).not.toBeInTheDocument();
    });
  });

  describe('PageType Determination', () => {
    it('passes "draft" pageType when isPreview is false', () => {
      canCreateComments.mockReturnValue(true);
      renderComponent({ isPreview: false });

      expect(canCreateComments).toHaveBeenCalledWith('draft', mockCurrentUser, mockDocumentDetail);
    });

    it('passes "preview" pageType when isPreview is true', () => {
      canCreateComments.mockReturnValue(true);
      renderComponent({ isPreview: true });

      expect(canCreateComments).toHaveBeenCalledWith('preview', mockCurrentUser, mockDocumentDetail);
    });
  });

  describe('Comment Functionality', () => {
    beforeEach(() => {
      canCreateComments.mockReturnValue(true);
    });

    it('successfully adds a comment', async () => {
      const userInstance = userEvent.setup();
      const successMessage = 'Comment Created Successfully';

      mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${mockUuid}/comments`).reply(200, { success: true });

      renderComponent();

      const commentInput = screen.getByTestId('comment-input');
      const addButton = screen.getByTestId('add-comment-button');

      await userInstance.type(commentInput, 'This is a test comment');
      await userInstance.click(addButton);

      await waitFor(() => {
        expect(mockAxios.history.post.length).toBe(1);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          successMessage,
          expect.objectContaining({
            position: 'top-center',
            theme: 'dark',
          })
        );
      });
    });

    it('clears comment input after successful submission', async () => {
      const userInstance = userEvent.setup();

      mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${mockUuid}/comments`).reply(200, { success: true });

      renderComponent();

      const commentInput = screen.getByTestId('comment-input');
      const addButton = screen.getByTestId('add-comment-button');

      await userInstance.type(commentInput, 'Test comment');
      await userInstance.click(addButton);

      await waitFor(() => {
        expect(commentInput).toHaveValue('');
      });
    });

    it('displays error toast when comment creation fails', async () => {
      const userInstance = userEvent.setup();
      const errorMessage = 'Failed to create comment';

      mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${mockUuid}/comments`).reply(400, { error: errorMessage });

      renderComponent();

      const commentInput = screen.getByTestId('comment-input');
      const addButton = screen.getByTestId('add-comment-button');

      await userInstance.type(commentInput, 'Test comment');
      await userInstance.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          errorMessage,
          expect.objectContaining({
            position: 'top-center',
            theme: 'dark',
          })
        );
      });
    });
  });

  describe('Approval Actions', () => {
    beforeEach(() => {
      canApproveDisapproveLetter.mockReturnValue(true);
    });

    it('shows confirmation modal when approve button is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      const approveButton = screen.getByTestId('approve-button');
      await userInstance.click(approveButton);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-message')).toHaveTextContent(/approve/i);
    });

    it('approves letter and navigates home on confirmation', async () => {
      const userInstance = userEvent.setup();

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockUuid}/submit_approval`).reply(200, { success: true });

      mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${mockUuid}/comments`).reply(200, { success: true });

      renderComponent();

      const approveButton = screen.getByTestId('approve-button');
      await userInstance.click(approveButton);

      const confirmButton = screen.getByTestId('modal-confirm');
      await userInstance.click(confirmButton);

      await waitFor(() => {
        expect(mockAxios.history.put.length).toBe(1);
        expect(mockAxios.history.put[0].url).toContain('submit_approval');
      });

      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    });

    it('disapproves letter and adds Disapproved comment', async () => {
      const userInstance = userEvent.setup();

      mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockUuid}/submit_disapproval`).reply(200, { success: true });

      mockAxios.onPost(`${APP_API_ENDPOINT}/letters/${mockUuid}/comments`).reply(200, { success: true });

      renderComponent();

      const disapproveButton = screen.getByTestId('disapprove-button');
      await userInstance.click(disapproveButton);

      const confirmButton = screen.getByTestId('modal-confirm');
      await userInstance.click(confirmButton);

      await waitFor(() => {
        expect(mockAxios.history.put.length).toBe(1);
        expect(mockAxios.history.put[0].url).toContain('submit_disapproval');
      });

      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    });

    it('cancels approval when cancel button is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      const approveButton = screen.getByTestId('approve-button');
      await userInstance.click(approveButton);

      const cancelButton = screen.getByTestId('modal-cancel');
      await userInstance.click(cancelButton);

      expect(mockAxios.history.put.length).toBe(0);
      expect(mockedUseNavigate).not.toHaveBeenCalled();
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });
  });

  describe('Send for Review Action', () => {
    beforeEach(() => {
      canSendForReview.mockReturnValue(true);
    });

    it('handles missing letter type in confirmation message', async () => {
      const userInstance = userEvent.setup();

      const documentWithoutLetterType = {
        ...mockDocumentDetail,
        letterType: null,
      };

      renderComponent({ documentDetail: documentWithoutLetterType });

      const sendButton = screen.getByText('Send for Review');
      await userInstance.click(sendButton);

      expect(screen.getByTestId('modal-message')).toHaveTextContent(/Send for Review/i);
    });
  });

  describe('Accordion Panels', () => {
    it('renders Comment History panel with correct endpoint', () => {
      renderComponent();

      const expectedEndpoint = `/api/scribe/v1/letters/${mockUuid}/comments`;

      expect(screen.getByTestId('comment-history')).toBeInTheDocument();
      expect(screen.getByTestId('comment-history-endpoint')).toHaveTextContent(expectedEndpoint);
    });

    it('renders Letter Information panel', () => {
      renderComponent();
      expect(screen.getByTestId('letter-information')).toBeInTheDocument();
    });

    it('renders correct number of accordion panels without spell check', () => {
      canRunSpellCheck.mockReturnValue(false);
      renderComponent();

      // Should have 2 panels: Comment History and Letter Information
      expect(screen.getByTestId('accordion-panel-0')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-panel-1')).toBeInTheDocument();
      expect(screen.queryByTestId('accordion-panel-2')).not.toBeInTheDocument();
    });

    it('renders correct number of accordion panels with spell check', () => {
      canRunSpellCheck.mockReturnValue(true);
      renderComponent();

      // Should have 3 panels: Comment History, Letter Information, and Spell Check
      expect(screen.getByTestId('accordion-panel-0')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-panel-1')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-panel-2')).toBeInTheDocument();
    });
  });
});
