/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import { useState } from 'react';

import { DrIcon } from '@druid/druid';
import styled from '@emotion/styled';

import { requestApplySuggestion, requestIgnoreError } from './SpellCheckBus';

const SpellCheckContent = styled.div`
  height: 450px;
  overflow-y: scroll;
`;

const ContentWrapper = styled.div`
  margin: 8px 0;
  padding: 10px;
  border: 2px solid silver; /* not tied to isExpanded */
  border-radius: 8px;
  background-color: ${(p) => (p.isExpanded ? '#f8fafc' : 'white')}; /* subtle expanded hint */
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  /* subtle hover that doesn't look like keyboard focus */
  &:hover {
    background-color: ${(p) => (p.isExpanded ? '#f1f5f9' : '#f8fafc')};
  }

  /* show blue border only when something inside is actually focused */
  &:focus-within {
    border-color: #3b82f6;
    /* optional soft glow:
    box-shadow: 0 0 0 2px rgba(59,130,246,0.25); */
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.button`
  /* reset native button look */
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  margin: 0;
  padding: 2px 0;

  /* make the whole row clickable/focusable */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 6px; /* space between <strong> and the word */
  text-align: left;
  cursor: pointer;

  /* inherit your text styling */
  font: inherit;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;

  /* focus ring is shown by ContentWrapper :focus-within */
  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

const SuggestionButton = styled.button`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
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

  &:focus-visible {
    outline: 2px solid #111;
    outline-offset: 2px;
  }
`;

const NoSuggestions = styled.div`
  padding: 8px 12px;
  color: #666;
  font-size: 14px;
  font-style: italic;
`;

const IconButton = styled.button`
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* normalize size and hit area */
  width: auto;
  height: auto;

  cursor: pointer;
  color: inherit; /* let icons inherit text color */
  transition:
    transform 0.15s ease,
    color 0.15s ease;

  &:hover {
    transform: scale(1.1);
    color: #3b82f6; /* matches SuggestionButton palette */
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export default function SpellCheckPluginAccordion({ issues = [] }) {
  // Track which cards are expanded
  const [expandedSections, setExpandedSections] = useState({});

  // Expand/collapse a card
  const toggleSection = (nodeKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  // Apply a suggestion via the bus
  const handleSuggestionClick = (editorId, nodeKey, suggestion, originalText) => {
    requestApplySuggestion(editorId, nodeKey, suggestion, originalText);
  };

  const handleIgnoreClick = (editorId, nodeKey, originalText, issueType) => {
    requestIgnoreError(editorId, nodeKey, originalText, issueType);
  };

  return (
    <SpellCheckContent>
      {issues.map((it) => {
        const isOpen = !!expandedSections[it.nodeKey];
        const panelId = `spellcard-panel-${it.nodeKey}`;
        const headerId = `spellcard-header-${it.nodeKey}`;

        return (
          <ContentWrapper key={it.nodeKey} isExpanded={isOpen}>
            <SectionHeader>
              <SectionTitle id={headerId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleSection(it.nodeKey)}>
                <strong className={it.issueType === 'misspelling' ? 'spelling' : 'grammar'}>
                  {it.issueType === 'misspelling' ? 'Spelling' : 'Grammar'} |
                </strong>
                {it.originalText}
              </SectionTitle>

              {isOpen && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <IconButton
                    type="button"
                    title="Add to dictionary"
                    aria-label="Add to dictionary"
                    onClick={() => {
                      // TODO: wire up to your real bus call when ready
                      // requestAddToDictionary(it.editorId, it.originalText)
                      // eslint-disable-next-line no-console
                      console.warn('Add to dictionary clicked', it.originalText);
                    }}>
                    <DrIcon iconName="square-plus" size="small" />
                  </IconButton>
                  <IconButton
                    type="button"
                    title={`Ignore ${it.issueType} error`}
                    aria-label={`Ignore ${it.issueType} error`}
                    onClick={() => handleIgnoreClick(it.editorId, it.nodeKey, it.originalText, it.issueType)}>
                    <DrIcon iconName="ban" size="small" />
                  </IconButton>
                </div>
              )}
            </SectionHeader>

            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={headerId}>
                <ButtonGroup>
                  {it.suggestions.length > 0 ? (
                    it.suggestions.slice(0, 20).map((suggestion, index) => (
                      <SuggestionButton
                        key={index}
                        type="button"
                        className="btn btn-primary"
                        aria-label={`Replace '${it.originalText}' with '${suggestion}'`}
                        onClick={() => handleSuggestionClick(it.editorId, it.nodeKey, suggestion, it.originalText)}>
                        {suggestion}
                      </SuggestionButton>
                    ))
                  ) : (
                    <NoSuggestions>No suggestions available</NoSuggestions>
                  )}
                </ButtonGroup>
              </div>
            )}
          </ContentWrapper>
        );
      })}
    </SpellCheckContent>
  );
}
