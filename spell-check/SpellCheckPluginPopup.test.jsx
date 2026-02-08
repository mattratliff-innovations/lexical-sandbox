import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import SpellCheckPluginPopup from './SpellCheckPluginPopup';

// Mock dependencies
jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock('./SpellCheckBus', () => ({
  requestApplySuggestion: jest.fn(),
  requestIgnoreError: jest.fn(),
}));

jest.mock('./SpellCheckContext', () => ({
  useSpellCheckContext: jest.fn(),
}));

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { requestApplySuggestion, requestIgnoreError } from './SpellCheckBus';
import { useSpellCheckContext } from './SpellCheckContext';

describe('SpellCheckPluginPopup', () => {
  let mockEditor;
  let mockCloseSpellcheckPopup;
  let mockSetCurrentIndex;
  let mockSetAnchorElement;
  let mockAnchorElement;

  const createMockIssue = (overrides = {}) => ({
    suggestions: ['suggestion1', 'suggestion2', 'suggestion3'],
    originalText: 'misspeled',
    issueType: 'misspelling',
    nodeKey: 'test-node-key',
    editorId: 'test-editor-id',
    ...overrides,
  });

  const defaultContextValue = {
    isPopupVisible: true,
    closeSpellcheckPopup: jest.fn(),
    issues: [createMockIssue()],
    currentIndex: 0,
    setCurrentIndex: jest.fn(),
    anchorElement: null,
    setAnchorElement: jest.fn(),
    isForAdminPage: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock editor
    mockEditor = {
      getElementByKey: jest.fn(),
    };
    useLexicalComposerContext.mockReturnValue([mockEditor]);

    // Create a mock anchor element
    mockAnchorElement = document.createElement('div');
    mockAnchorElement.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      bottom: 120,
      right: 200,
      width: 100,
      height: 20,
    }));
    document.body.appendChild(mockAnchorElement);

    // Mock context values
    mockCloseSpellcheckPopup = jest.fn();
    mockSetCurrentIndex = jest.fn();
    mockSetAnchorElement = jest.fn();

    // Setup default context
    useSpellCheckContext.mockReturnValue({
      ...defaultContextValue,
      closeSpellcheckPopup: mockCloseSpellcheckPopup,
      setCurrentIndex: mockSetCurrentIndex,
      setAnchorElement: mockSetAnchorElement,
      anchorElement: mockAnchorElement,
    });

    mockEditor.getElementByKey.mockReturnValue(mockAnchorElement);

    // Mock window scroll properties
    Object.defineProperty(window, 'pageXOffset', { value: 0, writable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    document.body.removeChild(mockAnchorElement);
  });

  describe('Rendering', () => {
    it('renders nothing when popup is not visible', () => {
      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        isPopupVisible: false,
      });

      const { container } = render(<SpellCheckPluginPopup />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when there are no issues', () => {
      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [],
        currentIndex: 0,
      });

      const { container } = render(<SpellCheckPluginPopup />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the popup when visible and has issues', () => {
      render(<SpellCheckPluginPopup />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Spelling')).toBeInTheDocument();
      expect(screen.getByText('misspeled')).toBeInTheDocument();
    });

    it('displays spelling type for misspelling issues', () => {
      render(<SpellCheckPluginPopup />);

      expect(screen.getByText('Spelling')).toBeInTheDocument();
    });

    it('displays grammar type for grammar issues', () => {
      const grammarIssue = createMockIssue({
        issueType: 'grammar',
        originalText: 'you was',
        suggestions: ['you were', 'you are'],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [grammarIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      expect(screen.getByText('Grammar')).toBeInTheDocument();
      expect(screen.getByText('you was')).toBeInTheDocument();
    });
  });

  describe('Suggestions Display', () => {
    it('displays multiple suggestions as a list when there are 2+ suggestions', () => {
      render(<SpellCheckPluginPopup />);

      expect(screen.getByText('suggestion1')).toBeInTheDocument();
      expect(screen.getByText('suggestion2')).toBeInTheDocument();
      expect(screen.getByText('suggestion3')).toBeInTheDocument();
    });

    it('displays single suggestion when there is only 1 suggestion', () => {
      const singleSuggestionIssue = createMockIssue({
        suggestions: ['onlyone'],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [singleSuggestionIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const suggestionElement = screen.getByText('onlyone');
      expect(suggestionElement).toBeInTheDocument();
      expect(suggestionElement.parentElement).toHaveClass('spell-check-modal__current-suggestion');
    });

    it('displays "No suggestions available" when there are no suggestions', () => {
      const noSuggestionsIssue = createMockIssue({
        suggestions: [],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [noSuggestionsIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      expect(screen.getByText('No suggestions available')).toBeInTheDocument();
    });

    it('limits displayed suggestions to 10', () => {
      const manySuggestionsIssue = createMockIssue({
        suggestions: Array.from({ length: 15 }, (_, i) => `suggestion${i + 1}`),
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [manySuggestionsIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      expect(screen.getByText('suggestion1')).toBeInTheDocument();
      expect(screen.getByText('suggestion10')).toBeInTheDocument();
      expect(screen.queryByText('suggestion11')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('applies suggestion when clicked', async () => {
      const user = userEvent.setup();
      render(<SpellCheckPluginPopup />);

      const suggestion = screen.getByText('suggestion2');
      await user.click(suggestion);

      expect(requestApplySuggestion).toHaveBeenCalledWith(
        'test-editor-id',
        'test-node-key',
        'suggestion2',
        'misspeled'
      );
    });

    it('applies single suggestion when clicked', async () => {
      const user = userEvent.setup();
      const singleSuggestionIssue = createMockIssue({
        suggestions: ['onlyone'],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [singleSuggestionIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const suggestion = screen.getByText('onlyone');
      await user.click(suggestion);

      expect(requestApplySuggestion).toHaveBeenCalledWith(
        'test-editor-id',
        'test-node-key',
        'onlyone',
        'misspeled'
      );
    });

    it('ignores error when ignore button is clicked', async () => {
      const user = userEvent.setup();
      render(<SpellCheckPluginPopup />);

      const ignoreButton = screen.getByTitle('Ignore');
      await user.click(ignoreButton);

      expect(requestIgnoreError).toHaveBeenCalledWith(
        'test-editor-id',
        'test-node-key',
        'misspeled',
        'misspelling'
      );
    });

    it('shows add to dictionary button for spelling errors', () => {
      render(<SpellCheckPluginPopup />);

      expect(screen.getByTitle('Add to dictionary')).toBeInTheDocument();
    });

    it('does not show add to dictionary button for grammar errors', () => {
      const grammarIssue = createMockIssue({
        issueType: 'grammar',
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [grammarIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      expect(screen.queryByTitle('Add to dictionary')).not.toBeInTheDocument();
    });

    it('handles add to dictionary click', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<SpellCheckPluginPopup />);

      const addButton = screen.getByTitle('Add to dictionary');
      await user.click(addButton);

      expect(consoleSpy).toHaveBeenCalledWith('Add to dictionary:', 'misspeled');
      expect(requestIgnoreError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('navigates to next issue when next button is clicked', async () => {
      const user = userEvent.setup();
      const multipleIssues = [createMockIssue(), createMockIssue({ originalText: 'second' })];

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: multipleIssues,
        currentIndex: 0,
        setCurrentIndex: mockSetCurrentIndex,
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const nextButton = screen.getByTitle('Next error');
      await user.click(nextButton);

      expect(mockSetCurrentIndex).toHaveBeenCalledWith(1);
    });

    it('navigates to previous issue when previous button is clicked', async () => {
      const user = userEvent.setup();
      const multipleIssues = [createMockIssue(), createMockIssue({ originalText: 'second' })];

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: multipleIssues,
        currentIndex: 1,
        setCurrentIndex: mockSetCurrentIndex,
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const prevButton = screen.getByTitle('Previous error');
      await user.click(prevButton);

      expect(mockSetCurrentIndex).toHaveBeenCalledWith(0);
    });

    it('disables previous button on first issue', () => {
      const multipleIssues = [createMockIssue(), createMockIssue({ originalText: 'second' })];

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: multipleIssues,
        currentIndex: 0,
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const prevButton = screen.getByTitle('Previous error');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last issue', () => {
      const multipleIssues = [createMockIssue(), createMockIssue({ originalText: 'second' })];

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: multipleIssues,
        currentIndex: 1,
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const nextButton = screen.getByTitle('Next error');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('closes popup when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<SpellCheckPluginPopup />);

      await user.keyboard('{Escape}');

      expect(mockCloseSpellcheckPopup).toHaveBeenCalled();
    });

    it('closes popup when clicking outside', async () => {
      const user = userEvent.setup();
      render(<SpellCheckPluginPopup />);

      await user.click(document.body);

      await waitFor(() => {
        expect(mockCloseSpellcheckPopup).toHaveBeenCalled();
      });
    });

    it('does not close popup when clicking inside', async () => {
      const user = userEvent.setup();
      render(<SpellCheckPluginPopup />);

      const popup = screen.getByRole('dialog');
      await user.click(popup);

      expect(mockCloseSpellcheckPopup).not.toHaveBeenCalled();
    });

    it('applies suggestion with Enter key on single suggestion', async () => {
      const user = userEvent.setup();
      const singleSuggestionIssue = createMockIssue({
        suggestions: ['onlyone'],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [singleSuggestionIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const suggestion = screen.getByText('onlyone');
      suggestion.focus();
      await user.keyboard('{Enter}');

      expect(requestApplySuggestion).toHaveBeenCalledWith(
        'test-editor-id',
        'test-node-key',
        'onlyone',
        'misspeled'
      );
    });

    it('applies suggestion with Space key on single suggestion', async () => {
      const user = userEvent.setup();
      const singleSuggestionIssue = createMockIssue({
        suggestions: ['onlyone'],
      });

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [singleSuggestionIssue],
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const suggestion = screen.getByText('onlyone');
      suggestion.focus();
      await user.keyboard(' ');

      expect(requestApplySuggestion).toHaveBeenCalledWith(
        'test-editor-id',
        'test-node-key',
        'onlyone',
        'misspeled'
      );
    });
  });

  describe('Positioning', () => {
    it('positions popup below the anchor element', () => {
      render(<SpellCheckPluginPopup />);

      const popup = screen.getByRole('dialog');
      expect(popup.style.position).toBe('absolute');
      expect(popup.style.left).toBe('100px');
      expect(popup.style.top).toBe('128px'); // bottom (120) + offset (8)
    });

    it('sets correct z-index', () => {
      render(<SpellCheckPluginPopup />);

      const popup = screen.getByRole('dialog');
      expect(popup.style.zIndex).toBe('1000');
    });
  });

  describe('Admin Page Support', () => {
    it('applies admin overlay class when isForAdminPage is 4adminsnippet', () => {
      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        isForAdminPage: '4adminsnippet',
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const overlay = document.querySelector('.spell-check-popup-overlay--admin');
      expect(overlay).toBeInTheDocument();
    });

    it('applies standard overlay class when not admin page', () => {
      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        isForAdminPage: '',
        anchorElement: mockAnchorElement,
      });

      render(<SpellCheckPluginPopup />);

      const overlay = document.querySelector('.spell-check-popup-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).not.toHaveClass('spell-check-popup-overlay--admin');
    });
  });

  describe('Anchor Element Updates', () => {
    it('updates anchor element when issue changes', () => {
      const { rerender } = render(<SpellCheckPluginPopup />);

      expect(mockEditor.getElementByKey).toHaveBeenCalledWith('test-node-key');
      expect(mockSetAnchorElement).toHaveBeenCalledWith(mockAnchorElement);

      // Change to a different issue
      const newIssue = createMockIssue({ nodeKey: 'new-node-key' });
      const newMockElement = document.createElement('div');
      mockEditor.getElementByKey.mockReturnValue(newMockElement);

      useSpellCheckContext.mockReturnValue({
        ...defaultContextValue,
        issues: [defaultContextValue.issues[0], newIssue],
        currentIndex: 1,
        anchorElement: newMockElement,
      });

      rerender(<SpellCheckPluginPopup />);

      expect(mockEditor.getElementByKey).toHaveBeenCalledWith('new-node-key');
      expect(mockSetAnchorElement).toHaveBeenCalledWith(newMockElement);
    });

    it('clears anchor element when node is not found', () => {
      mockEditor.getElementByKey.mockReturnValue(null);

      render(<SpellCheckPluginPopup />);

      expect(mockSetAnchorElement).toHaveBeenCalledWith(null);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SpellCheckPluginPopup />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Spellcheck suggestion for "misspeled"');
    });

    it('has proper button labels', () => {
      render(<SpellCheckPluginPopup />);

      expect(screen.getByLabelText('Previous error')).toBeInTheDocument();
      expect(screen.getByLabelText('Next error')).toBeInTheDocument();
      expect(screen.getByLabelText('Ignore this error')).toBeInTheDocument();
      expect(screen.getByLabelText('Add to dictionary')).toBeInTheDocument();
    });
  });
});
