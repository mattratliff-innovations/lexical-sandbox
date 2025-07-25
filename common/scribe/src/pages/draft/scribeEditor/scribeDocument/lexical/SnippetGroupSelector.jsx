import React, { useState } from 'react';
import { DrButton } from '@druid/druid';
import { ChevronUp, ChevronDown } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import { SnippetGroupContainer, Name, SnippetTitleLine, SnippetContainer } from './AddContentModalDesignComponents';

const drBtnStyles = { button: { backgroundColor: 'white', border: 'none' } };

export default function SnippetGroupSelector({ snippetGroup, setContentToInsert, setAddBtnDisabled }) {
  const [chevron, setChevron] = useState('chevronDown');
  const handleSnippetGroupClick = () => setChevron(chevron === 'chevronUp' ? 'chevronDown' : 'chevronUp');

  const selectContentOption = (e, content) => {
    document.querySelectorAll('button.selected').forEach((btn) => btn.classList.remove('selected'));
    e.currentTarget.classList.add('selected');

    setContentToInsert(content);
    setAddBtnDisabled(false);
  };

  return (
    <>
      <SnippetGroupContainer onClick={handleSnippetGroupClick}>
        <DrButton
          data-testid={snippetGroup.id}
          isDisabled={snippetGroup?.snippets?.length === 0}
          unstyled
          styles={drBtnStyles}
          ariaLabel={chevron === 'chevronDown' ? `Expand up ${snippetGroup?.name}` : `Expand down ${snippetGroup?.name}`}>
          {chevron === 'chevronDown' ? <ChevronDown stroke="currentColor" strokeWidth="2" /> : <ChevronUp stroke="currentColor" strokeWidth="2" />}
        </DrButton>

        <Name>{`${snippetGroup?.name} | `}</Name>
        <div>{`${snippetGroup?.snippets?.length} Snippets`}</div>
      </SnippetGroupContainer>

      {chevron === 'chevronUp' &&
        snippetGroup?.snippets?.map((snippet) => (
          <React.Fragment key={snippet.id}>
            <SnippetContainer data-testid={snippet.id} onClick={(e) => selectContentOption(e, snippet.content)}>
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
  snippetGroup: PropTypes.shape({
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
