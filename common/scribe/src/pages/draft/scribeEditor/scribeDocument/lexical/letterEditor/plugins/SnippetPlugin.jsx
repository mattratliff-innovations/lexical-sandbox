import { LexicalTypeaheadMenuPlugin, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { $createExtendedTextNode } from '../../ExtendedTextNode';
import SnippetSelectorNode, { HARD_CODED_SNIPPETS } from '../nodes/SnippetSelectorNode';
import { generateParentLexicalIdAttribute } from '../../LexicalEditor';

export default function SnippetPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState('');

  const setSnippetOnChange = (snippetId, snippetSelectorNode) => {
    editor.update(() => {
      const snippetGroup = HARD_CODED_SNIPPETS.find((group) => group.id === snippetSelectorNode.getSnippetGroupId());

      const selection = $getSelection();
      if (!snippetGroup || !$isRangeSelection(selection)) {
        return;
      }

      snippetSelectorNode.remove();

      const snippet = snippetGroup.snippets.find((targetSnippet) => targetSnippet.id === snippetId);

      selection.insertNodes([$createExtendedTextNode(snippet.text)]);
    });
  };

  const onSelectOption = (selectedOption, nodeToRemove, closeMenu) => {
    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || selectedOption == null) {
        return;
      }

      if (nodeToRemove) {
        nodeToRemove.remove();
      }

      selection.insertNodes([new SnippetSelectorNode(setSnippetOnChange, selectedOption.id)]);

      closeMenu();
    });
  };

  const options = () => {
    if (!queryString) return HARD_CODED_SNIPPETS;
    const result = HARD_CODED_SNIPPETS.filter((snippet) => snippet.name.toUpperCase().indexOf(queryString.toUpperCase()) >= 0);
    return result;
  };

  const checkForSnippetMatch = useBasicTypeaheadTriggerMatch('\\\\', {
    minLength: 0,
  });

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForSnippetMatch}
      options={options()}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (anchorElementRef.current == null || HARD_CODED_SNIPPETS.length === 0) {
          return null;
        }

        return anchorElementRef.current && HARD_CODED_SNIPPETS.length
          ? createPortal(
              // eslint-disable-next-line react/jsx-props-no-spreading
              <div className="typeahead-popover snippet-group" {...generateParentLexicalIdAttribute(editor)}>
                <ul>
                  {options().map((option, index) => (
                    <li
                      key={option.id}
                      tabIndex={-1}
                      className="snippet-group-option"
                      role="option"
                      aria-selected={selectedIndex === index}
                      id={`typeahead-item-${index}`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onKeyDown={() => {
                        setHighlightedIndex(index);
                        selectOptionAndCleanUp(option);
                      }}
                      onClick={() => {
                        setHighlightedIndex(index);
                        selectOptionAndCleanUp(option);
                      }}>
                      <span className="text">{option.name}</span>
                    </li>
                  ))}
                </ul>
              </div>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
}
