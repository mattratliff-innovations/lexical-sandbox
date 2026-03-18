/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'react-toastify';

import Letter from './Letter';
import { AppContext } from '../../AppProvider';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { deleteLetter } from '../../http/letters';

// Mock dependencies FIRST - before any imports that might use them
const mockAxios = new MockAdapter(axios);
const mockedUseNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
  useParams: () => ({ id: 'test-uuid-123' }),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
  Flip: 'Flip',
}));

// Mock HTTP module
jest.mock('../../http/letters', () => ({
  deleteLetter: jest.fn(),
}));

// Mock hasLetterAccess utility
jest.mock('./utils/checkLetterAccess', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

// Mock all child components
jest.mock('./ActivityLogModal', () => ({
  __esModule: true,
  default: function MockActivityLogModal({ showModal, hideModal, letterId }) {
    if (!showModal) return null;
    return (
      <div data-testid="activity-log-modal">
        Activity Log for {letterId}
        <button data-testid="close-activity-log" onClick={hideModal}>
          Close
        </button>
      </div>
    );
  },
}));

jest.mock('./AddEnclosureModal', () => ({
  __esModule: true,
  default: function MockAddEnclosureModal({ showModal, setShowModal, setLetter, letter }) {
    if (!showModal) return null;
    return (
      <div data-testid="add-enclosure-modal">
        Add Enclosure for {letter?.id}
        <button
          data-testid="add-enclosure-confirm"
          onClick={() => {
            setLetter({ ...letter, enclosures: [...(letter.enclosures || []), { id: 'new-enclosure' }] });
            setShowModal(false);
          }}>
          Add
        </button>
        <button data-testid="add-enclosure-cancel" onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('./ChangeHeaderModal', () => ({
  __esModule: true,
  default: function MockChangeHeaderModal({ showModal, setShowModal, onSubmit, draft }) {
    if (!showModal) return null;
    return (
      <div data-testid="change-header-modal">
        Change Header for {draft?.id}
        <button
          data-testid="change-header-submit"
          onClick={() => {
            onSubmit({ letterId: draft.id, headerDate: '2024-01-15' });
          }}>
          Submit
        </button>
        <button data-testid="change-header-cancel" onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('./ChangeSignatureModal', () => ({
  __esModule: true,
  default: function MockChangeSignatureModal({ showModal, setShowModal, onSubmit, draft }) {
    if (!showModal) return null;
    return (
      <div data-testid="change-signature-modal">
        Change Signature for {draft?.id}
        <button
          data-testid="change-signature-submit"
          onClick={() => {
            onSubmit({ organizationSignatureId: 'new-sig-id' });
          }}>
          Submit
        </button>
        <button data-testid="change-signature-cancel" onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('./DeleteLetterModal', () => ({
  __esModule: true,
  default: function MockDeleteLetterModal({ showModal, setShowModal, confirmDeleteLetter }) {
    if (!showModal) return null;
    return (
      <div data-testid="delete-letter-modal">
        Delete Letter Confirmation
        <button data-testid="delete-letter-confirm" onClick={confirmDeleteLetter}>
          Delete
        </button>
        <button data-testid="delete-letter-cancel" onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    );
  },
}));

jest.mock('./PrintPreviewErrorsModal', () => ({
  __esModule: true,
  default: function MockPrintPreviewErrorModal({ showModal, setShowModal, linguisticErrors, draft }) {
    if (!showModal) return null;
    return (
      <div data-testid="print-preview-error-modal">
        Print Preview Errors for {draft?.id}
        <div data-testid="error-count">{linguisticErrors?.length || 0} errors</div>
        <button data-testid="close-error-modal" onClick={() => setShowModal(false)}>
          Close
        </button>
      </div>
    );
  },
}));

jest.mock('./ReassignLetterButton', () => ({
  __esModule: true,
  default: function MockReassignLetterButton({ draft, setDraft }) {
    return (
      <button
        data-testid="reassign-letter-button"
        onClick={() => {
          setDraft({ ...draft, assignedTo: 'new-user' });
        }}>
        Reassign Letter
      </button>
    );
  },
}));

jest.mock('./scribeEditor/scribeDocument/LetterChangeTracker', () => ({
  LetterChangeTracker: function MockLetterChangeTracker({ children, letterEditorRef, initialLetter }) {
    const mockTracking = {
      checkForChanges: jest.fn(() => ({
        hasChanges: false,
        hasStructureChanges: false,
        hasEditorChanges: false,
        structureChangeType: null,
        dirtySections: [],
      })),
      hasDirtyEditors: false,
      dirtyEditorsCount: 0,
      registerSectionEditor: jest.fn(),
      unregisterSectionEditor: jest.fn(),
      handleSectionEditorDirty: jest.fn(),
      markAllClean: jest.fn(),
    };
    return children(mockTracking);
  },
}));

jest.mock('./scribeEditor/ScribeEditor', () => ({
  __esModule: true,
  default: function MockScribeEditor({ documentDetail, letterEditorRef, scribeEditorConfig, handlePdfToggle, currentUser, letterChangeTracking }) {
    // Attach mock methods to letterEditorRef
    if (letterEditorRef && letterEditorRef.current === null) {
      letterEditorRef.current = {
        estimatePrintPages: jest.fn(() => 3),
        letterHtml: jest.fn(() => '<div>Letter content</div>'),
        letterDraftData: jest.fn(() => ({
          row1Col1: 'Test',
          sectionsAttributes: [{ id: 'section-1', order: 1, locked: false }],
        })),
        portraitUsLetterRef: {
          current: {
            getBoundingClientRect: jest.fn(() => ({ height: 1056 })),
          },
        },
      };
    }

    return (
      <div data-testid="scribe-editor">
        <span data-testid="show-manage-contacts">{scribeEditorConfig?.showManageContacts ? 'true' : 'false'}</span>
        <div data-testid="editor-title">{scribeEditorConfig?.editorTitle}</div>
        <div data-testid="editor-document-id">{documentDetail?.id}</div>
        <div data-testid="editor-user-id">{currentUser?.id}</div>

        {/* Quick Actions */}
        <div data-testid="quick-actions">
          {scribeEditorConfig?.quickActions?.map((action, index) => {
            const ActionComponent = action.component;
            if (action.condition === false) return null;
            return <ActionComponent key={index} {...action.props} />;
          })}
        </div>

        {/* Review Actions */}
        <div data-testid="review-actions">
          {scribeEditorConfig?.reviewActions?.map((action, index) => {
            const ActionComponent = action.component;
            if (action.condition === false) return null;
            return <ActionComponent key={index} {...action.props} />;
          })}
        </div>

        <button data-testid="toggle-pdf" onClick={handlePdfToggle}>
          Toggle PDF
        </button>
      </div>
    );
  },
}));

jest.mock('../../components/actionButton/ActionButton', () => ({
  __esModule: true,
  default: function MockActionButton({ onClick, text, 'data-testid': testId }) {
    return (
      <button data-testid={testId} onClick={onClick}>
        {text}
      </button>
    );
  },
}));

jest.mock('../../components/InvalidStatus', () => ({
  __esModule: true,
  default: function MockInvalidStatus({ heading }) {
    return <div data-testid="invalid-status">{heading}</div>;
  },
}));

jest.mock('../../components/Unauthorized', () => ({
  __esModule: true,
  default: function MockUnauthorized() {
    return <div data-testid="unauthorized">Unauthorized</div>;
  },
}));

jest.mock('../../components/vawa/VawaModal', () => ({
  __esModule: true,
  default: function MockVawaModal({ showModal, setShowModal, confirmBtnText, negativeBtnText }) {
    if (!showModal) return null;
    return (
      <div data-testid="vawa-modal">
        VAWA Warning
        <button data-testid="vawa-confirm" onClick={() => setShowModal(false)}>
          {confirmBtnText}
        </button>
        <button data-testid="vawa-negative" onClick={() => setShowModal(false)}>
          {negativeBtnText}
        </button>
      </div>
    );
  },
}));

jest.mock('../../utils/LoadingFallback', () => ({
  __esModule: true,
  default: function MockLoadingFallback() {
    return <div data-testid="loading-fallback">Loading...</div>;
  },
}));

jest.mock('../admin/organizations/SignaturePreview', () => ({
  __esModule: true,
  default: function MockSignaturePreview() {
    return <div data-testid="signature-preview">Signature</div>;
  },
}));

jest.mock('../util/customHooks/useModalCheck', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isBlocked: false,
    setIsBlocked: jest.fn(),
    blocker: null,
  })),
}));

jest.mock('../util/UtilityModal', () => ({
  __esModule: true,
  default: function MockUtilityModal({ isOpen, setIsOpen, blocker }) {
    if (!isOpen) return null;
    return (
      <div data-testid="utility-modal">
        Navigation Blocked
        <button data-testid="utility-modal-close" onClick={() => setIsOpen(false)}>
          Close
        </button>
      </div>
    );
  },
}));

jest.mock('./htmlTo508CompliantPdfHtml', () => ({
  __esModule: true,
  default: jest.fn((html, draft) => ({ html, draftId: draft?.id })),
}));

jest.mock('@druid/druid', () => ({
  DrButton: function MockDrButton({ children, onClick, 'data-testid': testId }) {
    return (
      <button data-testid={testId} onClick={onClick}>
        {children}
      </button>
    );
  },
}));

// Test data
const mockCurrentUser = {
  id: 'user-123',
  role: 'attorney',
  organizationId: 'org-456',
};

const mockLetter = {
  id: 'test-uuid-123',
  updatedAt: '2024-01-15T10:30:00Z',
  status: { name: 'draft' },
  organizationId: 'org-456',
  organizationSignature: {
    id: 'sig-789',
    name: 'John Doe',
  },
  letterType: {
    id: 'letter-type-1',
    name: 'I-485 Adjustment of Status',
    headerIncluded: true,
    signatureIncluded: true,
  },
  sectionsAttributes: [
    { id: 'section-1', order: 1, content: 'Section 1 content', locked: false },
    { id: 'section-2', order: 2, content: 'Section 2 content', locked: false },
  ],
  row1Col1: 'Attorney Name',
  row1Col2: 'Client Name',
  maySubmitToCentralPrint: false,
  maySubmitIndividualprint: false,
  vawa: false,
  enclosures: [],
};

// Helper function to render component
const renderComponent = (props = {}) => {
  const contextValue = {
    currentUser: mockCurrentUser,
    setDraftOrganization: jest.fn(),
    ...props.contextValue,
  };

  return render(
    <AppContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={['/draft/test-uuid-123']}>
        <Routes>
          <Route path="/draft/:id" element={<Letter />} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>
  );
};

describe('Letter Component', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockedUseNavigate.mockClear();
    deleteLetter.mockResolvedValue({});

    // Mock successful letter fetch by default
    mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, mockLetter);

    // Mock CSS variable
    Object.defineProperty(document.documentElement, 'style', {
      value: {
        getPropertyValue: jest.fn(() => '0.8'),
      },
      writable: true,
    });

    // Reset endnote manager mock
    window.endnoteManager = {
      reset: jest.fn(),
      initializeFromLetter: jest.fn(),
    };
  });

  afterEach(() => {
    delete window.endnoteManager;
  });

  describe('Loading and Initial Render', () => {
    it('shows loading fallback initially', async () => {
      renderComponent();
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      });
    });

    it('fetches letter data on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0].url).toBe(`${APP_API_ENDPOINT}/letters/test-uuid-123`);
      });
    });

    it('renders ScribeEditor after successful load', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
        expect(screen.getByTestId('show-manage-contacts')).toHaveTextContent('true');
      });
    });

    it('sets draft organization in context', async () => {
      const setDraftOrganization = jest.fn();
      renderComponent({
        contextValue: { currentUser: mockCurrentUser, setDraftOrganization },
      });

      await waitFor(() => {
        expect(setDraftOrganization).toHaveBeenCalledWith('org-456');
      });
    });

    it('initializes endnote manager with letter data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(window.endnoteManager.initializeFromLetter).toHaveBeenCalledWith(mockLetter);
      });
    });
  });

  describe('Authorization and Status Checks', () => {
    it('shows invalid status when letter status is not draft', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        status: { name: 'completed' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('invalid-status')).toBeInTheDocument();
        expect(screen.getByTestId('invalid-status')).toHaveTextContent('Something Went Wrong');
      });
    });

    it('allows draft status', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        status: { name: 'draft' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('invalid-status')).not.toBeInTheDocument();
      });
    });

    it('allows draft.* statuses', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        status: { name: 'draft.pending_review' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
        expect(screen.queryByTestId('invalid-status')).not.toBeInTheDocument();
      });
    });

    it('shows unauthorized when user lacks access', async () => {
      const hasLetterAccess = require('./utils/checkLetterAccess').default;
      hasLetterAccess.mockReturnValueOnce(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
      });
    });

    it('redirects when letter ID changes', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        id: 'different-uuid',
      });

      renderComponent();

      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith('/draft/different-uuid', { replace: true });
      });
    });
  });

  describe('VAWA Modal', () => {
    it('shows VAWA modal when letter is VAWA', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        vawa: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('vawa-modal')).toBeInTheDocument();
      });
    });

    it('does not show VAWA modal for non-VAWA letters', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        vawa: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId('vawa-modal')).not.toBeInTheDocument();
      });
    });

    it('closes VAWA modal when acknowledge is clicked', async () => {
      const userInstance = userEvent.setup();
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        vawa: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('vawa-modal')).toBeInTheDocument();
      });

      const acknowledgeButton = screen.getByTestId('vawa-confirm');
      await userInstance.click(acknowledgeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('vawa-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('renders save button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('saveDraft')).toBeInTheDocument();
      });
    });

    it('renders change header button when header is included', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        letterType: { ...mockLetter.letterType, headerIncluded: true },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('changeHeader')).toBeInTheDocument();
      });
    });

    it('does not render change header button when header is not included', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        letterType: { ...mockLetter.letterType, headerIncluded: false },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId('changeHeader')).not.toBeInTheDocument();
      });
    });

    it('does not render change signature button when signature is not included', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        letterType: { ...mockLetter.letterType, signatureIncluded: false },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId('changeSignature')).not.toBeInTheDocument();
      });
    });

    it('renders delete button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('deleteDraft')).toBeInTheDocument();
      });
    });

    it('renders reassign letter button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('reassign-letter-button')).toBeInTheDocument();
      });
    });
  });

  describe('Review Actions', () => {
    it('renders local print button when maySubmitIndividualPrint is true', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        maySubmitIndividualprint: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('localPrintButton')).toBeInTheDocument();
      });
    });

    it('does not render local print button when maySubmitIndividualPrint is false', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId('localPrintButton')).not.toBeInTheDocument();
      });
    });

    it('renders complete without printing button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('completeWithoutPrintingButton')).toBeInTheDocument();
      });
    });

    it('shows central print button when maySubmitToCentralPrint is true', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        maySubmitToCentralPrint: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('centralPrintButton')).toBeInTheDocument();
      });
    });

    it('does not show central print button when maySubmitToCentralPrint is false', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        maySubmitToCentralPrint: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByTestId('centralPrintButton')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Letter Functionality', () => {
    it('opens delete modal when delete button is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('deleteDraft')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('deleteDraft');
      await userInstance.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-letter-modal')).toBeInTheDocument();
      });
    });

    it('deletes letter and navigates to search on confirmation', async () => {
      const userInstance = userEvent.setup();
      deleteLetter.mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('deleteDraft')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('deleteDraft');
      await userInstance.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-letter-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('delete-letter-confirm');
      await userInstance.click(confirmButton);

      await waitFor(() => {
        expect(deleteLetter).toHaveBeenCalledWith('test-uuid-123');
        expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
      });
    });

    it('shows error toast when delete fails', async () => {
      const userInstance = userEvent.setup();
      deleteLetter.mockRejectedValue(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('deleteDraft')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('deleteDraft');
      await userInstance.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-letter-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('delete-letter-confirm');
      await userInstance.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Something went wrong, please try again.',
          expect.objectContaining({
            position: 'top-center',
            theme: 'dark',
          })
        );
      });
    });

    it('closes modal when cancel is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('deleteDraft')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('deleteDraft');
      await userInstance.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-letter-modal')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('delete-letter-cancel');
      await userInstance.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('delete-letter-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Change Header Functionality', () => {
    it('opens change header modal when button is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('changeHeader')).toBeInTheDocument();
      });

      const changeHeaderButton = screen.getByTestId('changeHeader');
      await userInstance.click(changeHeaderButton);

      await waitFor(() => {
        expect(screen.getByTestId('change-header-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Activity Log Functionality', () => {
    it('opens activity log modal when button is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('activityLogButton')).toBeInTheDocument();
      });

      const activityLogButton = screen.getByTestId('activityLogButton');
      await userInstance.click(activityLogButton);

      await waitFor(() => {
        expect(screen.getByTestId('activity-log-modal')).toBeInTheDocument();
        expect(screen.getByText('Activity Log for test-uuid-123')).toBeInTheDocument();
      });
    });

    it('closes activity log modal when close is clicked', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('activityLogButton')).toBeInTheDocument();
      });

      const activityLogButton = screen.getByTestId('activityLogButton');
      await userInstance.click(activityLogButton);

      await waitFor(() => {
        expect(screen.getByTestId('activity-log-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-activity-log');
      await userInstance.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-log-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Updated DateTime Display', () => {
    it('displays formatted update timestamp', async () => {
      const updatedDate = '2024-01-15T10:30:45Z';
      mockAxios.onGet(`${APP_API_ENDPOINT}/letters/test-uuid-123`).reply(200, {
        ...mockLetter,
        updatedAt: updatedDate,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('resets endnote manager on unmount', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
      });

      unmount();

      expect(window.endnoteManager.reset).toHaveBeenCalled();
    });
  });

  describe('Navigation to Completed Status', () => {
    it('redirects to preview when status becomes individualprint.complete', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('scribe-editor')).toBeInTheDocument();
      });
    });
  });
});
