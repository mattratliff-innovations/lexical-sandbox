/* eslint-disable require-loading-check-for-axios */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DrButton, DrIcon } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $setSelection } from 'lexical';
import { useDataContext } from '../DataContext';
import SnippetGroupSelector from './SnippetGroupSelector';
import StandardParagraphSelector from './StandardParagraphSelector';
import { Body, HeaderContainer } from '../../../../util/modalDesignComponents';
import { HrNoTopMargin, BtnContainer, StyledLabel, StyledNote } from '../../../../../components/designedComponents';
import { ContentContainer } from './AddEndnoteModalDesignComponents';
import { H1 } from '../../../../../components/typography';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../../../http/authenticatedAxios';
import { ScribeModal, XCloseBtn } from '../../../../../components/ScribeComponents';
import AddEndnoteButton from '../../../../../assets/icon-endnotes.svg';
import AsteriskButton from '../../../../../assets/icon-asterisk.svg';

export default function AddEndnoteModal({ showAddEndnoteModal, setShowAddEndnoteModal }) {
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
  const [endNoteDisabled, setEndNoteDisabled] = useState(true);

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

    setShowAddEndnoteModal(false);
  };

  function getSnippetGroupsForDraft() {
    axios
      .get(`${APP_API_ENDPOINT}/snippet_groups/snippet_groups_for_letter_type`, {
        params: {
          letter_type_id: draftState?.letterTypeId,
          form_type_code: draftState?.registration?.formTypeName,
        },
      })
      .then((response) => setSnippetGroupListData(response.data))
      .catch(() => {
        toast.error('There was an error retrieving the Snippets', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }

  function getAllSnippetsGroups() {
    axios
      .get(`${APP_API_ENDPOINT}/snippet_groups`)
      .then((response) => setSnippetGroupListData(response.data))
      .catch(() => {
        toast.error('There was an error retrieving the Snippet Groups', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }

  useEffect(() => {
    if (draftState) getSnippetGroupsForDraft();
    else getAllSnippetsGroups();
  }, []);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`, {
        params: {
          letter_type_id: draftState?.letterTypeId,
          form_type_code: draftState?.registration?.formTypeName,
        },
      })
      .then((response) => {
        const sortedParagraphs = response.data.sort((a, b) => a.code.localeCompare(b.code));
        setStandardParagraphListData(sortedParagraphs);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Standard Paragraph list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, [draftState?.letterTypeId, draftState?.registration?.formTypeName]);

  const displaySnippetGroupList = () => {
    setShowSnippetGroupList(true);
    setShowStandardParagraphList(false);
    setAddBtnDisabled(true);
  };

  const displayStandardParagraphList = () => {
    setShowStandardParagraphList(true);
    setShowSnippetGroupList(false);
    setAddBtnDisabled(true);
  };

  return (
    <ScribeModal showModal={showAddEndnoteModal}>
      <HeaderContainer>
        <H1 data-testid="addContentModalHeader" className="noMarginHeader">
          Endnotes
        </H1>

        <XCloseBtn handleClose={() => setShowAddEndnoteModal(false)} />
      </HeaderContainer>

      <Body data-testid="addContentModalBody">
        <div className="col-sm-6">
          <HrNoTopMargin />
        </div>

        <StyledNote>Note: Endnotes will be added at the location of the cursor.</StyledNote>

        <div className="row mt-3">
          <div className="col-lg-12">
            <span>
              <DrButton
                data-testid="addEndnoteButton"
                styles={{
                  button: { borderColor: 'black', marginRight: '8px' },
                }}
                disabled={endNoteDisabled}
                variant="secondary"
                size="small"
                id="addEndnoteButton"
                ariaLabel="Add Endnote"
                onClick={() => displayStandardParagraphList()}>
                <img src={AddEndnoteButton} alt="Add Endnote" title="Add Endnote" />
              </DrButton>

              <StyledLabel>New Endnote</StyledLabel>
            </span>

            <span className="ms-5">
              <DrButton
                data-testid="referenceExistingEndnoteButton"
                styles={{
                  button: { borderColor: 'black', marginRight: '8px' },
                }}
                variant="secondary"
                size="small"
                id="referenceExistingEndnoteButton"
                ariaLabel="Reference Existing Endnote"
                onClick={() => displaySnippetGroupList()}>
                <DrIcon iconName="asterisk" color="black" />
              </DrButton>

              <StyledLabel>Reference Existing Endnote</StyledLabel>
            </span>
          </div>
        </div>

        {showSnippetGroupList && (
          <ContentContainer>
            {snippetGroupListData.map((group) => (
              <SnippetGroupSelector snippetGroup={group} setContentToInsert={setContentToInsert} setAddBtnDisabled={setAddBtnDisabled} />
            ))}
          </ContentContainer>
        )}

        {showStandardParagraphList && (
          <ContentContainer>
            {standardParagraphListData.map((paragraph) => (
              <StandardParagraphSelector
                standardParagraph={paragraph}
                setContentToInsert={setContentToInsert}
                setAddBtnDisabled={setAddBtnDisabled}
                setContentIsLocked={setContentIsLocked}
              />
            ))}
          </ContentContainer>
        )}

        <BtnContainer className="mb-4 mt-4">
          <DrButton
            variant="primary"
            data-testid="addButton"
            aria-label="Add Button"
            isDisabled={addBtnDisabled}
            className="btn-size"
            onClick={insertText}>
            Add
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelModalButton" onClick={() => setShowAddEndnoteModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

AddEndnoteModal.propTypes = {
  showAddEndnoteModal: PropTypes.bool.isRequired,
  setShowAddEndnoteModal: PropTypes.func.isRequired,
};
