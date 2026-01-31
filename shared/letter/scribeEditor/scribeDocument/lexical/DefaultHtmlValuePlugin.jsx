import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import PropTypes from 'prop-types';

import { importLexicalHtml } from './lexicalUtil';

export default function DefaultHtmlValuePlugin({ initialValue = '', onChange = null, disabled = false }) {
  const [editor] = useLexicalComposerContext();
  const lastImportedRef = useRef(null);

  useEffect(() => {
    if (!editor || !initialValue || disabled) return;

    // Only import when the actual initialValue string changes
    if (lastImportedRef.current === initialValue) return;

    queueMicrotask(() => {
      importLexicalHtml(editor, initialValue);
      if (onChange) {
        onChange(editor.getEditorState, editor);
      }
      lastImportedRef.current = initialValue;
    });
  }, [editor, initialValue, disabled, onChange]);

  return null;
}

DefaultHtmlValuePlugin.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
