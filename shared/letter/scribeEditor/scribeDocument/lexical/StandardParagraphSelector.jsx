import React from 'react';

import PropTypes from 'prop-types';

import { IconContainer, SelectorContainer, SelectorContent, SelectorTitleLine } from './AddContentModalDesignComponents';
import selectContentOption from './SelectorUtils';
import Lock from '../../../../../assets/lock.svg';

export default function StandardParagraphSelector({ standardItem, setContentToInsert, setAddBtnDisabled, setContentIsLocked }) {
  const selectContent = (e, paragraph) => {
    selectContentOption(e, paragraph.content, setContentToInsert, setAddBtnDisabled);
    setContentIsLocked(paragraph.locked);
  };

  return (
    <React.Fragment key={standardItem.id}>
      <SelectorContainer data-testid={standardItem.id} onClick={(e) => selectContent(e, standardItem)}>
        <SelectorTitleLine>
          {`${standardItem.name} | ${standardItem.code}`}
          {standardItem.locked && (
            <IconContainer>
              <img src={Lock} alt="locked" />
            </IconContainer>
          )}
        </SelectorTitleLine>

        <SelectorContent>{standardItem.description}</SelectorContent>
      </SelectorContainer>
    </React.Fragment>
  );
}

StandardParagraphSelector.propTypes = {
  setContentToInsert: PropTypes.func.isRequired,
  setAddBtnDisabled: PropTypes.func.isRequired,
  standardItem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    code: PropTypes.string,
    description: PropTypes.string,
    content: PropTypes.string,
    locked: PropTypes.bool,
  }).isRequired,
  setContentIsLocked: PropTypes.func.isRequired,
};
