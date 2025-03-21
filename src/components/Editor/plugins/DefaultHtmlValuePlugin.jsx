import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { importLexicalHtml } from './lexicalUtil';

export default function DefaultHtmlValuePlugin({ initialValue = '', onChange = null }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (editor && initialValue) {
      importLexicalHtml(editor, initialValue);
      if (onChange) {
        onChange(editor.getEditorState, editor);
      }
    }
  }, [initialValue]);

  return null;
}

DefaultHtmlValuePlugin.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func,
};
