import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';

export const DEFAULT_HIGHLIGHT_COLOR = 'yellow';
export default function HighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  // toggles highlight on or off
  const applyHighlight = (color = DEFAULT_HIGHLIGHT_COLOR) => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      editor.update(() => {
        const current = $getSelectionStyleValueForProperty(selection, 'background-color', '');

        const toggleColor = current === color ? null : color;
        $patchStyleText(selection, { 'background-color': toggleColor });
      });
    }
  };

  useEffect(() => {
    mergeRegister(
      editor.registerCommand(
        'APPLY_HIGHLIGHT',
        () => {
          applyHighlight(DEFAULT_HIGHLIGHT_COLOR);

          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
}
