/* eslint-disable no-restricted-syntax */
/* eslint-disable no-return-assign */
/* eslint-disable no-use-before-define */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
} from 'lexical';

import { publishIssues, registerApplyHandler } from './SpellCheckBus';
import { $createSpellCheckNode, $isSpellCheckNode, SpellCheckNode } from './SpellCheckNode';
import SpellCheckPluginModal from './SpellCheckPluginModal';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../../../../../../http/authenticatedAxios';

// Helper to check if node is an ElementNode
export function $isElementNode(node) {
  return node && typeof node.getChildren === 'function';
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PLACE_HOLDER_DELIMITER = 'xxx';
const VARIABLE_START_DELIMITER = '[[[';
const VARIABLE_END_DELIMITER = ']]]';

function buildFlatTextForSpellcheck(root) {
  let flatText = '';
  const segments = []; // { node, startOffset, endOffset }
  let offset = 0;

  const addSeparator = () => {
    // Logical separator between blocks/paragraphs.
    // We do NOT record this in segments so any matches that land *only* on
    // this separator simply won't be mapped/highlighted.
    flatText += '\n';
    offset += 1;
  };

  const visit = (n) => {
    // Handle line breaks (soft returns)
    if (n.getType && n.getType() === 'linebreak') {
      flatText += '\n';
      offset += 1;
      return;
    }

    // Plain text nodes (places where we can add highlights)
    if ($isTextNode(n) && !$isSpellCheckNode(n)) {
      const text = n.getTextContent();
      if (!text) return;

      const startOffset = offset;
      flatText += text;
      offset += text.length;
      const endOffset = offset;

      segments.push({ node: n, startOffset, endOffset });
      return;
    }

    // Existing SpellCheckNodes: their text *must* be counted
    // so offsets after them stay correct, but we don't re-highlight inside.
    if ($isSpellCheckNode(n)) {
      const text = n.getTextContent();
      if (!text) return;

      flatText += text;
      offset += text.length;
      return;
    }

    // For element nodes, recurse into children.
    if ($isElementNode(n)) {
      let children = [];
      try {
        children = n.getChildren();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('buildFlatTextForSpellcheck: could not get children', e);
      }

      children.forEach(visit);

      // After finishing a block-level / root-level element, insert a separator
      try {
        const parent = typeof n.getParent === 'function' ? n.getParent() : null;
        const type = typeof n.getType === 'function' ? n.getType() : null;

        const isBlockType = type === 'paragraph' || type === 'heading' || type === 'listitem' || type === 'quote';

        const isRootChild = parent === root;

        if (isBlockType || isRootChild) {
          addSeparator();
        }
      } catch (e) {
        // If anything goes wrong, just skip the separator rather than explode.
        // eslint-disable-next-line no-console
        console.warn('buildFlatTextForSpellcheck: separator error', e);
      }
    }

    // All other node types (decorators, line breaks, etc.) are ignored
    // from this "analysis string". That’s okay as long as we ALWAYS
    // use this same function for both:
    // 1) text we send to LanguageTool
    // 2) offset mapping when we apply highlights.
  };

  visit(root);
  return { flatText, segments };
}

// =========================
// Ignore customIgnoreWordsList: case-insensitive and Unicode-aware
// =========================
function processIgnoredSpans(text, wordsLower) {
  if (!text || !wordsLower?.length) return [];
  const wordChars = "\\p{L}\\p{M}'-"; // letters, accent-marks, apostrophes, and hyphens

  const pattern = new RegExp(
    `(?<=^|[^${wordChars}])(${wordsLower.map(escapeRegex).join('|')})(?=$|[^${wordChars}])`,
    'giu' // global, case-insensitive, unicode
  );

  const spans = [];
  for (const m of text.matchAll(pattern)) {
    const start = m.index;
    const end = start + m[0].length;
    spans.push({ start, end });
  }
  return spans;
}

// =========================
// Ignore variables and placeholders (including the brackets): typing and insertion aware
// =========================
function processIgnoredText(text, startDelimiter, endDelimiter) {
  if (!text) return [];
  const spans = [];
  let i = 0;

  while (i < text.length) {
    const open = text.indexOf(startDelimiter, i);
    if (open === -1) break;

    const close = text.indexOf(endDelimiter, open + startDelimiter.length);
    const end = close === -1 ? text.length : close + endDelimiter.length;
    spans.push({ start: open, end });

    i = end;
  }

  return spans;
}

// LanguageTool API service
class LanguageToolService {
  constructor() {
    this.cache = new Map();
    // Case-insensitive list (lowercased)
    this.customIgnoreWordsList = [
      'asylee',
      'amerasian',
      'anumber',
      'DED',
      'EOIR',
      'IRCA',
      'NACARA',
      'nonimmigrant',
      'nonconfirmation',
      'PDSO',
      'SEVP',
      'SEVIS',
      'SIJ',
      'VAWA',
    ];
  }

  checkText = async (text) => {
    const originalText = String(text ?? '');
    const cacheKey = JSON.stringify({ t: originalText, w: this.customIgnoreWordsList });

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const formData = new URLSearchParams();
    formData.append('text', originalText);
    formData.append('language', 'en-US');
    formData.append('enabledOnly', 'false');
    formData.append('ignoreWords', this.customIgnoreWordsList.join(','));

    const axios = createAuthenticatedAxios();
    try {
      const response = await axios.post(`${APP_API_ENDPOINT}/spellcheck`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { data } = response; // Axios automatically parses JSON responses
      const result = this.processLanguageToolResponse(data, originalText);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(`LanguageTool API error: ${error}`);
    }
  };

  processLanguageToolResponse(data, originalText) {
    // DEBUG: log raw matches from LanguageTool

    // console.log('[Spellcheck][RAW_MATCHES]', {
    //   originalText,
    //   matches: (data.matches || []).map((m) => ({
    //     offset: m.offset,
    //     length: m.length,
    //     text: originalText.slice(m.offset, m.offset + m.length),
    //     ruleId: m.rule?.id,
    //     issueType: m.rule?.issueType,
    //   })),
    // });

    const issues = (data.matches || []).map((match) => {
      const start = match.offset;
      const end = start + match.length;
      const word = originalText.slice(start, end);
      return {
        offset: start,
        length: match.length,
        word,
        suggestions: (match.replacements || []).map((r) => r.value).slice(0, 5),
        message: match.message,
        issueType: match.rule?.issueType || 'unknown',
        ruleId: match.rule?.id || '',
      };
    });

    const customWordSpans = processIgnoredSpans(originalText, this.customIgnoreWordsList);
    const variableSpans = processIgnoredText(originalText, VARIABLE_START_DELIMITER, VARIABLE_END_DELIMITER);
    const placeholderSpans = processIgnoredText(originalText.toLowerCase(), PLACE_HOLDER_DELIMITER, PLACE_HOLDER_DELIMITER);

    const ignoredSpans = [...customWordSpans, ...variableSpans, ...placeholderSpans];

    const overlapsIgnored = (aStart, aEnd) => ignoredSpans.some(({ start, end }) => aStart < end && aEnd > start);

    return issues.filter((iss) => {
      const aStart = iss.offset;
      const aEnd = iss.offset + iss.length;

      if (overlapsIgnored(aStart, aEnd)) return false;
      if (!iss.word || /^\s+$/.test(iss.word)) return false; // no whitespace
      return true;
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// eslint-disable-next-line react/prop-types
export function SpellCheckPlugin({ AccordionComponent, editorId = 'editor-1' }) {
  const [editor] = useLexicalComposerContext();

  // Local list used only if you still render AccordionComponent from this editor.
  // If you centralized the sidebar subscription, you can ignore/remove this state.
  const [issues, setIssues] = useState([]);

  const [modalState, setModalState] = useState({
    isVisible: false,
    nodeKey: null,
    originalText: '',
    suggestions: [],
    issueType: '',
    elementRef: null,
  });

  const languageToolService = useRef(new LanguageToolService()).current;
  const scheduleId = useRef(null); // for our 1s typing debounce
  const quickDebounceId = useRef(null); // secondary 500ms debounce tied to registerUpdateListener
  const ignoredRef = useRef(new Set()); // track globally ignored items

  // =========================
  // Publish Changes:
  // =========================
  const publishCurrentIssues = useCallback(() => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const nodes = collectSpellCheckNodes(root);
      const list = nodes.map((n) => ({
        nodeKey: n.getKey(),
        originalText: n.getTextContent(),
        issueType: n.getIssueType?.() || 'unknown',
        suggestions: n.getSuggestions?.() || [],
      }));
      setIssues(list);
      publishIssues(editorId, list);
    });
  }, [editor, editorId]);

  // =========================
  // Modal: open on underline ctrl+click or CMD+click
  // =========================
  const handleSpellCheckClick = useCallback(
    (event) => {
      const { target } = event;
      if (target && target.classList.contains('spell-check-error')) {
        // Alt/Ctrl/Cmd click or double-click to open the modal;
        // single-click still just moves the caret.
        const wantsModal = event.altKey || event.metaKey || event.ctrlKey || event.detail >= 2;
        if (!wantsModal) return;

        event.preventDefault();
        event.stopPropagation();

        const nodeKey = target.getAttribute('data-lexical-spell-check');
        if (!nodeKey) return;

        editor.read(() => {
          const node = $getNodeByKey(nodeKey);
          if (node && $isSpellCheckNode(node)) {
            setModalState({
              isVisible: true,
              nodeKey,
              originalText: node.getTextContent(),
              suggestions: node.getSuggestions(),
              issueType: node.getIssueType(),
              elementRef: target,
            });
          }
        });
      }
    },
    [editor]
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isVisible: false,
      nodeKey: null,
      originalText: '',
      suggestions: [],
      elementRef: null,
    }));
  }, []);

  // =========================
  // Modal actions
  // =========================
  const applySuggestion = useCallback(
    (suggestion) => {
      if (!modalState.nodeKey) return;

      editor.update(() => {
        let replaced = false;

        // Method 1: Replace by node key
        try {
          const node = $getNodeByKey(modalState.nodeKey);
          if (node && $isSpellCheckNode(node)) {
            const textNode = $createTextNode(suggestion);
            node.replace(textNode);
            replaced = true;

            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const end = textNode.getTextContentSize();
              textNode.select(end, end);
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Method 1 failed:', err);
        }

        // Method 2: Walk the tree by key
        if (!replaced) {
          try {
            const root = $getRoot();
            let foundNode = null;
            const findNodeByKey = (n) => {
              if (n.getKey && n.getKey() === modalState.nodeKey) return (foundNode = n);
              if ($isElementNode(n)) {
                const children = n.getChildren();
                for (const c of children) if (findNodeByKey(c)) return true;
              }
              return false;
            };
            findNodeByKey(root);
            if (foundNode && $isSpellCheckNode(foundNode)) {
              const textNode = $createTextNode(suggestion);
              foundNode.replace(textNode);
              replaced = true;
              const selection = $getSelection();
              if ($isRangeSelection(selection)) textNode.select();
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Method 2 failed:', err);
          }
        }

        // Method 3: Fallback by matching originalText
        if (!replaced) {
          try {
            const root = $getRoot();
            const findAndReplace = (n) => {
              if ($isSpellCheckNode(n) && n.getTextContent() === modalState.originalText) {
                const textNode = $createTextNode(suggestion);
                n.replace(textNode);
                return true;
              }
              if ($isElementNode(n)) {
                const children = n.getChildren();
                for (const c of children) if (findAndReplace(c)) return true;
              }
              return false;
            };
            replaced = findAndReplace(root);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Method 3 failed:', err);
          }
        }

        if (!replaced) {
          // eslint-disable-next-line no-console
          console.error('SpellCheck: All replacement methods failed');
        }
      });

      closeModal();
      publishCurrentIssues(); // immediately refresh the accordion & header
    },
    [editor, modalState.nodeKey, modalState.originalText, closeModal, publishCurrentIssues]
  );

  const ignoreError = useCallback(() => {
    if (!modalState.nodeKey) return;

    editor.update(() => {
      try {
        const node = $getNodeByKey(modalState.nodeKey);
        if (node && $isSpellCheckNode(node)) {
          const textNode = $createTextNode(node.getTextContent());
          // Record this word/type as ignored *before* replacing
          const word = node.getTextContent().toLowerCase();
          const type = node.getIssueType?.() || modalState.issueType || 'unknown';
          ignoredRef.current.add(`${type}:${word}`);
          node.replace(textNode);

          const selection = $getSelection();
          if ($isRangeSelection(selection)) textNode.select();
        } else {
          // eslint-disable-next-line no-console
          console.warn('Node not found or not a spell check node:', modalState.nodeKey);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Could not ignore spelling error by key:', err);

        // Fallback by walking tree
        try {
          const root = $getRoot();
          let foundNode = null;
          const findNodeByKey = (n) => {
            if (n.getKey && n.getKey() === modalState.nodeKey) return (foundNode = n);
            if ($isElementNode(n)) {
              const children = n.getChildren();
              for (const c of children) if (findNodeByKey(c)) return true;
            }
            return false;
          };
          findNodeByKey(root);
          if (foundNode && $isSpellCheckNode(foundNode)) {
            const textNode = $createTextNode(foundNode.getTextContent());
            foundNode.replace(textNode);

            const selection = $getSelection();
            if ($isRangeSelection(selection)) textNode.select();
          }
        } catch (fallbackErr) {
          // eslint-disable-next-line no-console
          console.error('Fallback ignore also failed:', fallbackErr);
        }
      }
    });

    // clear cached matches so the just-ignored item doesn't immediately reappear from cache on the next check
    languageToolService.clearCache();

    closeModal();
    publishCurrentIssues(); // immediately refresh the accordion & header
  }, [editor, modalState.nodeKey, modalState.issueType, closeModal, publishCurrentIssues, languageToolService]);

  // =========================
  // Highlighting
  // =========================

  const applyHighlightsForNode = useCallback((node, ranges) => {
    const text = node.getTextContent();
    if (!text || !ranges.length) return;

    // Ensure ranges are in order, just in case LanguageTool returns them shuffled.
    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);

    // ---- CARET RESTORE (defensive) ----
    let selection = null;
    let savedOffset = null;

    try {
      selection = $getSelection();
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        if (anchorNode.getKey && anchorNode.getKey() === node.getKey()) {
          // offset within original node text
          savedOffset = selection.anchor.offset;
        }
      }
    } catch (e) {
      // If undo/redo or some transient state makes the selection invalid,
      // skip caret restore instead of crashing with Point.getNode: node not found.
      // eslint-disable-next-line no-console
      console.warn('SpellCheck: selection invalid during highlight, skipping caret restore', e);
    }

    const newNodes = [];
    let caretNode = null;
    let caretOffset = 0;

    let cursor = 0;

    sortedRanges.forEach((range) => {
      const { start, end, suggestions, issueType } = range;

      // 1) Plain text before the error
      if (start > cursor) {
        const beforeText = text.slice(cursor, start);
        if (beforeText) {
          const beforeNode = $createTextNode(beforeText);
          newNodes.push(beforeNode);

          if (savedOffset !== null && savedOffset >= cursor && savedOffset <= start) {
            caretNode = beforeNode;
            caretOffset = savedOffset - cursor;
          }
        }
      }

      // 2) The error span itself (wrapped in SpellCheckNode)
      const errorText = text.slice(start, end);
      if (errorText) {
        const scNode = $createSpellCheckNode(errorText, suggestions || [], issueType || 'unknown');
        newNodes.push(scNode);

        if (savedOffset !== null && savedOffset >= start && savedOffset <= end) {
          caretNode = scNode;
          caretOffset = savedOffset - start;
        }
      }

      cursor = end;
    });

    // 3) Tail text after the last error
    if (cursor < text.length) {
      const afterText = text.slice(cursor);
      if (afterText) {
        const afterNode = $createTextNode(afterText);
        newNodes.push(afterNode);

        if (savedOffset !== null && savedOffset >= cursor && savedOffset <= text.length) {
          caretNode = afterNode;
          caretOffset = savedOffset - cursor;
        }
      }
    }

    if (!newNodes.length) return;

    try {
      // Replace original node with the first new node, then chain the rest after it.
      node.replace(newNodes[0]);
      for (let i = 1; i < newNodes.length; i += 1) {
        newNodes[i - 1].insertAfter(newNodes[i]);
      }

      // Restore caret if we safely captured a selection
      if (caretNode && selection && $isRangeSelection(selection)) {
        try {
          const size = caretNode.getTextContentSize();
          // Clamp the caret offset to [0, size]
          const safeOffset = Math.max(0, Math.min(caretOffset, size));
          caretNode.select(safeOffset, safeOffset);
        } catch (e) {
          // If Lexical/DOM doesn't like this offset, just skip restoring the caret
          // rather than throwing an IndexSizeError.
          // eslint-disable-next-line no-console
          console.warn('SpellCheck: failed to restore caret after highlighting', e);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Could not replace node during highlighting:', err);
    }
  }, []);

  const applySpellCheckHighlights = useCallback(
    (root, errors) => {
      const { segments } = buildFlatTextForSpellcheck(root);

      const nodeToRanges = new Map();

      errors.forEach((err) => {
        const key = `${err.issueType || 'unknown'}:${(err.word || '').toLowerCase()}`;
        if (ignoredRef.current.has(key)) return;

        const errorStart = err.offset;
        const errorEnd = err.offset + err.length;

        const info = segments.find((seg) => errorStart >= seg.startOffset && errorEnd <= seg.endOffset);

        if (!info) {
          // DEBUG: error that couldn't be mapped to a segment
          // console.warn('[Spellcheck][NO_SEGMENT_FOR_ERROR]', {
          //   err,
          //   segments: segments.map((s) => ({
          //     nodeKey: s.node.getKey ? s.node.getKey() : null,
          //     startOffset: s.startOffset,
          //     endOffset: s.endOffset,
          //     text: s.node.getTextContent(),
          //   })),
          // });
          return;
        }

        const relativeStart = errorStart - info.startOffset;
        const relativeEnd = errorEnd - info.startOffset;

        const ranges = nodeToRanges.get(info.node) || [];
        ranges.push({
          start: relativeStart,
          end: relativeEnd,
          suggestions: err.suggestions || [],
          issueType: err.issueType || 'unknown',
        });
        nodeToRanges.set(info.node, ranges);
      });

      nodeToRanges.forEach((ranges, node) => {
        try {
          applyHighlightsForNode(node, ranges);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Could not highlight errors for node:', e);
        }
      });
    },
    [applyHighlightsForNode]
  );

  // =========================
  // Spellcheck scheduling
  // =========================

  const performSpellCheck = useCallback(async () => {
    if (!editor || !editor.isEditable()) {
      publishIssues(editorId, []); // ensure this editor contributes nothing
      return;
    }

    // Capture the specific editorState we’re basing this check on
    const editorState = editor.getEditorState();

    // Build flatText *from that specific state*
    const { flatText } = editorState.read(() => {
      const root = $getRoot();
      return buildFlatTextForSpellcheck(root);
    });

    if (!flatText?.trim()) {
      publishIssues(editorId, []);
      return;
    }

    try {
      // Send the SAME flatText to LanguageTool whose offsets
      // we later map back via buildFlatTextForSpellcheck in applySpellCheckHighlights.
      const errors = await languageToolService.checkText(flatText);

      // If the editor has changed since we started, drop these results (stale)
      if (editor.getEditorState() !== editorState) {
        return;
      }

      editor.update(() => {
        const root = $getRoot();

        if (errors.length > 0) {
          applySpellCheckHighlights(root, errors);
        }

        // Scan current SpellCheckNodes to build a clean list (no duplicates)
        const list = [];
        for (const n of collectSpellCheckNodes(root)) {
          list.push({
            nodeKey: n.getKey(),
            originalText: n.getTextContent(),
            issueType: n.getIssueType?.() || 'unknown',
            suggestions: n.getSuggestions?.() || [],
          });
        }
        setIssues(list);
        publishIssues(editorId, list);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Spell check error:', e);
    }
  }, [editor, editorId, applySpellCheckHighlights, languageToolService]);

  // =========================
  // Effects / listeners
  // =========================

  // Apply ignore coming from the sidebar/accordion bus
  useEffect(
    () =>
      registerApplyHandler(editorId, (nodeKey, suggestion, originalText, issueType, action = 'apply') => {
        if (action === 'ignore') {
          editor.update(
            () => {
              const node = $getNodeByKey(nodeKey);
              if (node && $isSpellCheckNode(node)) {
                const textNode = $createTextNode(node.getTextContent());
                const word = node.getTextContent().toLowerCase();
                const type = issueType || 'unknown';
                ignoredRef.current.add(`${type}:${word}`);
                node.replace(textNode);
              }
            },
            { discrete: true }
          );

          const timeoutDelay = navigator.userAgent.includes('Chrome') ? 50 : 0;
          setTimeout(() => {
            publishCurrentIssues();
            languageToolService.clearCache?.();
          }, timeoutDelay);
          return;
        }

        editor.update(
          () => {
            let applied = false;

            // 1) Fast path: replace by nodeKey
            const node = $getNodeByKey(nodeKey);
            if (node && $isSpellCheckNode(node) && typeof node.replaceWithSuggestion === 'function') {
              const newTextNode = node.replaceWithSuggestion(suggestion);
              const sel = $getSelection();
              if ($isRangeSelection(sel) && newTextNode) {
                newTextNode.select(suggestion.length, suggestion.length);
              }
              applied = true;
            } else if (node && $isTextNode(node)) {
              node.setTextContent(suggestion);
              node.select?.();
              applied = true;
            }

            // 2) Fallback logic
            if (!applied && originalText) {
              const root = $getRoot();
              const tryMatch = (n) => {
                if ($isSpellCheckNode(n) && n.getTextContent() === originalText) {
                  let newNode;
                  if (typeof n.replaceWithSuggestion === 'function') {
                    newNode = n.replaceWithSuggestion(suggestion);
                  } else {
                    newNode = $createTextNode(suggestion);
                    n.replace?.(newNode);
                  }
                  const sel = $getSelection();
                  if ($isRangeSelection(sel) && newNode) {
                    newNode.select(suggestion.length, suggestion.length);
                  }
                  return true;
                }
                if ($isElementNode(n)) {
                  for (const c of n.getChildren()) {
                    if (tryMatch(c)) return true;
                  }
                }
                return false;
              };
              applied = tryMatch(root);
            }
          },
          { discrete: true }
        );

        // Longer timeout for Chrome compatibility
        const timeoutDelay = navigator.userAgent.includes('Chrome') ? 50 : 0;

        setTimeout(() => {
          publishCurrentIssues();
          try {
            languageToolService.clearCache?.();
          } catch (e) {
            /* empty */
          }
        }, timeoutDelay);
      }),
    [editor, editorId, languageToolService, publishCurrentIssues]
  );

  // Typing detection + unwrap-on-edit
  useEffect(() => {
    if (!editor) return;

    let typingTimeout = null;

    document.addEventListener('click', handleSpellCheckClick);

    // Unwrap SpellCheckNodes before any edit so typing/backspace/paste behave normally.
    const rootElem = editor.getRootElement();

    const onBeforeInput = (e) => {
      if (!e) return;

      const type = e.inputType || '';
      if (!type || !type.startsWith('insert')) return;

      editor.update(() => unwrapSpellNodesInSelection());
    };

    if (rootElem) {
      rootElem.addEventListener('beforeinput', onBeforeInput);
    }

    const scheduleCheck = () => {
      if (scheduleId.current) clearTimeout(scheduleId.current);
      scheduleId.current = setTimeout(() => performSpellCheck(), 1000);
    };

    const handleTyping = () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        scheduleCheck(); // run after user stops typing
      }, 1000);
    };

    const remove = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        try {
          editorState.read(() => {
            handleTyping();
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Error in spell check update listener:', err);
        }
      }),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (e) => {
          const isPrintable = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
          const isBackspace = e.key === 'Backspace';
          const isDelete = e.key === 'Delete';
          const isEnter = e.key === 'Enter';

          const editKey = isPrintable || isBackspace || isDelete || isEnter;
          if (!editKey) return false;

          let handled = false;

          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            if (!selection.isCollapsed()) {
              return;
            }

            // Collapsed caret only – this is where you see the “double tap” in Thiyss
            if (selection.isCollapsed()) {
              const { anchor } = selection;
              const node = anchor.getNode();
              const { offset } = anchor;

              // Only special-handle when caret is inside a SpellCheckNode
              if (node instanceof SpellCheckNode && (isBackspace || isDelete)) {
                const text = node.getTextContent();
                const { length } = text;

                // Which character should we remove?
                const indexToRemove = isBackspace ? offset - 1 : offset;

                if (indexToRemove >= 0 && indexToRemove < length) {
                  const newText = text.slice(0, indexToRemove) + text.slice(indexToRemove + 1);
                  const textNode = $createTextNode(newText);

                  node.replace(textNode);

                  // New caret position after deletion
                  const newOffset = isBackspace ? indexToRemove : indexToRemove;
                  const size = textNode.getTextContentSize();
                  const safeOffset = Math.max(0, Math.min(newOffset, size));

                  textNode.select(safeOffset, safeOffset);
                  handled = true;
                  return;
                }

                // If at boundaries (no char to delete), still unwrap for future edits
                unwrapSpellNodesInSelection();
                return;
              }

              // For non-SpellCheckNode, just unwrap (if any) and let Lexical handle
              unwrapSpellNodesInSelection();
              return;
            }

            // Non-collapsed selection: unwrap everything in range
            unwrapSpellNodesInSelection();
          });

          if (handled) {
            // We already deleted the character ourselves
            e.preventDefault();
            return true;
          }

          // Let Lexical proceed with its normal behavior
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    // eslint-disable-next-line consistent-return
    return () => {
      if (scheduleId.current) clearTimeout(scheduleId.current);
      if (quickDebounceId.current) clearTimeout(quickDebounceId.current);
      if (typingTimeout) clearTimeout(typingTimeout);
      document.removeEventListener('click', handleSpellCheckClick);
      if (rootElem) {
        // rootElem.removeEventListener('keydown', onKeyDown);
        rootElem.removeEventListener('beforeinput', onBeforeInput);
      }
      // eslint-disable-next-line no-unused-expressions
      remove && remove();
    };
  }, [editor, handleSpellCheckClick, performSpellCheck]);

  // One initial pass so sidebar (or any subscriber) has data on page load
  useEffect(() => {
    const t = setTimeout(() => performSpellCheck(), 0);
    return () => clearTimeout(t);
  }, [performSpellCheck, editorId]);

  // Secondary quick debounce tied to any editor update
  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        if (quickDebounceId.current) clearTimeout(quickDebounceId.current);
        quickDebounceId.current = setTimeout(() => performSpellCheck(), 500);
      }),
    [editor, performSpellCheck]
  );

  // Create a mock spell check node object for the modal
  const modalSpellCheckNode = modalState.isVisible
    ? {
        getSuggestions: () => modalState.suggestions,
        getTextContent: () => modalState.originalText,
        getIssueType: () => modalState.issueType,
      }
    : null;

  return (
    <>
      <SpellCheckPluginModal
        isVisible={modalState.isVisible}
        onClose={closeModal}
        spellCheckNode={modalSpellCheckNode}
        anchorElement={modalState.elementRef}
        onApplySuggestion={applySuggestion}
        onIgnore={ignoreError}
      />

      {/* Optional: keep this only if exactly ONE editor renders it; otherwise centralize in ScribeEditor */}
      {AccordionComponent && (
        <AccordionComponent issues={issues} spellCheckState={modalState} onApplySuggestion={applySuggestion} onIgnore={ignoreError} />
      )}
    </>
  );
}

function collectSpellCheckNodes(root) {
  const out = [];
  const walk = (n) => {
    if ($isSpellCheckNode(n)) out.push(n);
    if ($isElementNode(n)) {
      let children = [];
      try {
        children = n.getChildren();
      } catch {
        /* empty */
      }
      for (const c of children) walk(c);
    }
  };
  walk(root);
  return out;
}

function unwrapSpellNodesInSelection() {
  let selection;

  // Safely grab selection; if Lexical is in a weird transient state, bail out.
  try {
    selection = $getSelection();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('SpellCheck: unable to get selection during unwrap, aborting', e);
    return;
  }

  if (!$isRangeSelection(selection)) return;

  const { anchor, focus } = selection;

  // Safely resolve anchor/focus nodes (they might point to deleted nodes after undo/redo)
  let anchorNode;
  let focusNode;

  try {
    anchorNode = anchor.getNode();
    focusNode = focus.getNode();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('SpellCheck: selection nodes missing during unwrap (likely undo/redo), aborting', e);
    return;
  }

  const anchorOffset = anchor.offset;
  const focusOffset = focus.offset;

  // Helper: unwrap a single SpellCheckNode and optionally preserve caret
  const unwrapNode = (node, preserveAnchorOffset, preserveFocusOffset) => {
    const textContent = node.getTextContent();
    const textNode = $createTextNode(textContent);

    // Replace the node (this keeps it in the same place in the tree)
    node.replace(textNode);

    // If we want to keep the caret(s) inside this node, reselect on the new text node
    if (preserveAnchorOffset || preserveFocusOffset) {
      const size = textNode.getTextContentSize();

      const safeAnchor = preserveAnchorOffset ? Math.max(0, Math.min(anchorOffset, size)) : 0;

      const safeFocus = preserveFocusOffset ? Math.max(0, Math.min(focusOffset, size)) : safeAnchor;

      try {
        textNode.select(safeAnchor, safeFocus);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('SpellCheck: failed to restore selection after unwrap', e);
      }
    }

    return textNode;
  };

  // CASE 1: collapsed selection (single caret)
  if (selection.isCollapsed()) {
    if (anchorNode instanceof SpellCheckNode) {
      unwrapNode(anchorNode, true, false);
    }
    return;
  }

  // CASE 2: range selection – unwrap all SpellCheckNodes in the range
  let nodes;
  try {
    nodes = selection.getNodes();
  } catch (e) {
    // This is *exactly* where "Point.getNode: node not found" can come from.
    // If selection is based on a stale nodeKey (e.g. right after undo),
    // just bail out instead of crashing the editor.
    // eslint-disable-next-line no-console
    console.warn('SpellCheck: selection.getNodes failed during unwrap (likely undo/redo), aborting', e);
    return;
  }

  nodes.forEach((n) => {
    if (n instanceof SpellCheckNode) {
      const isAnchorNode = n === anchorNode;
      const isFocusNode = n === focusNode;

      unwrapNode(
        n,
        isAnchorNode, // preserve anchor offset if caret was inside this node
        isFocusNode // preserve focus offset if caret was inside this node
      );
    }
  });
}

// Hook version for easier integration (unchanged)
export function useSpellCheckPlugin() {
  return SpellCheckPlugin;
}
