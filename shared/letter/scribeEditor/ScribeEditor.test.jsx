import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'react-toastify';

import ScribeEditor from './ScribeEditor';
import { createLetterStateEvent } from '../../../http/letters';

const mockNavigate = jest.fn();

jest.mock(
  './ReviewActionsWrapper',
  () =>
    function () {
      return <div data-testid="mock-review-actions-wrapper">Mock ReviewActionsWrapper</div>;
    }
);

jest.mock('@druid/druid', () => ({
  DrAlert: ({ children }) => <div data-testid="dr-alert">{children}</div>,
  DrSwitch: () => <div data-testid="dr-switch" />,
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
  Flip: jest.fn(),
}));

jest.mock('../../../http/letters', () => ({
  createLetterStateEvent: jest.fn(),
}));

// Mocks for typography
jest.mock('../../../components/typography', () => ({
  H1: ({ children }) => <div data-testid="mock-h1">{children}</div>,
  H2: ({ children }) => <div data-testid="mock-h2">{children}</div>,
}));

// Mocks for child components
jest.mock('./scribeDocument/ScribeDocument', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-scribe-document">Mock ScribeDocument</div>,
}));
jest.mock('../ContactSideBar', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-contact-sidebar">Mock ContactSideBar</div>,
}));
jest.mock('./LetterEditorGuideModal', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-letter-editor-guide-modal">Mock LetterEditorGuideModal</div>,
}));
jest.mock('./ReviewActionsWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-review-actions-wrapper">Mock ReviewActionsWrapper</div>,
}));
jest.mock('../LetterUtil', () => ({
  GeneratePdfObject: () => <div data-testid="mock-generate-pdf-object">Mock GeneratePdfObject</div>,
}));
jest.mock('../../../components/designedComponents', () => ({
  BtnContainer: ({ children }) => <div data-testid="mock-btn-container">{children}</div>,
  StyledHr: () => <hr data-testid="mock-styled-hr" />,
}));
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function LocalPrintButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Local Print
    </button>
  );
}

function CentralPrintButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}>
      Central Print
    </button>
  );
}

const mockProps = {
  letterEditorRef: { current: null },
  letterContainerRowRef: { current: null },
  showPdf: false,
  isPreview: false,
  pdfData: '',
  inlinePdfScale: '1',
  letterHeight: 800,
  uuid: 'test-uuid',
  previewRecipientId: 'recipient-id',
  scribeEditorConfig: {
    doubleSided: false,
    showDocumentHeader: false,
    showPdfPreviewToggle: true,
    showLetterRecipients: false,
    showManageContacts: false,
    editorTitle: 'Test Editor Title',
    letterPreviewMode: false,
    updatedDateTime: '2023-09-30',
    reviewActions: [
      {
        component: LocalPrintButton,
        props: { onClick: jest.fn() },
        condition: true,
      },
      {
        component: CentralPrintButton,
        props: { onClick: jest.fn() },
        condition: true,
      },
    ],
    quickActions: [],
    margins: [1, 1, 1, 1],
    toolList: {},
    buttonActions: [],
  },
  handlePdfToggle: jest.fn(),
  handleCardOnClick: jest.fn(),
  handleDoubleSidedToggle: jest.fn(),
  setHeight: jest.fn(),
};

describe('ScribeEditor Component', () => {
  it('renders the Central Print Button when showCentralPrintButton is set to true', () => {
    render(<ScribeEditor {...mockProps} />);

    // Verify CentralPrintButton is rendered
    const centralPrintButton = screen.getByText('Central Print');
    expect(centralPrintButton).toBeInTheDocument();
  });

  it('does not render Central Print Button when showCentralPrintButton is set to false', () => {
    const propsWithFalseCondition = {
      ...mockProps,
      scribeEditorConfig: {
        ...mockProps.scribeEditorConfig,
        reviewActions: [
          {
            component: LocalPrintButton,
            props: { onClick: jest.fn() },
            condition: false,
          },
          {
            component: CentralPrintButton,
            props: { onClick: jest.fn() },
            condition: false,
          },
        ],
      },
    };

    render(<ScribeEditor {...propsWithFalseCondition} />);

    // Verify CentralPrintButton is not rendered
    const centralPrintButton = screen.queryByText('Central Print');
    expect(centralPrintButton).not.toBeInTheDocument();
  });
});

describe('ScribeEditor Central Print Banner and Timer', () => {
  const baseProps = {
    ...mockProps,
    documentDetail: {
      id: 'doc-1',
      status: { name: 'centralprint' },
      leavesCentralPrintQueueAt: new Date(Date.now() + 60000).toISOString(),
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows Central Print Banner and timer when status is "centralprint"', () => {
    render(<ScribeEditor {...baseProps} />);
    expect(screen.getByTestId('dr-alert')).toBeInTheDocument();
    expect(screen.getByText(/Time left until letter goes to Central Print and can no longer be changed:/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel print job/i)).toBeInTheDocument();
    expect(screen.getByText((content) => /^\d{2}:\d{2}/.test(content))).toBeInTheDocument();
  });

  it('hides Central Print Banner when status is not "centralprint"', () => {
    const props = {
      ...baseProps,
      documentDetail: {
        ...baseProps.documentDetail,
        status: { name: 'draft' },
      },
    };
    render(<ScribeEditor {...props} />);
    expect(screen.queryByTestId('dr-alert')).not.toBeInTheDocument();
  });

  it('updates timer and hides banner after expiration', () => {
    const props = {
      ...baseProps,
      documentDetail: {
        ...baseProps.documentDetail,
        leavesCentralPrintQueueAt: new Date(Date.now() + 2000).toISOString(),
      },
    };
    render(<ScribeEditor {...props} />);
    expect(screen.getByTestId('dr-alert')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(screen.queryByTestId('dr-alert')).not.toBeInTheDocument();
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith(
      expect.stringContaining('UUID sent to Central Print!'),
      expect.objectContaining({ toastId: 'toastCentralPrint' })
    );
  });

  it('calls cancelCentralPrintJob when Cancel print job button is clicked', async () => {
    jest.useFakeTimers();

    createLetterStateEvent.mockResolvedValue({});

    render(<ScribeEditor {...baseProps} />);
    const cancelBtn = screen.getByText(/Cancel print job/i);

    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(createLetterStateEvent).toHaveBeenCalledWith('doc-1', 'submit_return_to_draft');
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Central print job successfully cancelled!'),
      expect.objectContaining({ toastId: 'toastCancelCentralPrint' })
    );

    // Advance timers to trigger setTimeout
    act(() => {
      jest.runAllTimers();
    });

    // Assert navigation
    expect(mockNavigate).toHaveBeenCalledWith('/draft/doc-1');

    // Clean up
    jest.useRealTimers();
  });
});
