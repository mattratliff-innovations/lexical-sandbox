/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AddContentModal from './AddContentModal';

// Mocks for dependencies
jest.mock('@druid/druid', () => {
  // DrModal: plain function, no DOM APIs, no refs, no hooks
  function DrModal({ open, children }) {
    if (!open) return null;
    return (
      <div data-testid="dr-modal">
        {/* Simulate shadowRoot by rendering a close button */}
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <button type="button" data-testid="modal-close-btn" autoFocus>
          Close
        </button>
        {children}
      </div>
    );
  }

  function DrButton({ isDisabled, children, ...rest }) {
    return (
      <button type="button" {...rest} disabled={isDisabled}>
        {children}
      </button>
    );
  }

  return {
    DrButton,
    DrModal,
    DrIcon: () => <span data-testid="icon" />,
  };
});

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [{ focus: jest.fn(), update: jest.fn((cb) => cb()) }],
}));

jest.mock('lexical', () => ({
  $getSelection: jest.fn(() => ({
    clone: jest.fn(() => ({})),
    insertNodes: jest.fn(),
  })),
  $setSelection: jest.fn(),
}));

jest.mock('@lexical/html', () => ({
  $generateNodesFromDOM: jest.fn(() => ['node']),
}));

jest.mock('../../DataContext', () => ({
  useDataContext: () => ({
    draftState: { sections: [], letterTypeId: 1, registration: { formTypeName: 'FORM' } },
    setDraftState: jest.fn(),
  }),
}));

const mockVariableData = [{ name: 'VAR1', description: 'Test Variable' }];

jest.mock('./AddContentModalUtils', () => ({
  getAvailableStandardParagraphsFormLetterType: jest.fn((_axios, setStandardParagraphListData) => {
    setStandardParagraphListData([{ id: 1, code: 'A', text: 'Test Paragraph' }]);
  }),
  getSnippetGroupsForLetterType: jest.fn((_axios, setSnippetGroupListData) => {
    setSnippetGroupListData([{ id: 1, name: 'Test Snippet Group' }]);
  }),
  getSnippetsGroups: jest.fn((_axios, setSnippetGroupListData) => {
    setSnippetGroupListData([{ id: 1, name: 'Test Snippet Group' }]);
  }),
  getVariables: jest.fn((_axios, setVariableListData, setVariableSearchResultList) => {
    setVariableListData(mockVariableData);
    setVariableSearchResultList(mockVariableData);
  }),
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

// Mock subcomponents
jest.mock(
  '../SnippetGroupSelector',
  () =>
    function sgs() {
      return <div data-testid="snippet-group-selector" />;
    }
);
jest.mock(
  '../StandardParagraphSelector',
  () =>
    function sps() {
      return <div data-testid="standard-paragraph-selector" />;
    }
);
jest.mock(
  '../VariableSelector',
  () =>
    function vs() {
      return <div data-testid="variable-selector" />;
    }
);

// Mock H1 component
jest.mock('../../../../../../components/typography', () => ({
  H1: ({ children, ...props }) => <h1 data-testid={props['data-testid'] || 'addContentModalHeader'}>{children}</h1>,
}));

describe('AddContentModal', () => {
  let setShowAddContentModal;

  beforeEach(() => {
    setShowAddContentModal = jest.fn();
  });

  it('renders modal when showAddContentModal is true', () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    expect(screen.getByTestId('addContentModalHeader')).toBeInTheDocument();
    expect(screen.getByTestId('addContentModalBody')).toBeInTheDocument();
    expect(screen.getByTestId('addStandardParagraphButton')).toBeInTheDocument();
    expect(screen.getByTestId('addSnippetButton')).toBeInTheDocument();
    expect(screen.getByTestId('addVariableButton')).toBeInTheDocument();
  });

  it('does not render modal when showAddContentModal is false', () => {
    render(<AddContentModal showAddContentModal={false} setShowAddContentModal={setShowAddContentModal} />);
    expect(screen.queryByTestId('addContentModalHeader')).not.toBeInTheDocument();
  });

  it('calls setShowAddContentModal(false) when Cancel button is clicked', () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    fireEvent.click(screen.getByTestId('cancelModalButton'));
    expect(setShowAddContentModal).toHaveBeenCalledWith(false);
  });

  it('shows snippet group selector when Add Snippet is clicked', async () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    fireEvent.click(screen.getByTestId('addSnippetButton'));
    await waitFor(() => {
      expect(screen.getByTestId('snippet-group-selector')).toBeInTheDocument();
    });
  });

  it('shows standard paragraph selector when Add Standard Paragraph is clicked', async () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    fireEvent.click(screen.getByTestId('addStandardParagraphButton'));
    await waitFor(() => {
      expect(screen.getByTestId('standard-paragraph-selector')).toBeInTheDocument();
    });
  });

  it('shows variable selector and search input when Add Variable is clicked', async () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    fireEvent.click(screen.getByTestId('addVariableButton'));
    await waitFor(() => {
      expect(screen.getByTestId('variable-selector')).toBeInTheDocument();
      expect(screen.getByTestId('searchBox')).toBeInTheDocument();
    });
  });

  it('disables Add button initially', () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);
    expect(screen.getByTestId('addButton')).toBeDisabled();
  });

  it('focuses the close button in the modal when modal opens', () => {
    render(<AddContentModal showAddContentModal setShowAddContentModal={setShowAddContentModal} />);

    // Find the modal container
    const modalContainer = screen.getByTestId('dr-modal');
    expect(modalContainer).toBeInTheDocument();

    // Find the close button inside the modal
    const closeBtn = screen.getByTestId('modal-close-btn');
    expect(closeBtn).toBeInTheDocument();

    // Check that the close button is focused
    expect(document.activeElement).toBe(closeBtn);
  });
});
