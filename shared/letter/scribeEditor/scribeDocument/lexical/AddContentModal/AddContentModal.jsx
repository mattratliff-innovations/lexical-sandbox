/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { DrButton } from '@druid/druid';
import { $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $setSelection } from 'lexical';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import './AddContentModal.css';
import SearchInput from '../../../../../../components/searchInput/SearchInput';
import { H1 } from '../../../../../../components/typography';
import { createAuthenticatedAxios } from '../../../../../../http/authenticatedAxios';
import { useDataContext } from '../../DataContext';
import SnippetGroupSelector from '../SnippetGroupSelector';
import StandardParagraphSelector from '../StandardParagraphSelector';
import VariableSelector from '../VariableSelector';
import { AddContentBtn, ContentSection } from './AddContentModalComponents';
import { getAvailableStandardParagraphsFormLetterType, getSnippetGroupsForLetterType, getSnippetsGroups, getVariables } from './AddContentModalUtils';
import BasicModal, { basicModalUtilityClassNames as modalClassNames } from '../../../../../../components/basicModal/BasicModal';

export default function AddContentModal({ showAddContentModal, setShowAddContentModal }) {
  const axios = createAuthenticatedAxios();

  const { draftState, setDraftState } = useDataContext();
  const [editor] = useLexicalComposerContext();

  const [snippetGroupListData, setSnippetGroupListData] = useState([]);
  const [showSnippetGroupList, setShowSnippetGroupList] = useState(false);
  const [standardParagraphListData, setStandardParagraphListData] = useState([]);
  const [showStandardParagraphList, setShowStandardParagraphList] = useState(false);
  const [contentToInsert, setContentToInsert] = useState();
  const [addBtnDisabled, setAddBtnDisabled] = useState(true);
  const [contentIsLocked, setContentIsLocked] = useState(false);
  const [variableListData, setVariableListData] = useState([]);
  const [showVariableList, setShowVariableList] = useState(false);
  const [variableSearchResultList, setVariableSearchResultList] = useState([]);
  const [fetchVariables, setFetchVariables] = useState(false);
  const [fetchAllSnippets, setFetchAllSnippets] = useState(false);

  const { register, getValues } = useForm();

  const handleInsert = (textToInsert) => {
    editor.focus(); // editor needs to regain focus
    editor.update(() => {
      const selection = $getSelection();
      const clonedSelection = selection.clone(); // Clone now to avoid the frozen selection object
      $setSelection(clonedSelection);
      const parser = new DOMParser();
      const dom = parser.parseFromString(textToInsert, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      $getSelection()?.insertNodes(nodes);
    });
  };

  const resetModal = () => {
    setShowAddContentModal(false);
    setShowSnippetGroupList(false);
    setShowStandardParagraphList(false);
    setShowVariableList(false);
    setAddBtnDisabled(true);
  };

  const insertText = () => {
    if (contentIsLocked) {
      // only for locked paragraph and in draft
      const newSection = {
        id: null,
        frontEndId: uuidv4(),
        text: contentToInsert,
        locked: true,
      };

      const nextSections = [...draftState.sections, newSection];
      setDraftState((currentDraftState) => ({
        ...currentDraftState,
        sections: nextSections,
      }));
    } else handleInsert(contentToInsert);

    resetModal();
  };

  useEffect(() => {
    if (fetchAllSnippets) {
      if (draftState) getSnippetGroupsForLetterType(axios, setSnippetGroupListData, draftState);
      else getSnippetsGroups(axios, setSnippetGroupListData);
    }
  }, [fetchAllSnippets]);

  useEffect(
    () => getAvailableStandardParagraphsFormLetterType(axios, setStandardParagraphListData, draftState),
    [draftState?.letterTypeId, draftState?.registration?.formTypeName]
  );

  useEffect(() => {
    if (fetchVariables) {
      getVariables(axios, setVariableListData, setVariableSearchResultList);
    }
  }, [fetchVariables]);

  const displaySnippetGroupList = () => {
    if (!fetchAllSnippets) {
      // Only make API call once, when displaying snippets
      setFetchAllSnippets(true);
    }
    setShowSnippetGroupList(true);
    setShowStandardParagraphList(false);
    setShowVariableList(false);
    setAddBtnDisabled(true);
  };

  const displayStandardParagraphList = () => {
    setShowStandardParagraphList(true);
    setShowSnippetGroupList(false);
    setShowVariableList(false);
    setAddBtnDisabled(true);
  };

  const displayVariableList = () => {
    if (!fetchVariables) {
      setFetchVariables(true);
    }
    setShowStandardParagraphList(false);
    setShowSnippetGroupList(false);
    setShowVariableList(true);
    setAddBtnDisabled(true);
  };

  const handleVariableSearch = () => {
    const searchValue = getValues('searchbox');

    if (!searchValue) {
      setVariableSearchResultList(variableListData); // Set to full list, if no search criteria
    } else {
      const filteredArray = variableListData.filter(
        (item) => item.name.toLowerCase().includes(searchValue.toLowerCase()) || item.description.toLowerCase().includes(searchValue.toLowerCase())
      );
      setVariableSearchResultList(filteredArray); // Set to filtered list
    }
  };

  /**
   * TODO: Remove this comment when DIDIT-71360 is complet and we have updated to the latest Druid package
   *
   * MUI's Dialog was causing 508 issues with tabindex and focus. We now use DrModal. (A future ticket will migrate other instances of the modal.
   * Currently, DrModal only sets focus to elements within the shadowRoot. By using the default closeIcon inside the modal the focus trap is fixed. DO NOT
   * add a custom close button until the issue (https://maestro.dhs.gov/jira/browse/DIDIT-71360) is resolved. This will fix further 508 compliance
   * issues with the DrModal.
   */
  return (
    <BasicModal dataTestId="add-content-modal" showModal={showAddContentModal} onCloseHandler={() => setShowAddContentModal(false)}>
      <H1 data-testid="addContentModalHeader" className="noMarginHeader" slot="heading">
        Add Content
      </H1>
      <div className="add-content-modal__content" data-testid="addContentModalBody">
        <p className="add-content-modal__note">
          Please add a snippet, variable, or standard paragraph using the following buttons. All content will be added at the location of the cursor
          within the text block.
        </p>
        <AddContentBtn btnTestId="addStandardParagraphButton" clickHandler={() => displayStandardParagraphList()} text="Add Standard Paragraph" />
        <AddContentBtn btnTestId="addSnippetButton" clickHandler={() => displaySnippetGroupList()} text="Add Snippet" />
        <AddContentBtn btnTestId="addVariableButton" clickHandler={() => displayVariableList()} text="Add Variable" />

        {/* NOTE: When StandParagraph and/or Snippet searches are implemented update/remove conditonal */}
        {showVariableList && <SearchInput registrations={register('searchbox')} labelText="Search Variables" clickHandler={handleVariableSearch} />}
        <div className="add-content-modal__content-container">
          {showSnippetGroupList && (
            <ContentSection
              data={snippetGroupListData}
              Component={SnippetGroupSelector}
              setContentToInsert={setContentToInsert}
              setAddBtnDisabled={setAddBtnDisabled}
            />
          )}
          {showStandardParagraphList && (
            <ContentSection
              data={standardParagraphListData}
              Component={StandardParagraphSelector}
              setContentToInsert={setContentToInsert}
              setAddBtnDisabled={setAddBtnDisabled}
              setContentIsLocked={setContentIsLocked}
            />
          )}
          {showVariableList && (
            <ContentSection
              data={variableSearchResultList}
              Component={VariableSelector}
              setContentToInsert={setContentToInsert}
              setAddBtnDisabled={setAddBtnDisabled}
            />
          )}
        </div>
      </div>
      <DrButton
        className={modalClassNames.footerButton}
        slot="footer"
        variant="primary"
        data-testid="addButton"
        aria-label="Add Button"
        isDisabled={addBtnDisabled}
        onClick={insertText}>
        Add
      </DrButton>
      <DrButton
        className={modalClassNames.footerButton}
        slot="footer"
        variant="secondary"
        data-testid="cancelModalButton"
        onClick={() => resetModal()}>
        Cancel
      </DrButton>
    </BasicModal>
  );
}

AddContentModal.propTypes = {
  showAddContentModal: PropTypes.bool.isRequired,
  setShowAddContentModal: PropTypes.func.isRequired,
};
