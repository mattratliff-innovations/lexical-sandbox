import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import styled from '@emotion/styled';
import { INSERT_FOOTNOTE_COMMAND } from './EndnotePlugin';
import { ScribeModal, XCloseBtn } from '../../../../../components/ScribeComponents';
import { H1 } from '../../../../../components/typography';
import { HeaderContainer, Body, Footer } from '../../../../util/modalDesignComponents';
import { HrNoTopMargin } from '../../../../../components/designedComponents';

const BtnContainer = styled.div`
  display: flex;
  gap: 24px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
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

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const WordDisplay = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 16px;
  font-family: monospace;
  font-size: 14px;
`;

const WordLabel = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
`;

export default function AddEndnoteModal({ 
  showAddEndnoteModal, 
  setShowAddEndnoteModal,
  currentEndnote = null 
}) {
  const [editor] = useLexicalComposerContext();
  const [endnoteValue, setEndnoteValue] = useState('');
  const [selectedWord, setSelectedWord] = useState('');

  // Effect to populate modal when opened
  useEffect(() => {
    if (showAddEndnoteModal) {
      if (currentEndnote) {
        // Editing existing endnote
        setSelectedWord(typeof currentEndnote.getTextContent === 'function' 
          ? currentEndnote.getTextContent() 
          : currentEndnote.text || '');
        setEndnoteValue(typeof currentEndnote.getEndnoteValue === 'function' 
          ? currentEndnote.getEndnoteValue() 
          : currentEndnote.value || '');
      } else {
        // Creating new endnote
        editor.getEditorState().read(() => {
          const selection = editor.getEditorState()._selection;
          if (selection) {
            const selectedText = selection.getTextContent();
            setSelectedWord(selectedText || '');
          }
        });
        setEndnoteValue('');
      }
    }
  }, [showAddEndnoteModal, currentEndnote, editor]);

  // Clear form when modal closes
  useEffect(() => {
    if (!showAddEndnoteModal) {
      setEndnoteValue('');
      setSelectedWord('');
    }
  }, [showAddEndnoteModal]);

  const handleSubmit = () => {
    if (currentEndnote && typeof currentEndnote.getEndnoteId === 'function') {
      // Update existing endnote
      const endnoteId = currentEndnote.getEndnoteId();
      if (window.updateEndnote) {
        window.updateEndnote(endnoteId, endnoteValue);
      }
    } else {
      // Create new endnote
      editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, endnoteValue);
    }
    
    setShowAddEndnoteModal(false);
  };

  const handleCancel = () => {
    setShowAddEndnoteModal(false);
  };

  const isEditing = !!currentEndnote;

  return (
    <ScribeModal showModal={showAddEndnoteModal} width="md">
      <HeaderContainer data-testid="endnote-modal">
        <H1 className="noMarginEndnote">
          {isEditing ? 'Edit Endnote' : 'Add Endnote'}
        </H1>
        <XCloseBtn handleClose={handleCancel} />
      </HeaderContainer>

      <Body className="mb-4">
        <div className="col-sm-8">
          <HrNoTopMargin />
        </div>

        <div className="row m-0 mt-4">
          <div className="col-lg-12">
            {selectedWord && (
              <>
                <WordLabel>
                  {isEditing ? 'Associated Word/Phrase:' : 'Selected Word/Phrase:'}
                </WordLabel>
                <WordDisplay>"{selectedWord}"</WordDisplay>
              </>
            )}
            
            <Label htmlFor="endnote-text">
              Endnote Text:
            </Label>
            <TextArea
              id="endnote-text"
              value={endnoteValue}
              onChange={(e) => setEndnoteValue(e.target.value)}
              placeholder="Enter your endnote text here..."
              data-testid="endnote-textarea"
            />
          </div>
        </div>
      </Body>

      <Footer>
        <BtnContainer>
          <DrButton
            variant="primary"
            data-testid="saveEndnoteButton"
            className="btn-size"
            onClick={handleSubmit}
            disabled={!endnoteValue.trim()}
          >
            {isEditing ? 'Update' : 'Add'}
          </DrButton>

          <DrButton
            variant="secondary"
            data-testid="cancelEndnoteButton"
            onClick={handleCancel}
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
    getTextContent: PropTypes.func,
    getEndnoteValue: PropTypes.func,
    text: PropTypes.string,
    value: PropTypes.string,
  }),
};