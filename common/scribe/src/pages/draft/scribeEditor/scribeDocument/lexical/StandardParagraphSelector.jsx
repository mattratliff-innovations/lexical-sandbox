import React from 'react';
import PropTypes from 'prop-types';
import Lock from '../../../../../assets/lock.svg';
import { StandardParagraphTitleLine, StandardParagraphContent, StandardParagraphContainer, IconContainer } from './AddContentModalDesignComponents';

export default function StandardParagraphSelector({ standardParagraph, setContentToInsert, setAddBtnDisabled, setContentIsLocked }) {
  const selectContentOption = (e, paragraph) => {
    document.querySelectorAll('button.selected').forEach((btn) => btn.classList.remove('selected'));
    e.currentTarget.classList.add('selected');

    setContentToInsert(paragraph.content);
    setContentIsLocked(paragraph.locked);
    setAddBtnDisabled(false);
  };

  return (
    <React.Fragment key={standardParagraph.id}>
      <StandardParagraphContainer data-testid={standardParagraph.id} onClick={(e) => selectContentOption(e, standardParagraph)}>
        <StandardParagraphTitleLine>
          {`${standardParagraph.name} | ${standardParagraph.code}`}
          {standardParagraph.locked && (
            <IconContainer>
              <img src={Lock} alt="locked" />
            </IconContainer>
          )}
        </StandardParagraphTitleLine>

        <StandardParagraphContent>{standardParagraph.description}</StandardParagraphContent>
      </StandardParagraphContainer>
    </React.Fragment>
  );
}

StandardParagraphSelector.propTypes = {
  setContentToInsert: PropTypes.func.isRequired,
  setAddBtnDisabled: PropTypes.func.isRequired,
  standardParagraph: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    code: PropTypes.string,
    description: PropTypes.string,
    content: PropTypes.string,
    locked: PropTypes.bool,
  }).isRequired,
  setContentIsLocked: PropTypes.func.isRequired,
};
