import './FontSizeWidget.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import PropTypes from 'prop-types';
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection';
import {
  $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import React, { useState, useCallback, useEffect } from 'react';

const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = '14';

export default function FontSizeWidget({ selectionFontSize = DEFAULT_FONT_SIZE }) {
  const [editor] = useLexicalComposerContext();
  const [fontSize, setFontSize] = useState(selectionFontSize);

  useEffect(() => editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const currentSelectionFontSizeOrDefault = $getSelectionStyleValueForProperty(selection, 'font-size', `${DEFAULT_FONT_SIZE}`);
        const fontSizeNumber = currentSelectionFontSizeOrDefault.replace('px', '');
        setFontSize(fontSizeNumber);
      }
      return false;
    },
    COMMAND_PRIORITY_CRITICAL,
  ), [editor]);

  const updateFontSizeInSelection = useCallback(
    (newFontSize) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, { 'font-size': `${newFontSize}px` });
        }
      });
    },
    [editor],
  );

  const updateFontSizeByInputValue = (inputValueNumber) => {
    let updatedFontSize = Number(inputValueNumber);
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }

    setFontSize(updatedFontSize);
    updateFontSizeInSelection(updatedFontSize);
  };

  const handleKeyPress = (e) => {
    const inputValueNumber = Number(e.key);

    if (e.key === 'Tab') {
      return; // 508: prevents tab trap
    }

    if (['e', 'E', '+', '-'].includes(e.key) || Number.isNaN(inputValueNumber)) {
      e.preventDefault();
      setFontSize('');
      return;
    }

    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();

      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  // 508 bug worth noting. For now to pass 508 we need to disable the fontsize input because it will steal focus from the
  // editor; thus, the editor will lose the selection. Disabling the input will allow the user to tab to the + and - buttons.
  // If we decides to not disable the input field we need to consider using onKeyUp vs onBlur for this method because onBlur
  // does not provide e.key/e.shiftKey and will result in another 508 issue called a 'tab-trap'.
  // Will need another card to figure out the entirety of this feature, for now it will pass 508 and work.
  //
  // const handleInputBlur = (e) => {
  //   if (e.key === 'Tab' && e.shiftKey) {
  //     return;
  //   } else {
  //     const inputValueNumber = Number(fontSize);
  //     updateFontSizeByInputValue(inputValueNumber);
  //   }
  // };

  const handleButtonClick = (fontValueChange) => {
    const number = Number(fontSize) < MIN_ALLOWED_FONT_SIZE ? Number(DEFAULT_FONT_SIZE) : Number(fontSize);
    const newFontSize = number + fontValueChange;
    setFontSize(newFontSize);
    updateFontSizeInSelection(newFontSize);
  };

  useEffect(() => {
    setFontSize(selectionFontSize);
  }, [selectionFontSize]);

  return (
    <div className="toolbar-item flex-container">
      <button
        type="button"
        aria-label="Decrement Font Size"
        title="Decrement Font Size"
        disabled={Number(fontSize) <= MIN_ALLOWED_FONT_SIZE}
        onClick={() => handleButtonClick(-1)}
        className="toolbar-item font-decrement"
      >
        <i className="format minus-icon" />
      </button>

      <input
        type="number"
        value={fontSize}
        className="toolbar-item font-size-input"
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={(e) => setFontSize(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled
        // onKeyUp={handleInputBlur}
      />

      <button
        type="button"
        aria-label="Increment Font Size"
        title="Increment Font Size"
        disabled={Number(fontSize) >= MAX_ALLOWED_FONT_SIZE}
        onClick={() => handleButtonClick(1)}
        className="toolbar-item font-increment"
      >
        <i className="format add-icon" />
      </button>
    </div>
  );
}
export { MIN_ALLOWED_FONT_SIZE, MAX_ALLOWED_FONT_SIZE, DEFAULT_FONT_SIZE };

FontSizeWidget.propTypes = {
  selectionFontSize: PropTypes.string,
};
