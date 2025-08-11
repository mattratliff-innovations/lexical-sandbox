import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import styled from '@emotion/styled';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical';
import { INSERT_FOOTNOTE_COMMAND } from './EndnotePlugin';
import { useDataContext } from '../DataContext';
import { HeaderContainer, Body, Footer } from '../../util/modalDesignComponents';
import { H1 } from '../../../components/typography';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

const StyledTextArea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const StyledLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
`;

const SelectedTextDisplay = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 16px;
  font-style: italic;
  color: #6c757d;
`;

const BtnContainer = styled.div`
  display: flex;
  gap: 16px;
`;

export default function AddEndnoteModal({ showAddEndnoteModal, setShowAddEndnoteModal }) {
  const [editor] = useLexicalComposerContext();
  const [endnoteText, setEndnoteText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [existingEndnote, setExistingEndnote] = useState(null);
  const { draftState, setDraftState } = useDataContext();

  useEffect(() => {
    if (showAddEndnoteModal) {
      // Get current selection and check for existing endnote
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const selectedContent = selection.getTextContent();
          setSelectedText(selectedContent);

          // Check if the selected text or cursor position has an existing endnote
          const nodes = selection.getNodes();
          if (nodes.length > 0) {
            const node = nodes[0];
            
            // Check if this is an endnote node
            if (node.getType && node.getType() === 'footnote') {
              const endnoteId = node.getEndnoteId();
              const existingNote = draftState.endNotes?.find(note => note.index === endnoteId);
              if (existingNote) {
                setExistingEndnote(existingNote);
                setEndnoteText(existingNote.value || '');
                setSelectedText(existingNote.text || selectedContent);
              }
            } else if ($isTextNode(node)) {
              // Check if cursor is on text that might be part of an endnote
              const textContent = node.getTextContent();
              const { offset } = selection.anchor;
              
              // Find existing endnote by matching text content
              const matchingEndnote = draftState.endNotes?.find(note => 
                textContent.includes(note.text) || note.text.includes(textContent)
              );
              
              if (matchingEndnote) {
                setExistingEndnote(matchingEndnote);
                setEndnoteText(matchingEndnote.value || '');
                setSelectedText(matchingEndnote.text || selectedContent);
              }
            }
          }
        }
      });
    } else {
      // Reset state when modal closes
      setEndnoteText('');
      setSelectedText('');
      setExistingEndnote(null);
    }
  }, [showAddEndnoteModal, editor, draftState.endNotes]);

  const handleSave = () => {
    if (!endnoteText.trim()) {
      alert('Please enter endnote content');
      return;
    }

    if (existingEndnote) {
      // Update existing endnote
      const updatedEndNotes = draftState.endNotes?.map(note => 
        note.index === existingEndnote.index 
          ? { ...note, value: endnoteText.trim(), text: selectedText }
          : note
      ) || [];

      setDraftState(prev => ({
        ...prev,
        endNotes: updatedEndNotes
      }));
    } else {
      // Create new endnote
      const nextIndex = Math.max(0, ...(draftState.endNotes?.map(note => note.index) || [0])) + 1;
      
      const newEndNote = {
        index: nextIndex,
        text: selectedText,
        value: endnoteText.trim(),
        ref: `endnote-ref-${nextIndex}`
      };

      const updatedEndNotes = [...(draftState.endNotes || []), newEndNote];
      
      setDraftState(prev => ({
        ...prev,
        endNotes: updatedEndNotes
      }));

      // Insert the footnote in the editor
      editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, null);
    }

    handleClose();
  };

  const handleDelete = () => {
    if (existingEndnote && window.confirm('Are you sure you want to delete this endnote?')) {
      const updatedEndNotes = draftState.endNotes?.filter(note => 
        note.index !== existingEndnote.index
      ) || [];

      setDraftState(prev => ({
        ...prev,
        endNotes: updatedEndNotes
      }));

      handleClose();
    }
  };

  const handleClose = () => {
    setShowAddEndnoteModal(false);
    setEndnoteText('');
    setSelectedText('');
    setExistingEndnote(null);
  };

  return (
    <ScribeModal showModal={showAddEndnoteModal} width="md">
      <HeaderContainer>
        <H1>{existingEndnote ? 'Edit Endnote' : 'Add Endnote'}</H1>
        <XCloseBtn handleClose={handleClose} />
      </HeaderContainer>

      <Body>
        {selectedText && (
          <div>
            <StyledLabel>Selected Text:</StyledLabel>
            <SelectedTextDisplay>"{selectedText}"</SelectedTextDisplay>
          </div>
        )}

        <div>
          <StyledLabel htmlFor="endnote-textarea">
            Endnote Content {existingEndnote && `(#${existingEndnote.index})`}:
          </StyledLabel>
          <StyledTextArea
            id="endnote-textarea"
            value={endnoteText}
            onChange={(e) => setEndnoteText(e.target.value)}
            placeholder="Enter the endnote content here..."
            autoFocus
          />
        </div>
      </Body>

      <Footer>
        <BtnContainer>
          <DrButton 
            variant="primary" 
            onClick={handleSave}
            data-testid="save-endnote-button"
          >
            {existingEndnote ? 'Update' : 'Add'} Endnote
          </DrButton>

          {existingEndnote && (
            <DrButton 
              variant="danger" 
              onClick={handleDelete}
              data-testid="delete-endnote-button"
            >
              Delete Endnote
            </DrButton>
          )}

          <DrButton 
            variant="secondary" 
            onClick={handleClose}
            data-testid="cancel-endnote-button"
          >
            Cancel
          </DrButton>
        </BtnContainer>
      </Footer>
    </ScribeModal>
  );
}

AddEndnoteModal.propTypes = {
  showAddEndnoteModal: PropTypes.bool.isRequired,
  setShowAddEndnoteModal: PropTypes.func.isRequired,
};