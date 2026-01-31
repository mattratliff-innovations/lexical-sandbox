import React from 'react';

import PropTypes from 'prop-types';

import { BoldText, NormalText, SelectorContainer, SelectorContent, VaribleTitleContainer } from './AddContentModalDesignComponents';
import selectContentOption from './SelectorUtils';
import { useDataContext } from '../DataContext';
import { getVariableValue } from '../ScribeDocumentConstants';

export default function VariableSelector({ standardItem, setContentToInsert, setAddBtnDisabled }) {
  const { draftState, currentUser } = useDataContext();

  const getTitleVariableValue = (variableName) => {
    if (!draftState) return '';
    const variableValue = getVariableValue(variableName, draftState, currentUser);
    return variableValue ? ` | ${variableValue}` : '';
  };

  return (
    <React.Fragment key={standardItem.id}>
      <SelectorContainer
        data-testid={standardItem.id}
        onClick={(e) => selectContentOption(e, `[[[${standardItem.name}]]]`, setContentToInsert, setAddBtnDisabled)}>
        <VaribleTitleContainer>
          <BoldText>{standardItem.name}</BoldText>
          <NormalText>{getTitleVariableValue(standardItem.name)}</NormalText>
        </VaribleTitleContainer>
        <SelectorContent>{standardItem.description}</SelectorContent>
      </SelectorContainer>
    </React.Fragment>
  );
}

VariableSelector.propTypes = {
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
};
