/* eslint-disable react/no-array-index-key */

// SpellCheckerPluginModal.js
import React, { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import ReactDOM from 'react-dom';

import { requestApplySuggestion, requestIgnoreError } from './SpellCheckBus';
import { useSpellCheckContext } from './SpellCheckContext';
import './SpellCheckPluginPopup.css';

// Icon components (inline SVGs for the action buttons)
const IgnoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AddToDictionaryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M19 7v10M17 7h4M17 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function SpellCheckPluginPopup() {
  const [editor] = useLexicalComposerContext();
  const popupRef = useRef(null);
  const [coords, setCoords] = React.useState(null);
  const { isPopupVisible, closeSpellcheckPopup, issues, currentIndex, setCurrentIndex, anchorElement, setAnchorElement, isForAdminPage } =
    useSpellCheckContext();
  const previousBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const firstSuggestionRef = useRef(null);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === issues.length - 1;

  // Build the current spell check node from context
  const currentIssue = issues[currentIndex];
  const spellCheckNode = currentIssue
    ? {
        getSuggestions: () => currentIssue.suggestions,
        getTextContent: () => currentIssue.originalText,
        getIssueType: () => currentIssue.issueType,
        nodeKey: currentIssue.nodeKey,
        editorId: currentIssue.editorId,
      }
    : null;

  // after issue changed/fixed/ignored
  useEffect(() => {
    const issue = issues[currentIndex];
    if (editor && issue && issue.nodeKey) {
      const domNode = editor.getElementByKey(issue.nodeKey);
      setAnchorElement(domNode);
    } else {
      setAnchorElement(null);
    }
  }, [currentIndex, issues, editor, setAnchorElement]);

  // Default location of popup
  useEffect(() => {
    if (!isPopupVisible || !anchorElement) {
      setCoords(null);
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const offset = 8; // 8px from bottom of word

    const left = rect.left + window.pageXOffset;
    const top = rect.bottom + window.pageYOffset + offset;

    setCoords({ left, top });
  }, [isPopupVisible, anchorElement]);

  // Focus on the first suggestion upon popup opens
  useEffect(() => {
    if (isPopupVisible && firstSuggestionRef.current) {
      firstSuggestionRef.current.focus({ preventScroll: true });
    } else if (isPopupVisible && previousBtnRef.current) {
      // If no suggestions, focus on navigation
      previousBtnRef.current.focus({ preventScroll: true });
    }
  }, [isPopupVisible]);

  // Trap focus inside the popup while it is open
  useEffect(() => {
    const popupNode = popupRef.current;

    if (!isPopupVisible || !popupNode) {
      return () => {};
    }

    const focusableSelectors = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => {
      const focusable = Array.from(popupNode.querySelectorAll(focusableSelectors)).filter((el) => {
        if (el.disabled) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (el.offsetParent === null) return false;
        return true;
      });

      return focusable;
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

      const focusable = getFocusable();
      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Forward Tab
      if (!e.shiftKey) {
        if (active === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      } else if (active === first) {
        // Shift+Tab
        e.preventDefault();
        last.focus({ preventScroll: true });
      }
    };

    popupNode.addEventListener('keydown', handleKeyDown);

    return () => {
      popupNode.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupVisible]);

  // Works in conjunction with the above focus trap.
  useEffect(() => {
    if (!isPopupVisible) return;

    // Focus on next button when Previous button is disabled.
    if (isFirst && previousBtnRef.current) {
      nextBtnRef.current?.focus({ preventScroll: true });
    }

    // Focus on previous button when Next button is disabled.
    if (isLast && nextBtnRef.current) {
      previousBtnRef.current?.focus({ preventScroll: true });
    }
  }, [isFirst, isLast, isPopupVisible]);

  // Adjust popup location when too close to top/bottom/left/right
  useEffect(() => {
    if (!isPopupVisible || !anchorElement || !popupRef.current || !coords) return;

    const wordRect = anchorElement.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const verticalOffset = 8;
    const horizontalOffset = 20;

    const viewportTop = window.pageYOffset;
    const viewportLeft = window.pageXOffset;
    const viewportRight = viewportLeft + window.innerWidth;
    const viewportBottom = viewportTop + window.innerHeight;

    let { left, top } = coords;
    let changed = false;

    // Vertical: flip above if it doesn't fit below
    const popupBottom = top + popupRect.height;
    if (popupBottom > viewportBottom) {
      const newTop = wordRect.top + window.pageYOffset - popupRect.height - verticalOffset;
      if (newTop !== top) {
        top = newTop;
        changed = true;
      }
    }

    // Horizontal: shift into viewport if overflowing right
    const popupRight = left + popupRect.width;
    if (popupRight > viewportRight) {
      const newLeft = viewportRight - popupRect.width - horizontalOffset;
      if (newLeft !== left) {
        left = newLeft;
        changed = true;
      }
    }

    // Horizontal: shift into viewport if overflowing left
    if (left < viewportLeft + horizontalOffset) {
      const newLeft = viewportLeft + horizontalOffset;
      if (newLeft !== left) {
        left = newLeft;
        changed = true;
      }
    }

    if (changed) {
      setCoords({ left, top });
    }
  }, [isPopupVisible, anchorElement, coords]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isPopupVisible) {
        closeSpellcheckPopup();
      }
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) && isPopupVisible) {
        closeSpellcheckPopup();
      }
    };

    if (isPopupVisible) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupVisible, closeSpellcheckPopup]);

  if (!isPopupVisible || !spellCheckNode) return null;

  const suggestions = spellCheckNode.getSuggestions();
  const originalWord = spellCheckNode.getTextContent();
  const issueType = spellCheckNode.getIssueType();
  const showSuggestionsList = suggestions.length > 1;
  const currentSuggestion = suggestions.length > 0 ? suggestions[0] : null;

  const handleSuggestionClick = (suggestion) => {
    if (!currentIssue) return;
    requestApplySuggestion(currentIssue.editorId, currentIssue.nodeKey, suggestion, currentIssue.originalText);
  };

  const handleIgnore = () => {
    if (!currentIssue) return;
    requestIgnoreError(currentIssue.editorId, currentIssue.nodeKey, currentIssue.originalText, currentIssue.issueType);
  };

  const handleNext = () => {
    if (currentIndex < issues.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAddToDictionary = () => {
    // TODO: Implement add to dictionary functionality
    console.log('Add to dictionary:', originalWord);
    handleIgnore(); // For now, just ignore it
  };

  const popupStyle = coords
    ? {
        position: 'absolute',
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        zIndex: 1000,
        pointerEvents: 'auto',
      }
    : {};

  // Build overlay class based on isForAdminPage
  const overlayClass = isForAdminPage === '4adminsnippet' 
    ? 'spell-check-popup-overlay spell-check-popup-overlay--admin'
    : 'spell-check-popup-overlay';

  return ReactDOM.createPortal(
    <div className={overlayClass}>
      <div
        ref={popupRef}
        className="spell-check-modal"
        style={popupStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Spellcheck suggestion for "${originalWord}"`}
        onMouseDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="spell-check-modal__header">
          <span className="spell-check-modal__type">
            {issueType === 'misspelling' ? 'Spelling' : 'Grammar'}
          </span>
          <span className="spell-check-modal__separator">|</span>
          <span className="spell-check-modal__word">{originalWord}</span>
        </div>

        <div className="spell-check-modal__content">
          {showSuggestionsList ? (
            <div className="spell-check-modal__suggestions">
              {suggestions.slice(0, 10).map((suggestion, index) => (
                <button
                  key={index}
                  ref={index === 0 ? firstSuggestionRef : null}
                  className="spell-check-modal__suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          ) : currentSuggestion ? (
            <div 
              className="spell-check-modal__current-suggestion"
              onClick={() => handleSuggestionClick(currentSuggestion)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuggestionClick(currentSuggestion);
                }
              }}>
              {currentSuggestion}
            </div>
          ) : (
            <div className="spell-check-modal__no-suggestions">No suggestions available</div>
          )}

          <div className="spell-check-modal__controls">
            <div className="spell-check-modal__navigation">
              <button
                ref={previousBtnRef}
                className="spell-check-modal__nav-button"
                onClick={handlePrevious}
                disabled={isFirst}
                aria-label="Previous error"
                title="Previous error">
                ‹
              </button>
              <button
                ref={nextBtnRef}
                className="spell-check-modal__nav-button"
                onClick={handleNext}
                disabled={isLast}
                aria-label="Next error"
                title="Next error">
                ›
              </button>
            </div>

            <div className="spell-check-modal__actions">
              <button
                className="spell-check-modal__action-button"
                onClick={handleIgnore}
                aria-label="Ignore this error"
                title="Ignore">
                <IgnoreIcon />
              </button>
              {issueType === 'misspelling' && (
                <button
                  className="spell-check-modal__action-button"
                  onClick={handleAddToDictionary}
                  aria-label="Add to dictionary"
                  title="Add to dictionary">
                  <AddToDictionaryIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
