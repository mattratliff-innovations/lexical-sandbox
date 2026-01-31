import { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import PropTypes from 'prop-types';

const SourceCodeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
`;

const SourceCodeHeader = styled.div`
  background-color: #f1f3f4;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WarningText = styled.span`
  color: #d93025;
  font-size: 11px;
`;

const SourceCodeTextarea = styled.textarea`
  width: 100%;
  height: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  resize: vertical;
  background-color: #f8f9fa;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const ErrorBanner = styled.div`
  margin-top: -1px;
  border: 1px solid #d93025;
  border-top: none;
  border-radius: 0 0 4px 4px;
  background: #fde8e7;
  color: #8b1411;
  padding: 8px 12px;
  font-size: 12px;
`;

export default function SourceCodePlugin({ isSourceCodeView, onHtmlChange, initialHtml = ' ', error = null, onExitShortcut = () => {} }) {
  const [htmlContent, setHtmlContent] = useState('');

  // When source view opens or initialHtml changes, populate the textarea.
  useEffect(() => {
    if (isSourceCodeView) {
      setHtmlContent(initialHtml || '');
    }
  }, [initialHtml, isSourceCodeView]);

  const handleHtmlChange = (event) => {
    const newHtml = event.target.value;
    setHtmlContent(newHtml);
    onHtmlChange?.(newHtml); // bubble up so parent can hold latest value
  };

  // Support Ctrl/Cmd + Enter to apply & exit
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onExitShortcut?.();
    }
  };

  if (!isSourceCodeView) return null;

  return (
    <SourceCodeContainer>
      <SourceCodeHeader>
        <span>HTML Source Code</span>
        <WarningText>⚠ Invalid HTML may break formatting</WarningText>
      </SourceCodeHeader>

      <SourceCodeTextarea
        value={htmlContent}
        onChange={handleHtmlChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter HTML content here..."
        spellCheck={false}
        aria-label="HTML Source Code Editor"
        aria-invalid={!!error}
        aria-describedby={error ? 'source-code-error' : undefined}
      />

      {error && (
        <ErrorBanner id="source-code-error">
          {error} Tip: remove scripts, inline event handlers (e.g. <code>onclick</code>), disallowed tags (<code>iframe</code>, <code>object</code>,
          etc.), and unsafe URLs (e.g. <code>javascript:</code>).
        </ErrorBanner>
      )}
    </SourceCodeContainer>
  );
}

SourceCodePlugin.propTypes = {
  isSourceCodeView: PropTypes.bool.isRequired,
  onHtmlChange: PropTypes.func.isRequired,
  initialHtml: PropTypes.string,
  error: PropTypes.string,
  onExitShortcut: PropTypes.func,
};
