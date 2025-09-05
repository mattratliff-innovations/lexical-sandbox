/* eslint-disable no-restricted-syntax */
/* eslint-disable no-return-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable no-shadow */

/* eslint-disable class-methods-use-this */
// SpellCheckPlugin.jsx

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

import { publishIssues } from './SpellCheckBus';
import { $createSpellCheckNode, $isSpellCheckNode, SpellCheckNode } from './SpellCheckNode';
import SpellCheckPluginModal from './SpellCheckPluginModal';

// const $isSpellCheckNode = (node) => node instanceof SpellCheckNode;

// Helper to check if node is an ElementNode
export function $isElementNode(node) {
  return node && typeof node.getChildren === 'function';
}

// LanguageTool API service (unchanged from your version)
class LanguageToolService {
  constructor() {
    // replace this URL with the hosted URL of the spellchecker
    this.apiUrl = 'http://localhost:8010/v2/check';
    this.cache = new Map();
  }

  async checkText(text) {
    const cacheKey = text.trim().toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const formData = new URLSearchParams();
      formData.append('text', text);
      formData.append('language', 'en-US');
      formData.append('enabledOnly', 'false');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = this.processLanguageToolResponse(data);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(`LanguageTool API error: ${error}`);
    }
  }

  processLanguageToolResponse(data) {
    return data.matches.map((match) => ({
      offset: match.offset,
      length: match.length,
      word: match.context.text.substring(match.offset, match.offset + match.length),
      suggestions: match.replacements.map((r) => r.value).slice(0, 5),
      message: match.message,
      issueType: match.rule.issueType || 'unknown',
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

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
    position: { x: 0, y: 0 },
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
        // Alt/Ctrl/Cmd click or double-click to open the modal free up single clicks to place caret so users can edit directly.
        const wantsModal = event.altKey || event.metaKey || event.ctrlKey || event.detail >= 2;
        if (!wantsModal) return;
        event.preventDefault();
        event.stopPropagation();

        const nodeKey = target.getAttribute('data-lexical-spell-check');
        if (!nodeKey) return;

        editor.read(() => {
          try {
            const node = $getNodeByKey(nodeKey);
            if (node && $isSpellCheckNode(node)) {
              const rect = target.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

              setModalState({
                isVisible: true,
                nodeKey,
                originalText: node.getTextContent(),
                suggestions: node.getSuggestions(),
                issueType: node.getIssueType(),
                elementRef: target,
                position: {
                  x: rect.left + scrollLeft + rect.width / 2,
                  y: rect.bottom + scrollTop + 5,
                },
              });
            } else {
              console.warn('SpellCheck: Node not found or not a spell check node:', nodeKey);
            }
          } catch (err) {
            console.warn('Error reading spell check node:', err);
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
            console.warn('Method 3 failed:', err);
          }
        }

        if (!replaced) console.error('SpellCheck: All replacement methods failed');
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
          console.warn('Node not found or not a spell check node:', modalState.nodeKey);
        }
      } catch (err) {
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
          console.error('Fallback ignore also failed:', fallbackErr);
        }
      }
    });

    // clear cached matches so the just-ignored item doesn't immediately reappear from cache on the next check
    languageToolService.clearCache();

    closeModal();
    publishCurrentIssues(); // immediately refresh the accordion & header
  }, [editor, modalState.nodeKey, closeModal, publishCurrentIssues]);

  // =========================
  // Highlighting
  // =========================
  const highlightErrorInNode = useCallback((node, start, end, suggestions, issueType) => {
    const text = node.getTextContent();
    const beforeText = text.substring(0, start);
    const errorText = text.substring(start, end);
    const afterText = text.substring(end);

    // 1) Save caret (collapsed) if it was in this node
    let savedOffset = null;
    const selection = $getSelection();
    if ($isRangeSelection(selection) && selection.isCollapsed()) {
      const anchorNode = selection.anchor.getNode();
      if (anchorNode.getKey && anchorNode.getKey() === node.getKey()) {
        savedOffset = selection.anchor.offset; // offset within *original* node
      }
    }

    const nodes = [];
    if (beforeText) nodes.push($createTextNode(beforeText));

    const created = $createSpellCheckNode(errorText, suggestions, issueType || 'unknown');
    nodes.push(created);

    if (afterText) nodes.push($createTextNode(afterText));

    if (nodes.length > 0) {
      try {
        node.replace(nodes[0]);
        for (let i = 1; i < nodes.length; i++) nodes[i - 1].insertAfter(nodes[i]);
        // 2) Restore caret to the equivalent logical position
        if (savedOffset !== null) {
          const beforeLen = beforeText.length;
          const errLen = errorText.length;
          if (savedOffset <= beforeLen) {
            // Caret was in the "before" slice
            nodes[0].select(savedOffset, savedOffset);
          } else if (savedOffset <= beforeLen + errLen) {
            // Caret was inside the underlined word
            const off = savedOffset - beforeLen;
            created.select(off, off); // keep caret at same place inside "catt"
          } else {
            // Caret was after the underlined word
            const off = savedOffset - beforeLen - errLen;
            const afterNode = afterText ? nodes[nodes.length - 1] : created;
            const end = Math.min(off, afterNode.getTextContentSize());
            afterNode.select(end, end);
          }
        }
      } catch (err) {
        console.warn('Could not replace node during highlighting:', err);
      }
    }
    return created;
  }, []);

  const applySpellCheckHighlights = useCallback(
    (root, errors) => {
      // IMPORTANT: we do NOT globally clear old SpellCheckNodes here.
      // We only apply highlights within plain TextNodes, so existing highlighted spans remain stable (good for the modal).

      const allTextNodes = [];
      let currentOffset = 0;

      const collectTextNodes = (n) => {
        if ($isTextNode(n) && !$isSpellCheckNode(n)) {
          const t = n.getTextContent();
          allTextNodes.push({
            node: n,
            startOffset: currentOffset,
            endOffset: currentOffset + t.length,
          });
          currentOffset += t.length;
        } else if ($isSpellCheckNode(n)) {
          // Count its text toward offsets so future ranges line up, but don't re-highlight inside it.
          currentOffset += n.getTextContent().length;
        }

        if ($isElementNode(n)) {
          let children = [];
          try {
            children = n.getChildren();
          } catch (e) {
            console.warn('Could not get children for node:', e);
          }
          children.forEach(collectTextNodes);
        }
      };

      collectTextNodes(root);

      errors.forEach((err) => {
        const k = `${err.issueType || 'unknown'}:${(err.word || '').toLowerCase()}`;
        if (ignoredRef.current.has(k)) return; // don't re-underline ignored items

        const errorStart = err.offset;
        const errorEnd = err.offset + err.length;

        allTextNodes.find((info) => {
          if (errorStart >= info.startOffset && errorEnd <= info.endOffset) {
            const relativeStart = errorStart - info.startOffset;
            const relativeEnd = errorEnd - info.startOffset;

            try {
              // Only highlight if the targeted slice isn't already a SpellCheckNode
              // (Since we only collected plain TextNodes, this is naturally true.)
              highlightErrorInNode(info.node, relativeStart, relativeEnd, err.suggestions, err.issueType);
            } catch (e) {
              console.warn('Could not highlight error in node:', e);
            }
            return true;
          }
          return false;
        });
      });
    },
    [highlightErrorInNode]
  );

  // =========================
  // Spellcheck scheduling
  // =========================
  const performSpellCheck = useCallback(async () => {
    if (!editor || !editor.isEditable()) {
      publishIssues(editorId, []); // ensure this editor contributes nothing
      return;
    }

    const textContent = editor.getEditorState().read(() => $getRoot().getTextContent());
    if (!textContent?.trim()) {
      publishIssues(editorId, []);
      return;
    }

    try {
      const errors = await languageToolService.checkText(textContent);

      editor.update(() => {
        const root = $getRoot();

        // Apply new highlights into plain text nodes (existing highlights remain)
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
      console.error('Spell check error:', e);
    }
  }, [editor, editorId, applySpellCheckHighlights, languageToolService]);

  // =========================
  // Effects / listeners
  // =========================
  useEffect(() => {
    if (!editor) return;

    let isTyping = false;
    let typingTimeout = null;

    document.addEventListener('click', handleSpellCheckClick);

    // Unwrap SpellCheckNodes before any edit so typing/backspace/paste behave normally.
    const rootElem = editor.getRootElement();
    const onKeyDown = (e) => {
      const printable = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
      const editKey = printable || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter';
      if (!editKey) return;
      editor.update(() => unwrapSpellNodesInSelection());
      // do not preventDefault — let Lexical apply the edit
    };
    const onBeforeInput = (e) => {
      // Covers paste, IME, etc. (e.inputType examples: 'insertFromPaste', 'insertText', 'deleteContentBackward')
      if (!e) return;
      editor.update(() => unwrapSpellNodesInSelection());
    };

    if (rootElem) {
      rootElem.addEventListener('keydown', onKeyDown);
      rootElem.addEventListener('beforeinput', onBeforeInput);
    }

    const scheduleCheck = () => {
      if (scheduleId.current) clearTimeout(scheduleId.current);
      scheduleId.current = setTimeout(() => performSpellCheck(), 1000);
    };

    const handleTyping = () => {
      isTyping = true;
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
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
          console.warn('Error in spell check update listener:', err);
        }
      }),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (e) => {
          // If user is typing a printable char, Backspace, Delete, or Enter,
          // unwrap selected SpellCheckNodes first so editing works naturally.
          const printable = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
          const editKey = printable || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter';
          if (!editKey) return false;

          editor.update(() => unwrapSpellNodesInSelection());
          return false; // let Lexical continue with default editing behavior
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
        rootElem.removeEventListener('keydown', onKeyDown);
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

  // Secondary quick debounce tied to any editor update (kept from your version)
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
        position={modalState.position}
        onApplySuggestion={applySuggestion}
        onIgnore={ignoreError}
        errorType={modalState.errorType}
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
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const nodes = selection.getNodes();
  nodes.forEach((n) => {
    if (n instanceof SpellCheckNode) {
      const textNode = $createTextNode(n.getTextContent());
      n.replace(textNode);
    }
  });
}

// Hook version for easier integration (unchanged)
export function useSpellCheckPlugin() {
  return SpellCheckPlugin;
}
