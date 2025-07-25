import React from 'react';
import PropTypes from 'prop-types';
import './LetterEditorGuideModal.css';
import { H1 } from '../../../components/typography';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import ShortcutImage from '../../../assets/letter-editor-guide/Ctrl+T.png';
import ControlShift from '../../../assets/letter-editor-guide/Ctrl+Shift.png';
import BoldButton from '../../../assets/letter-editor-guide/Bold.svg';
import ItalicButton from '../../../assets/letter-editor-guide/Italic.svg';
import UnderlineButton from '../../../assets/letter-editor-guide/Underline.svg';
import NumberedListButton from '../../../assets/letter-editor-guide/Numbered List.svg';
import BulletedListButton from '../../../assets/letter-editor-guide/Bulleted List.svg';
import IndentParagraphButton from '../../../assets/letter-editor-guide/Indent Paragraph.svg';
import DecreaseIndentButton from '../../../assets/letter-editor-guide/Decrease Indent.svg';
import AlignLeftButton from '../../../assets/letter-editor-guide/Align Left.svg';
import AlignCenterButton from '../../../assets/letter-editor-guide/Align Center.svg';
import AlignRightButton from '../../../assets/letter-editor-guide/Align Right.svg';
import JustifyTextButton from '../../../assets/letter-editor-guide/Justify Text.svg';
import UndoButton from '../../../assets/letter-editor-guide/Undo.svg';
import RedoButton from '../../../assets/letter-editor-guide/Redo.svg';
import AddFootnoteButton from '../../../assets/letter-editor-guide/Footnote.svg';
import ClearFormattingButton from '../../../assets/letter-editor-guide/Clear Formatting.svg';
import AddEditTableButton from '../../../assets/letter-editor-guide/Table.svg';
import AddContentButton from '../../../assets/letter-editor-guide/Add Content.svg';
import DeleteSectionButton from '../../../assets/letter-editor-guide/Delete.svg';
import AddEndnotesButton from '../../../assets/icon-endnotes.svg';

import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

export default function LetterEditorGuideModal({ showModal, setShowModal }) {
  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="LetterEditorGuideModalHeader">
          Letter Editor Guide
        </H1>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body data-testid="LetterEditorGuideModalBody">
        <form className="mb-3">
          <div className="change-header-modal-body">
            <div id="letter-guide">
              <hr />

              <div id="shortcut-keys">
                <div id="left-panel">
                  <div className="shortcut">
                    <div>
                      <img src={ShortcutImage} alt="" />
                    </div>

                    <div>
                      <b>Ctrl + T</b>
                      <br />
                      <p>Opens and closes the rich text editor for each text block. Use Shift + Tab to enter the menu.</p>
                    </div>
                  </div>

                  <div className="shortcut">
                    <div>
                      <img src={ControlShift} alt="" />
                    </div>

                    <div>
                      <b>Ctrl + Shift</b>
                      <br />
                      <p>Opens table actions while editing a table.</p>
                    </div>
                  </div>
                </div>

                <div id="right-panel">
                  <div className="shortcut">
                    <div className="buttonList">
                      <div>
                        <img src={BoldButton} alt="" />
                        <span alt="">
                          <b>Ctrl + B</b> | Bold
                        </span>
                      </div>

                      <div>
                        <img src={ItalicButton} alt="" />
                        <span alt="">
                          <b>Ctrl + I</b> | Italic
                        </span>
                      </div>
                      <div>
                        <img src={UnderlineButton} alt="" />
                        <span alt="">
                          <b>Ctrl + U</b> | Underline
                        </span>
                      </div>

                      <div>
                        <img src={NumberedListButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Shift + 3</b> | Numbered List
                        </span>
                      </div>

                      <div>
                        <img src={BulletedListButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Shift + B</b> | Bulleted List
                        </span>
                      </div>

                      <div>
                        <img src={IndentParagraphButton} alt="" />
                        <span alt="">
                          <b>Ctrl + M</b> | Indent Paragraph
                        </span>
                      </div>
                      <div>
                        <img src={DecreaseIndentButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Shift + M</b> | Decrease Indent
                        </span>
                      </div>

                      <div>
                        <img src={AlignLeftButton} alt="" />
                        <span alt="">
                          <b>Ctrl + L</b> | Align Left
                        </span>
                      </div>

                      <div>
                        <img src={AlignCenterButton} alt="" />
                        <span alt="">
                          <b>Ctrl + E</b> | Align Center
                        </span>
                      </div>

                      <div>
                        <img src={AlignRightButton} alt="" />
                        <span alt="">
                          <b>Ctrl + R</b> | Align Right
                        </span>
                      </div>
                    </div>

                    <div className="buttonList">
                      <div>
                        <img src={JustifyTextButton} alt="" />
                        <span alt="">
                          <b>Ctrl + J</b> | Justify Text
                        </span>
                      </div>

                      <div>
                        <img src={UndoButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Z</b> | Undo
                        </span>
                      </div>

                      <div>
                        <img src={RedoButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Shift + Z</b> | Redo
                        </span>
                      </div>

                      <div>
                        <img src={AddFootnoteButton} alt="" />
                        <span alt="">
                          <b>Alt + F</b> | Add Footnote
                        </span>
                      </div>

                      <div>
                        <img src={ClearFormattingButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Space</b> | Clear Formatting
                        </span>
                      </div>

                      <div>
                        <img src={AddEditTableButton} alt="" />
                        <span alt="">
                          <b>Alt + M</b> | Add/Edit Table
                        </span>
                      </div>

                      <div>
                        <img src={AddEndnotesButton} alt="" />
                        <span alt="">
                          <b>Alt + E</b> | Add Endnote
                        </span>
                      </div>

                      <div>
                        <img src={AddContentButton} alt="" />
                        <span alt="">
                          <b>Alt + N</b> | Add Content
                        </span>
                      </div>

                      <div>
                        <img src={DeleteSectionButton} alt="" />
                        <span alt="">
                          <b>Ctrl + Del</b> | Delete Section
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Body>
    </ScribeModal>
  );
}

LetterEditorGuideModal.propTypes = {
  setShowModal: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
};
