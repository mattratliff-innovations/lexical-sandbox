/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/prop-types */
// SpellCheckerPluginModal.js
import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const SpellCheckModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 999;
  pointer-events: none;
`;

const SpellCheckModal = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 320px;
  overflow: hidden;
  position: relative;
  pointer-events: all;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const SpellCheckModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
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
  width: 20px;
  height: 20px;
  background-color: #dc2626;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
`;

const CorrectText = styled.div`
  font-size: 14px;
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
  padding: 4px 8px;
  border-radius: 12px;new
  font-size: 12px;
  font-weight: 500;
`;

const CloseBtn = styled.div`
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    color: #333;
    background-color: #f3f4f6;
  }
`;

const ContentWrapper = styled.div`
  padding: 16px;
`;

const SuggestionButton = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
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
  background-color: transparent;
  color: #666;
  border: 1px solid #d1d5db;

  &:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const InfoIcon = styled.div`
  width: 16px;
  height: 16px;
  border: 1.5px solid #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #333;
    color: #333;
  }
`;

const SectionMessage = styled.div`
  font-size: 14px;
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

export default function SpellCheckPluginModal({ isVisible, onClose, spellCheckNode, position = { x: 0, y: 0 }, onApplySuggestion, onIgnore }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isVisible && modalRef.current) {
      // Adjust modal position to stay within viewport
      const modal = modalRef.current;
      const rect = modal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // Adjust horizontal position if modal goes off screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 20; // 20px margin
      }
      if (x < 20) {
        x = 20; // Minimum 20px from left edge
      }

      // Adjust vertical position if modal goes off screen
      if (y + rect.height > viewportHeight) {
        y = position.y - rect.height - 40; // Show above the word instead
      }
      if (y < 20) {
        y = 20; // Minimum 20px from top
      }

      modal.style.left = `${x}px`;
      modal.style.top = `${y}px`;
    }
  }, [isVisible, position]);

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

  const modalStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -8px)', // Center horizontally, small offset vertically
    zIndex: 1000,
    pointerEvents: 'auto',
  };

  return (
    <SpellCheckModalOverlay onClick={handleOverlayClick}>
      <SpellCheckModal ref={modalRef} style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <SpellCheckModalHeader>
          <HeaderLeft>
            <SpellCheckIcon>S</SpellCheckIcon>
            <CorrectText>Correct</CorrectText>
            <ArrowDown />
          </HeaderLeft>
          <HeaderRight>
            <SpellCategory>Spelling</SpellCategory>
            <CloseBtn onClick={onClose} aria-label="Close modal">
              ×
            </CloseBtn>
          </HeaderRight>
        </SpellCheckModalHeader>
        <ContentWrapper>
          <SectionHeader>
            <SectionTitle>Spelling</SectionTitle>
            <InfoIcon title="Add to dictionary">+</InfoIcon>
          </SectionHeader>

          <SectionMessage>
            Possible spelling mistake found: &quot;<strong>{originalWord}</strong>&quot;
          </SectionMessage>

          <ButtonGroup>
            {suggestions.length > 0 ? (
              suggestions.slice(0, 3).map((suggestion, index) => (
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
    </SpellCheckModalOverlay>
  );
}
