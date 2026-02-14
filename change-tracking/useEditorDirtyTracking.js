/* eslint-disable import-x/prefer-default-export */
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to track if a Lexical editor has been modified by the user
 * Ignores programmatic updates like spell checking
 *
 * @param {LexicalEditor} editor - The Lexical editor instance
 * @param {string} editorId - Unique identifier for this editor
 * @param {Function} onDirtyChange - Callback when dirty state changes
 * @param {Object} options - Additional options
 * @returns {Object} - { markClean, markSpellCheckStart, markSpellCheckEnd }
 */
export function useEditorDirtyTracking(editor, editorId, onDirtyChange, options = {}) {
  const { ignoreInitialLoad = true, debounceMs = 0 } = options;

  const isSpellCheckRunning = useRef(false);
  const isInitialLoad = useRef(ignoreInitialLoad);
  const isDirtyRef = useRef(false);
  const debounceTimeout = useRef(null);

  // Mark editor as clean (e.g., after save)
  const markClean = useCallback(() => {
    isDirtyRef.current = false;
    onDirtyChange?.(editorId, false);
  }, [editorId, onDirtyChange]);

  // Mark spell check start to ignore updates
  const markSpellCheckStart = useCallback(() => {
    isSpellCheckRunning.current = true;
  }, []);

  // Mark spell check end to resume tracking
  const markSpellCheckEnd = useCallback(() => {
    // Small delay to ensure all spell check updates are processed
    setTimeout(() => {
      isSpellCheckRunning.current = false;
    }, 50);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const unregister = editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
      // Skip if spell check is running
      if (isSpellCheckRunning.current) {
        return;
      }

      // Skip initial load if configured
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      // Skip programmatic updates (tagged)
      if (tags.has('programmatic') || tags.has('history-merge') || tags.has('spell-check')) {
        return;
      }

      // Compare editor states to detect actual changes
      const currentContent = JSON.stringify(editorState.toJSON());
      const prevContent = JSON.stringify(prevEditorState.toJSON());

      if (currentContent !== prevContent && !isDirtyRef.current) {
        isDirtyRef.current = true;

        // Debounce if configured
        if (debounceMs > 0) {
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }
          debounceTimeout.current = setTimeout(() => {
            onDirtyChange?.(editorId, true);
          }, debounceMs);
        } else {
          onDirtyChange?.(editorId, true);
        }
      }
    });

    // eslint-disable-next-line consistent-return
    return () => {
      unregister();
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [editor, editorId, onDirtyChange, debounceMs]);

  // Check current dirty state without triggering callbacks
  const checkIsDirty = useCallback(() => {
    return isDirtyRef.current;
  }, []);

  return {
    markClean,
    markSpellCheckStart,
    markSpellCheckEnd,
    checkIsDirty,
  };
}
