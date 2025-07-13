// SpellCheckerPluginModal.js
import React, { useEffect, useRef } from 'react';
import './SpellCheckPluginModal.css';

export function SpellCheckPluginModal({ 
  isVisible, 
  onClose, 
  spellCheckNode, 
  editor, 
  position = { x: 0, y: 0 },
  onApplySuggestion,
  onIgnore
}) {
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
    pointerEvents: 'auto'
  };

  return (
    <div className="spell-checker-modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="spell-checker-modal" 
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spell-checker-modal-header">
          <div className="header-left">
            <div className="spell-check-icon">S</div>
            <span className="correct-text">Correct</span>
            <div className="dropdown-arrow"></div>
          </div>
          <div className="header-right">
            <span className="basic-badge">Spelling</span>
            <button className="close-btn" onClick={onClose} aria-label="Close modal">×</button>
          </div>
        </div>
        
        <div className="spell-checker-modal-content">
          <div className="section-header">
            <span className="section-title">Spelling</span>
            <div className="info-icon" title="Spelling suggestions">i</div>
          </div>
          
          <div className="message">
            Possible spelling mistake found: "<strong>{originalWord}</strong>"
          </div>
          
          <div className="button-group">
            {suggestions.length > 0 ? (
              suggestions.slice(0, 3).map((suggestion, index) => (
                <button 
                  key={index}
                  className="btn btn-primary"
                  onClick={() => handleSuggestionClick(suggestion)}
                  title={`Replace with "${suggestion}"`}
                >
                  {suggestion}
                </button>
              ))
            ) : (
              <div className="no-suggestions">No suggestions available</div>
            )}
            <button 
              className="btn btn-secondary" 
              onClick={handleIgnore}
              title="Keep the original word"
            >
              Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}