/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
// SpellCheckerPluginModal.js
import React, { useEffect, useRef } from 'react';

import styled from '@emotion/styled';
import ReactDOM from 'react-dom';

const SpellCheckModalOverlay = styled.div`
  width: 100%;
  height: 100%;
`;

const SpellCheckModal = styled.div`
  background: white;
  border-radius: 0.5em;
  box-shadow: 0 0px 8px rgba(0, 0, 0, 0.6);
  width: 21em;
  max-width: 90vw;
  overflow: hidden;
  position: relative;
  pointer-events: all;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1.3rem; // base: change this to scale everything
`;

const SpellCheckModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4em 0.55em;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SpellCheckIcon = styled.div`
  background-color: #dc2626;
  color: white;
  padding: 0.25em 0.5em;
  border-radius: 0.375em;
  font-size: 1.1em;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
`;

const CorrectText = styled.div`
  font-size: 0.875em;
  font-weight: 500;
  color: #333;
`;

const ArrowDown = styled.div`
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #666;
  margin-left: 4px;
`;

const SpellCategory = styled.div`
  background-color: #dc2626;
  color: white;
  padding: 0.25em 0.5em;
  border-radius: 0.375em;
  font-size: 0.9em;
  font-weight: 500;
`;

const CloseBtn = styled.div`
  background-color: #eeeeeeff;
  color: black;
  padding: 0.25em 0.5em;
  border-radius: 0.375em;
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  transition: background-color 0.2s ease;

  &:hover {
    color: black;
    background-color: #c9c8c8ff;
  }
`;

const ContentWrapper = styled.div`
  padding: 16px;
`;

const SuggestionButton = styled.div`
  padding: 0.5em 0.7em;
  border-radius: 0.5em;
  font-size: 0.7em;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  min-width: fit-content;
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const IgnoreButton = styled.div`
  padding: 0.5em 0.7em;
  border-radius: 0.5em;
  font-size: 0.7em;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  min-width: fit-content;
  background-color: #445066ff;
  color: white;

  &:hover {
    background-color: #384253ff;
    transform: translateY(-1px);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.div`
  font-size: 1.1em;
  font-weight: 500;
  color: #333;
`;

const SectionMessage = styled.div`
  font-size: 0.9em;
  color: #555;
  margin-bottom: 16px;
  line-height: 1.4;
`;

const NoSuggestions = styled.div`
  padding: 8px 12px;
  color: #666;
  font-size: 14px;
  font-style: italic;
`;

export default function SpellCheckPluginModal({ isVisible, onClose, spellCheckNode, anchorElement, onApplySuggestion, onIgnore }) {
  const modalRef = useRef(null);
  const [coords, setCoords] = React.useState(null);

  // Default location of popup
  useEffect(() => {
    if (!isVisible || !anchorElement) {
      setCoords(null);
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const offset = 8; // 8px from bottom of word

    const left = rect.left + window.pageXOffset;
    const top = rect.bottom + window.pageYOffset + offset;

    setCoords({ left, top });
  }, [isVisible, anchorElement]);

  // Adjust popup location when too close to top/bottom/left/right
  useEffect(() => {
    if (!isVisible || !anchorElement || !modalRef.current || !coords) return;

    const wordRect = anchorElement.getBoundingClientRect();
    const popupRect = modalRef.current.getBoundingClientRect();
    const verticalOffset = 8; // 8px from top of word
    const horizontalOffset = 20; // 20px left/right margin

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
  }, [isVisible, anchorElement, coords]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !spellCheckNode) return null;

  const suggestions = spellCheckNode.getSuggestions();
  const originalWord = spellCheckNode.getTextContent();
  const issueType = spellCheckNode.getIssueType();

  const handleSuggestionClick = (suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const handleIgnore = () => {
    if (onIgnore) {
      onIgnore();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalStyle = coords
    ? {
        position: 'absolute',
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        zIndex: 1000,
        pointerEvents: 'auto',
      }
    : {};

  return ReactDOM.createPortal(
    <SpellCheckModalOverlay onClick={handleOverlayClick}>
      <SpellCheckModal ref={modalRef} style={modalStyle} onMouseDownCapture={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <SpellCheckModalHeader>
          <HeaderLeft>
            <SpellCheckIcon>{issueType === 'misspelling' ? 'S' : 'G'}</SpellCheckIcon>
            <CorrectText>Correct</CorrectText>
            <ArrowDown />
          </HeaderLeft>
          <HeaderRight>
            <SpellCategory>{issueType === 'misspelling' ? 'Spelling' : 'Grammar'}</SpellCategory>
            <CloseBtn onClick={onClose} aria-label="Close modal">
              X
            </CloseBtn>
          </HeaderRight>
        </SpellCheckModalHeader>
        <ContentWrapper>
          <SectionHeader>
            <SectionTitle>{issueType === 'misspelling' ? 'Spelling' : 'Grammar'}</SectionTitle>
          </SectionHeader>

          <SectionMessage>
            {issueType === 'misspelling' ? (
              <>
                Possible spelling mistake found: &quot;<strong>{originalWord}</strong>&quot;
              </>
            ) : (
              <>
                Possible grammar issue detected: &quot;<strong>{originalWord}</strong>&quot;
              </>
            )}
          </SectionMessage>

          <ButtonGroup>
            {suggestions.length > 0 ? (
              suggestions.slice(0, 10).map((suggestion, index) => (
                <SuggestionButton key={index} className="btn btn-primary" onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </SuggestionButton>
              ))
            ) : (
              <NoSuggestions>No suggestions available</NoSuggestions>
            )}
            <IgnoreButton onClick={handleIgnore} title="Keep the original word">
              Ignore
            </IgnoreButton>
          </ButtonGroup>
        </ContentWrapper>
      </SpellCheckModal>
    </SpellCheckModalOverlay>,
    document.body
  );
}
