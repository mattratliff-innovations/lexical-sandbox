import React, { useState } from 'react';

import { DrButton } from '@druid/druid';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { Name, SnippetContainer, SnippetGroupContainer, SnippetTitleLine } from './AddContentModalDesignComponents';
import selectContentOption from './SelectorUtils';

const drBtnStyles = { button: { backgroundColor: 'white', border: 'none' } };

export default function SnippetGroupSelector({ standardItem, setContentToInsert, setAddBtnDisabled }) {
  const [chevron, setChevron] = useState('chevronDown');
  const handleSnippetGroupClick = () => setChevron(chevron === 'chevronUp' ? 'chevronDown' : 'chevronUp');

  return (
    <>
      <SnippetGroupContainer onClick={handleSnippetGroupClick}>
        <DrButton
          data-testid={standardItem.id}
          isDisabled={standardItem?.snippets?.length === 0}
          unstyled
          styles={drBtnStyles}
          ariaLabel={chevron === 'chevronDown' ? `Expand up ${standardItem?.name}` : `Expand down ${standardItem?.name}`}>
          {chevron === 'chevronDown' ? <ChevronDown stroke="currentColor" strokeWidth="2" /> : <ChevronUp stroke="currentColor" strokeWidth="2" />}
        </DrButton>

        <Name>{`${standardItem?.name} | `}</Name>
        <div>{`${standardItem?.snippets?.length} Snippets`}</div>
      </SnippetGroupContainer>

      {chevron === 'chevronUp' &&
        standardItem?.snippets?.map((snippet) => (
          <React.Fragment key={snippet.id}>
            <SnippetContainer
              data-testid={snippet.id}
              onClick={(e) => selectContentOption(e, snippet.content, setContentToInsert, setAddBtnDisabled)}>
              <SnippetTitleLine>{`${snippet.name} | ${snippet.code}`}</SnippetTitleLine>
            </SnippetContainer>
          </React.Fragment>
        ))}
    </>
  );
}

SnippetGroupSelector.propTypes = {
  setContentToInsert: PropTypes.func.isRequired,
  setAddBtnDisabled: PropTypes.func.isRequired,
  standardItem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    content: PropTypes.string,
    snippets: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        content: PropTypes.string,
      })
    ),
  }).isRequired,
};
