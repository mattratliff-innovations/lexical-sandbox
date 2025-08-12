import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import styled from '@emotion/styled';
import { useDataContext } from '../DataContext';
import { ScribeModal, XCloseBtn } from '../../../../components/ScribeComponents';
import { H1 } from '../../../../components/typography';
import { HeaderContainer, Body, Footer } from '../../../util/modalDesignComponents';
import { INSERT_FOOTNOTE_COMMAND } from '../EndnotePlugin';

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
`;

const BtnContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export default function AddEndnoteModal({ 
  showAddEndnoteModal, 
  setShowAddEndnoteModal,
  currentEndnote = null
}) {
  const { draftState, setDraftState } = useDataContext();
  const [endnoteText, setEndnoteText] = useState('');

  // Get current endnotes from draft state or global manager
  const endnotes = useMemo(() => {
    // First try global endnote manager
    if (window.endnoteManager && window.endnoteManager.initialized) {
      const globalEndnotes = window.endnoteManager.getAllEndnotes();
      console.log('AddEndnoteModal - Using global endnote manager:', globalEndnotes);
      return globalEndnotes;
    }
    
    // Fallback to draft state
    if (draftState?.endNotes && Array.isArray(draftState.endNotes)) {
      console.log('AddEndnoteModal - Using draft state endnotes:', draftState.endNotes);
      return draftState.endNotes;
    }
    
    console.log('AddEndnoteModal - No endnotes found, using empty array');
    return [];
  }, [draftState?.endNotes]);

  // Determine if we're editing an existing endnote
  const isEditing = currentEndnote !== null;
  const endnoteId = currentEndnote?.getEndnoteId ? currentEndnote.getEndnoteId() : null;
  
  console.log('AddEndnoteModal - State check:', {
    showAddEndnoteModal,
    isEditing,
    currentEndnote,
    endnoteId
  });

  // Find the endnote being edited
  const endnoteToEdit = useMemo(() => {
    if (!isEditing || !endnoteId) {
      console.log('AddEndnoteModal - Not editing, no endnote to find');
      return null;
    }

    console.log('AddEndnoteModal - Looking for endnote with ID:', endnoteId);
    console.log('AddEndnoteModal - Available endnotes:', endnotes);

    // Try to find by exact ID match
    const foundEndnote = endnotes.find(note => {
      const noteId = note.index || note.id;
      return String(noteId) === String(endnoteId);
    });

    if (foundEndnote) {
      console.log('AddEndnoteModal - Found endnote:', foundEndnote);
      return foundEndnote;
    }

    // If we have a currentEndnote object, try to get value from it directly
    if (currentEndnote?.getEndnoteValue) {
      const directValue = currentEndnote.getEndnoteValue();
      console.log('AddEndnoteModal - Using direct value from currentEndnote:', directValue);
      return {
        index: endnoteId,
        value: directValue,
        text: currentEndnote.getTextContent ? currentEndnote.getTextContent() : ''
      };
    }

    console.log('AddEndnoteModal - No endnote found for editing');
    return null;
  }, [isEditing, endnoteId, endnotes, currentEndnote]);

  // Initialize form when modal opens
  useEffect(() => {
    console.log('AddEndnoteModal - Modal state changed:', {
      showAddEndnoteModal,
      isEditing,
      endnoteToEdit,
      currentEndnote,
      endnoteId
    });

    if (showAddEndnoteModal) {
      if (isEditing && endnoteToEdit) {
        console.log('AddEndnoteModal - Setting text for editing:', endnoteToEdit.value);
        setEndnoteText(endnoteToEdit.value || '');
      } else if (isEditing && currentEndnote) {
        // Fallback: get value directly from currentEndnote if endnoteToEdit is null
        const directValue = currentEndnote.getEndnoteValue ? currentEndnote.getEndnoteValue() : '';
        console.log('AddEndnoteModal - Using direct value from currentEndnote:', directValue);
        setEndnoteText(directValue);
      } else {
        console.log('AddEndnoteModal - Clearing text for new endnote');
        setEndnoteText('');
      }
    }
  }, [showAddEndnoteModal, isEditing, endnoteToEdit, currentEndnote, endnoteId]);

  const handleClose = () => {
    setEndnoteText('');
    setShowAddEndnoteModal(false);
  };

  const handleSubmit = () => {
    const trimmedText = endnoteText.trim();
    
    if (!trimmedText) {
      console.log('AddEndnoteModal - No text provided, not submitting');
      return;
    }

    console.log('AddEndnoteModal - Submitting endnote:', {
      isEditing,
      endnoteId,
      text: trimmedText
    });

    if (isEditing && endnoteId) {
      // Update existing endnote
      console.log('AddEndnoteModal - Updating existing endnote');
      
      // Update in global endnote manager
      if (window.endnoteManager) {
        window.endnoteManager.updateEndnote(parseInt(endnoteId), trimmedText);
        console.log('AddEndnoteModal - Updated in global manager');
      }

      // Update in Lexical editor if available
      if (window.updateEndnote) {
        window.updateEndnote(parseInt(endnoteId), trimmedText);
        console.log('AddEndnoteModal - Updated in Lexical editor');
      }

      // Update draft state
      setDraftState(currentDraftState => {
        const updatedEndNotes = (currentDraftState.endNotes || []).map(note => 
          String(note.index) === String(endnoteId) 
            ? { ...note, value: trimmedText }
            : note
        );
        
        console.log('AddEndnoteModal - Updated draft state endnotes:', updatedEndNotes);
        return { ...currentDraftState, endNotes: updatedEndNotes };
      });
      
    } else {
      // Create new endnote
      console.log('AddEndnoteModal - Creating new endnote');
      
      // Dispatch command to create new endnote in the editor
      if (window.lexicalEditor) {
        try {
          window.lexicalEditor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, trimmedText);
          console.log('AddEndnoteModal - Dispatched INSERT_FOOTNOTE_COMMAND');
        } catch (error) {
          console.error('AddEndnoteModal - Error dispatching command:', error);
        }
      }
    }

    handleClose();
  };

  const modalTitle = isEditing ? 'Edit Endnote' : 'Add Endnote';
  const submitText = isEditing ? 'Update' : 'Add';

  return (
    <ScribeModal showModal={showAddEndnoteModal} width="md">
      <HeaderContainer data-testid="addEndnoteModal">
        <H1 className="noMargin">{modalTitle}</H1>
        <XCloseBtn handleClose={handleClose} />
      </HeaderContainer>

      <Body className="mb-4">
        <div className="row m-0 mt-4">
          <div className="col-lg-12">
            {isEditing && endnoteToEdit && (
              <div className="mb-3">
                <strong>Reference Text:</strong> {endnoteToEdit.text || currentEndnote?.getTextContent?.() || 'N/A'}
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="endnoteText">
                <strong>Endnote Text:</strong>
              </label>
              <StyledTextArea
                id="endnoteText"
                value={endnoteText}
                onChange={(e) => setEndnoteText(e.target.value)}
                placeholder="Enter the endnote text..."
                rows={4}
                data-testid="endnoteTextArea"
              />
            </div>
          </div>
        </div>
      </Body>

      <Footer>
        <BtnContainer>
          <DrButton 
            variant="primary" 
            data-testid="submitEndnoteButton" 
            className="btn-size" 
            onClick={handleSubmit}
            disabled={!endnoteText.trim()}
          >
            {submitText}
          </DrButton>

          <DrButton 
            variant="secondary" 
            data-testid="cancelEndnoteButton" 
            onClick={handleClose} 
            className="btn-size"
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
  currentEndnote: PropTypes.shape({
    getEndnoteId: PropTypes.func,
    getEndnoteValue: PropTypes.func,
    getTextContent: PropTypes.func,
  }),
};