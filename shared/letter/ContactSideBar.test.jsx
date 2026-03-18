/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/button-has-type */
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import ContactSideBar from './ContactSideBar';
import { hasValidationErrors, setHeaderData, updateDraft } from './LetterUtil';
import { showToastError } from '../../utils/toastHelpers';
import {
  formatOtherContactAddress,
  formatRecipientAddress,
  isOtherContacts,
  letterRecipients,
  sortedApplicantContacts,
  sortedMainContacts,
} from '../contacts/ContactUtils';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

jest.mock('./LetterUtil', () => ({
  hasValidationErrors: jest.fn(),
  setHeaderData: jest.fn((draft) => draft),
  updateDraft: jest.fn(),
}));

jest.mock('../contacts/ContactUtils', () => ({
  formatOtherContactAddress: jest.fn((contact) => (
    <div key={contact.id} data-testid={`other-contact-${contact.id}`}>
      {contact.firstName} {contact.lastName}
    </div>
  )),
  formatRecipientAddress: jest.fn((contact) => (
    <div data-testid={`recipient-address-${contact.id}`}>
      {contact.firstName} {contact.lastName}
    </div>
  )),
  isOtherContacts: jest.fn(),
  letterRecipients: jest.fn(),
  sortedApplicantContacts: jest.fn(),
  sortedMainContacts: jest.fn(),
}));

jest.mock('../../utils/toastHelpers', () => ({
  showToastError: jest.fn(),
}));

jest.mock('./PrintPreviewErrorsModal', () => ({
  __esModule: true,
  default: function MockPrintPreviewErrorModal({ showModal }) {
    return showModal ? <div data-testid="print-preview-error-modal" /> : null;
  },
}));

// Druid / react-bootstrap stubs
jest.mock('@druid/druid', () => ({
  DrAlert: ({ children }) => <div data-testid="dr-alert">{children}</div>,
  DrButton: ({ children, onClick, ...rest }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  DrCard: ({ children, onClick, toggled, interactive }) => (
    <div data-testid="dr-card" data-toggled={String(toggled)} data-interactive={String(interactive)} onClick={onClick}>
      {children}
    </div>
  ),
}));

jest.mock('../../components/typography', () => ({
  H2: ({ children }) => <h2>{children}</h2>,
}));

jest.mock('../../hooks/useModal', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    showModal: jest.fn(),
    setModal: jest.fn(),
    isModalOpen: jest.fn(() => false),
  })),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const makeContact = (overrides = {}) => ({
  id: 'contact-1',
  firstName: 'Jane',
  lastName: 'Doe',
  address: { isMailable: true },
  ...overrides,
});

const defaultProps = {
  uuid: 'letter-uuid-123',
  contacts: [],
  showManageContacts: true,
  useRecipientCards: false,
  handleCardOnClick: jest.fn(),
  selectedRecipientId: null,
  allowedToIncludeRecipients: true,
  markAllClean: jest.fn(),
  setInitialDraft: jest.fn(),
  bypassModalCheckRef: { current: false },
  setDraft: jest.fn(),
  draft: { id: 'draft-1', letterType: { headerIncluded: true }, header: { active: true } },
  defaultSignature: null,
};

const letterEditorRef = { current: { letterDraftData: jest.fn(() => ({})) } };

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <ContactSideBar ref={letterEditorRef} {...defaultProps} {...props} />
    </MemoryRouter>
  );

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset ContactUtils mocks to sensible defaults before each test. */
function setupEmptyContacts() {
  letterRecipients.mockReturnValue([]);
  sortedMainContacts.mockReturnValue([]);
  sortedApplicantContacts.mockReturnValue([]);
  isOtherContacts.mockReturnValue(false);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContactSideBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupEmptyContacts();
  });

  // ── Basic rendering ────────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders the contacts sidebar container', () => {
      renderComponent();
      expect(screen.getByTestId('contactsSidebar')).toBeInTheDocument();
    });

    it('renders the "Letter Recipients" heading', () => {
      renderComponent();
      expect(screen.getByText('Letter Recipients')).toBeInTheDocument();
    });

    it('does not render the "Manage Contacts" button when showManageContacts is false', () => {
      renderComponent({ showManageContacts: false });
      expect(screen.queryByTestId('manageContactsButton')).not.toBeInTheDocument();
    });

    it('renders the "Manage Contacts" button when showManageContacts is true', () => {
      renderComponent({ showManageContacts: true });
      expect(screen.getByTestId('manageContactsButton')).toBeInTheDocument();
    });
  });

  // ── No-recipient alert ─────────────────────────────────────────────────────

  describe('empty recipients alert', () => {
    it('shows the recipient-required alert when there are no recipients', () => {
      letterRecipients.mockReturnValue([]);
      renderComponent();
      expect(screen.getByTestId('dr-alert')).toBeInTheDocument();
      expect(screen.getByText(/Recipient Required/i)).toBeInTheDocument();
    });

    it('does NOT show the alert when at least one recipient exists', () => {
      letterRecipients.mockReturnValue([makeContact()]);
      renderComponent();
      expect(screen.queryByTestId('dr-alert')).not.toBeInTheDocument();
    });
  });

  // ── Recipient rendering ────────────────────────────────────────────────────

  describe('recipient rendering', () => {
    it('renders formatRecipientAddress for each letter recipient', () => {
      const recipients = [makeContact({ id: 'r-1' }), makeContact({ id: 'r-2' })];
      letterRecipients.mockReturnValue(recipients);

      renderComponent({ useRecipientCards: false });

      expect(formatRecipientAddress).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('recipient-address-r-1')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-address-r-2')).toBeInTheDocument();
    });

    it('shows the missing-address message when isMailable is false', () => {
      const nonMailable = makeContact({ id: 'nm-1', address: { isMailable: false } });
      letterRecipients.mockReturnValue([nonMailable]);

      renderComponent();

      expect(screen.getByText('Address Information Missing')).toBeInTheDocument();
    });

    it('does NOT show the missing-address message when isMailable is true', () => {
      letterRecipients.mockReturnValue([makeContact({ id: 'r-1', address: { isMailable: true } })]);

      renderComponent();

      expect(screen.queryByText('Address Information Missing')).not.toBeInTheDocument();
    });
  });

  // ── Recipient cards ────────────────────────────────────────────────────────

  describe('recipient cards (useRecipientCards=true)', () => {
    it('renders DrCard for each recipient', () => {
      const recipients = [makeContact({ id: 'rc-1' }), makeContact({ id: 'rc-2' })];
      letterRecipients.mockReturnValue(recipients);

      renderComponent({ useRecipientCards: true, selectedRecipientId: null });

      expect(screen.getAllByTestId('dr-card')).toHaveLength(2);
    });

    it('marks the selected recipient card as toggled', () => {
      const recipients = [makeContact({ id: 'toggled-1' }), makeContact({ id: 'toggled-2' })];
      letterRecipients.mockReturnValue(recipients);

      renderComponent({ useRecipientCards: true, selectedRecipientId: 'toggled-1' });

      const cards = screen.getAllByTestId('dr-card');
      expect(cards[0]).toHaveAttribute('data-toggled', 'true');
      expect(cards[1]).toHaveAttribute('data-toggled', 'false');
    });

    it('calls handleCardOnClick with the recipient id when an un-toggled card is clicked', async () => {
      const userInstance = userEvent.setup();
      const handleCardOnClick = jest.fn();
      letterRecipients.mockReturnValue([makeContact({ id: 'click-me' })]);

      renderComponent({ useRecipientCards: true, selectedRecipientId: null, handleCardOnClick });

      await userInstance.click(screen.getByTestId('dr-card'));
      expect(handleCardOnClick).toHaveBeenCalledWith('click-me');
    });

    it('does NOT call handleCardOnClick when a toggled card is clicked', async () => {
      const userInstance = userEvent.setup();
      const handleCardOnClick = jest.fn();
      letterRecipients.mockReturnValue([makeContact({ id: 'already-selected' })]);

      renderComponent({ useRecipientCards: true, selectedRecipientId: 'already-selected', handleCardOnClick });

      await userInstance.click(screen.getByTestId('dr-card'));
      expect(handleCardOnClick).not.toHaveBeenCalled();
    });
  });

  // ── Other contacts ─────────────────────────────────────────────────────────

  describe('other contacts', () => {
    it('renders the "Other Contacts" heading when isOtherContacts returns true', () => {
      isOtherContacts.mockReturnValue(true);
      renderComponent();
      expect(screen.getByText('Other Contacts')).toBeInTheDocument();
    });

    it('does NOT render the "Other Contacts" heading when isOtherContacts returns false', () => {
      isOtherContacts.mockReturnValue(false);
      renderComponent();
      expect(screen.queryByText(/Other.*Contacts/)).not.toBeInTheDocument();
    });

    it('renders each main contact via formatRecipientAddress', () => {
      sortedMainContacts.mockReturnValue([makeContact({ id: 'mc-1' })]);
      renderComponent();
      expect(screen.getByTestId('recipient-address-mc-1')).toBeInTheDocument();
    });

    it('renders up to MAX_APPLICANT_DISPLAY (3) applicants', () => {
      const applicants = ['ap-1', 'ap-2', 'ap-3'].map((id) => makeContact({ id }));
      sortedApplicantContacts.mockReturnValue(applicants);

      renderComponent();

      expect(formatOtherContactAddress).toHaveBeenCalledTimes(3);
    });

    it('renders the "View More" button when there are more than 3 applicants', () => {
      const applicants = ['ap-1', 'ap-2', 'ap-3', 'ap-4'].map((id) => makeContact({ id }));
      sortedApplicantContacts.mockReturnValue(applicants);

      renderComponent();

      expect(screen.getByRole('button', { name: /View More/i })).toBeInTheDocument();
    });

    it('does NOT render the "View More" button when there are 3 or fewer applicants', () => {
      sortedApplicantContacts.mockReturnValue(['ap-1', 'ap-2', 'ap-3'].map((id) => makeContact({ id })));
      renderComponent();
      expect(screen.queryByRole('button', { name: /View More/i })).not.toBeInTheDocument();
    });

    it('"View More" navigates to the contacts page', async () => {
      const userInstance = userEvent.setup();
      sortedApplicantContacts.mockReturnValue(['ap-1', 'ap-2', 'ap-3', 'ap-4'].map((id) => makeContact({ id })));
      renderComponent();

      await userInstance.click(screen.getByRole('button', { name: /View More/i }));
      expect(mockedNavigate).toHaveBeenCalledWith('/contacts/letter-uuid-123');
    });
  });

  // ── Manage Contacts – happy path ───────────────────────────────────────────

  describe('Manage Contacts button – success path', () => {
    const savedDraft = {
      id: 'draft-1',
      letterType: { headerIncluded: true },
      header: { active: true },
    };

    beforeEach(() => {
      updateDraft.mockResolvedValue(savedDraft);
      hasValidationErrors.mockReturnValue([]);
      setHeaderData.mockImplementation((draft) => draft);
    });

    it('saves the draft and navigates to contacts when there are no validation errors', async () => {
      const userInstance = userEvent.setup();
      renderComponent();

      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => {
        expect(updateDraft).toHaveBeenCalledTimes(1);
        expect(mockedNavigate).toHaveBeenCalledWith('/contacts/letter-uuid-123');
      });
    });

    it('sets bypassModalCheckRef.current to true before saving', async () => {
      const userInstance = userEvent.setup();
      const bypassModalCheckRef = { current: false };
      renderComponent({ bypassModalCheckRef });

      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => expect(updateDraft).toHaveBeenCalled());
      expect(bypassModalCheckRef.current).toBe(true);
    });
  });

  // ── Manage Contacts – validation errors ───────────────────────────────────

  describe('Manage Contacts button – validation errors', () => {
    const savedDraft = {
      id: 'draft-1',
      letterType: { headerIncluded: true },
      header: { active: true },
    };

    beforeEach(() => {
      updateDraft.mockResolvedValue(savedDraft);
      hasValidationErrors.mockReturnValue(['Missing field']);
      setHeaderData.mockImplementation((draft) => draft);
    });

    it('opens the PrintPreviewErrorModal instead of navigating when there are validation errors', async () => {
      const useModal = require('../../hooks/useModal').default;
      const mockShowModal = jest.fn();
      useModal.mockReturnValue({
        showModal: mockShowModal,
        setModal: jest.fn(),
        isModalOpen: jest.fn(() => false),
      });

      const userInstance = userEvent.setup();
      renderComponent();

      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => {
        expect(mockShowModal).toHaveBeenCalledWith('printPreviewError');
        expect(mockedNavigate).not.toHaveBeenCalled();
      });
    });
  });

  // ── Manage Contacts – header adjustment ───────────────────────────────────

  describe('Manage Contacts button – header adjustment', () => {
    it('calls setHeaderData when headerIncluded is false', async () => {
      const userInstance = userEvent.setup();
      const draftWithoutHeader = {
        id: 'draft-1',
        letterType: { headerIncluded: false },
        header: { active: true },
      };
      updateDraft.mockResolvedValue(draftWithoutHeader);
      hasValidationErrors.mockReturnValue([]);

      renderComponent({ draft: draftWithoutHeader });
      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => expect(setHeaderData).toHaveBeenCalledWith(draftWithoutHeader, true, false));
    });

    it('calls setHeaderData when header.active is false', async () => {
      const userInstance = userEvent.setup();
      const draftInactiveHeader = {
        id: 'draft-1',
        letterType: { headerIncluded: true },
        header: { active: false },
      };
      updateDraft.mockResolvedValue(draftInactiveHeader);
      hasValidationErrors.mockReturnValue([]);

      renderComponent({ draft: draftInactiveHeader });
      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => expect(setHeaderData).toHaveBeenCalledWith(draftInactiveHeader, true, false));
    });

    it('does NOT call setHeaderData when header is already valid and active', async () => {
      const userInstance = userEvent.setup();
      const goodDraft = {
        id: 'draft-1',
        letterType: { headerIncluded: true },
        header: { active: true },
      };
      updateDraft.mockResolvedValue(goodDraft);
      hasValidationErrors.mockReturnValue([]);

      renderComponent({ draft: goodDraft });
      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => expect(mockedNavigate).toHaveBeenCalled());
      expect(setHeaderData).not.toHaveBeenCalled();
    });
  });

  // ── Manage Contacts – error handling ──────────────────────────────────────

  describe('Manage Contacts button – error handling', () => {
    it('shows a toast error when updateDraft throws', async () => {
      updateDraft.mockRejectedValue(new Error('Network failure'));
      const userInstance = userEvent.setup();
      renderComponent();

      await userInstance.click(screen.getByTestId('manageContactsButton'));

      await waitFor(() => {
        expect(showToastError).toHaveBeenCalledWith('Failed to validate draft. Please try again.');
        expect(mockedNavigate).not.toHaveBeenCalled();
      });
    });
  });
});
