import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { importLexicalHtml } from './lexicalUtil';

export default function DefaultHtmlValuePlugin({ initialValue, onChange }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialValue && initialValue.trim() !== '') {
      console.log('DefaultHtmlValuePlugin - Setting initial value:', initialValue.substring(0, 100) + '...');
      
      // Import HTML with potential endnotes
      importLexicalHtml(editor, initialValue);
      
      // Trigger onChange after import
      if (onChange) {
        setTimeout(onChange, 100);
      }
    }
  }, [editor, initialValue, onChange]);

  return null;
}