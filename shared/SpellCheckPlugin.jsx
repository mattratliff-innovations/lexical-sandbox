/* eslint-disable no-use-before-define */
/* eslint-disable no-shadow */
/* eslint-disable object-shorthand */
/* eslint-disable class-methods-use-this */
// SpellCheckPlugin.js with JWT Authentication
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback } from 'react';
import SpellCheckPluginModal from './SpellCheckPluginModal';
import { SpellCheckNode, $createSpellCheckNode } from './SpellCheckNode';

export function $isSpellCheckNode(node) {
  return node instanceof SpellCheckNode;
}

// Helper to check if node is an ElementNode
export function $isElementNode(node) {
  return node && typeof node.getChildren === 'function';
}

// Enhanced LanguageTool API service with JWT authentication
class LanguageToolService {
  constructor() {
    // Use your application's backend endpoint instead of direct LanguageTool
    this.apiUrl = '/api/spellcheck'; // Your backend endpoint
    this.cache = new Map();
    this.authToken = null;
    this.tokenExpiry = null;
  }

  // Get JWT token from your application's auth system
  getAuthToken() {
    // Option 1: Get from localStorage/sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Option 2: Get from a context/hook (uncomment if using React context)
    // const { token } = useAuth(); // Your auth hook
    
    // Option 3: Get from cookies
    // const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
    
    return token;
  }

  // Check if token is valid and not expired
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      // Decode JWT payload (basic check - you might want more robust validation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (with 30 second buffer)
      return payload.exp && payload.exp > (currentTime + 30);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Refresh token if needed
  async refreshTokenIfNeeded() {
    const currentToken = this.getAuthToken();
    
    if (!this.isTokenValid(currentToken)) {
      try {
        // Call your refresh endpoint
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Include cookies for refresh token
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Store new token
          localStorage.setItem('authToken', data.token);
          // Or dispatch to your auth context
          // updateAuthToken(data.token);
          return data.token;
        } else {
          // Redirect to login or handle authentication failure
          this.handleAuthFailure();
          return null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.handleAuthFailure();
        return null;
      }
    }
    
    return currentToken;
  }

  // Handle authentication failure
  handleAuthFailure() {
    // Clear stored tokens
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    
    // Redirect to login or show login modal
    // window.location.href = '/login';
    // Or dispatch to your auth system
    // logout();
    
    console.error('Authentication failed - spell check disabled');
  }

  async checkText(text) {
    const cacheKey = text.trim().toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Get valid token
      const token = await this.refreshTokenIfNeeded();
      if (!token) {
        console.warn('No valid authentication token - spell check disabled');
        return [];
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include', // Include cookies if needed
        body: JSON.stringify({
          text,
          language: 'en-US',
          enabledOnly: false,
        }),
      });

      if (response.status === 401) {
        // Token expired or invalid
        console.warn('Authentication failed - attempting token refresh');
        this.handleAuthFailure();
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = this.processLanguageToolResponse(data);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Spell check API error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleAuthFailure();
      }
      
      return [];
    }
  }

  processLanguageToolResponse(data) {
    // Handle both direct LanguageTool response and your backend wrapper
    const matches = data.matches || data.errors || [];
    
    return matches.map((match) => ({
      offset: match.offset,
      length: match.length,
      word: match.context?.text?.substring(match.offset, match.offset + match.length) || match.word,
      suggestions: (match.replacements || match.suggestions || [])
        .map((r) => r.value || r)
        .slice(0, 5),
      message: match.message || 'Possible spelling error',
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

export function SpellCheckPlugin() {
  const [editor] = useLexicalComposerContext();
  const [modalState, setModalState] = useState({
    isVisible: false,
    nodeKey: null,
    originalText: '',
    suggestions: [],
    position: { x: 0, y: 0 },
    elementRef: null,
  });

  const languageToolService = new LanguageToolService();

  // Handle clicks on spell check errors
  const handleSpellCheckClick = useCallback(
    (event) => {
      const { target } = event;
      if (target && target.classList.contains('spell-check-error')) {
        event.preventDefault();
        event.stopPropagation();

        const nodeKey = target.getAttribute('data-lexical-spell-check');
        if (nodeKey) {
          editor.read(() => {
            try {
              const node = $getNodeByKey(nodeKey);
              if (node && $isSpellCheckNode(node)) {
                const rect = target.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                setModalState({
                  isVisible: true,
                  nodeKey: nodeKey,
                  originalText: node.getTextContent(),
                  suggestions: node.getSuggestions(),
                  elementRef: target,
                  position: {
                    x: rect.left + scrollLeft + rect.width / 2,
                    y: rect.bottom + scrollTop + 5,
                  },
                });
              } else {
                console.warn('SpellCheck: Node not found or not a spell check node:', nodeKey);
              }
            } catch (error) {
              console.warn('Error reading spell check node:', error);
            }
          });
        } else {
          console.warn('SpellCheck: No node key found on clicked element');
        }
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

  // Handle suggestion application
  const applySuggestion = useCallback(
    (suggestion) => {
      if (!modalState.nodeKey) return;

      editor.update(() => {
        let replaced = false;

        // Method 1: Try to find by node key
        try {
          const node = $getNodeByKey(modalState.nodeKey);

          if (node && $isSpellCheckNode(node)) {
            const textNode = $createTextNode(suggestion);
            node.replace(textNode);
            replaced = true;

            // Force a re-render by selecting the new node
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              textNode.select();
            }
          }
        } catch (error) {
          console.warn('Method 1 failed:', error);
        }

        // Method 2: Find by traversing the tree if Method 1 failed
        if (!replaced) {
          try {
            const root = $getRoot();
            let foundNode = null;

            const findNodeByKey = (node) => {
              if (node.getKey() === modalState.nodeKey) {
                foundNode = node;
                return true;
              }
              if ($isElementNode(node)) {
                const children = node.getChildren();
                return children.some((child) => findNodeByKey(child));
              }
              return false;
            };

            if (findNodeByKey(root) && foundNode && $isSpellCheckNode(foundNode)) {
              const textNode = $createTextNode(suggestion);
              foundNode.replace(textNode);
              replaced = true;

              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                textNode.select();
              }
            }
          } catch (error) {
            console.warn('Method 2 failed:', error);
          }
        }

        // Method 3: Find by text content matching if previous methods failed
        if (!replaced) {
          try {
            const root = $getRoot();

            const findAndReplaceByText = (node) => {
              if ($isSpellCheckNode(node) && node.getTextContent() === modalState.originalText) {
                const textNode = $createTextNode(suggestion);
                node.replace(textNode);
                return true;
              }
              if ($isElementNode(node)) {
                const children = node.getChildren();
                return children.some((child) => findAndReplaceByText(child));
              }
              return false;
            };

            replaced = findAndReplaceByText(root);
          } catch (error) {
            console.warn('Method 3 failed:', error);
          }
        }

        if (!replaced) {
          console.error('SpellCheck: All replacement methods failed');
        }
      });
      closeModal();
    },
    [editor, modalState.nodeKey, modalState.originalText, closeModal]
  );

  // Handle ignore
  const ignoreError = useCallback(() => {
    if (!modalState.nodeKey) return;

    editor.update(() => {
      try {
        const node = $getNodeByKey(modalState.nodeKey);
        if (node && $isSpellCheckNode(node)) {
          const textNode = $createTextNode(node.getTextContent());
          node.replace(textNode);

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            textNode.select();
          }
        } else {
          console.warn('Node not found or not a spell check node:', modalState.nodeKey);
        }
      } catch (error) {
        console.warn('Could not ignore spelling error:', error);

        try {
          const root = $getRoot();
          let foundNode = null;

          const findNodeByKey = (node) => {
            if (node.getKey() === modalState.nodeKey) {
              foundNode = node;
              return true;
            }
            if ($isElementNode(node)) {
              const children = node.getChildren();
              return children.some((child) => findNodeByKey(child));
            }
            return false;
          };

          if (findNodeByKey(root) && foundNode && $isSpellCheckNode(foundNode)) {
            const textNode = $createTextNode(foundNode.getTextContent());
            foundNode.replace(textNode);

            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              textNode.select();
            }
          }
        } catch (fallbackError) {
          console.error('Fallback ignore also failed:', fallbackError);
        }
      }
    });
    closeModal();
  }, [editor, modalState.nodeKey, closeModal]);

  useEffect(() => {
    if (!editor) return;

    let timeoutId = null;
    let isTyping = false;
    let typingTimeout = null;

    // Add global click listener for spell check errors
    document.addEventListener('click', handleSpellCheckClick);

    const performSpellCheck = async () => {
      if (!editor.isEditable()) return;

      editor.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const root = $getRoot();
        if (!root) return;

        const textContent = root.getTextContent();
        if (!textContent.trim()) return;

        // Only skip if user is actively typing (within last 500ms)
        if (isTyping) {
          return;
        }

        // Debounce spell checking
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            const errors = await languageToolService.checkText(textContent);

            editor.update(() => {
              const root = $getRoot();

              // First, convert all SpellCheckNodes back to TextNodes
              const nodesToReplace = [];

              const collectSpellCheckNodes = (node) => {
                if ($isSpellCheckNode(node)) {
                  nodesToReplace.push({
                    node,
                    replacement: $createTextNode(node.getTextContent()),
                  });
                }

                if ($isElementNode(node)) {
                  try {
                    const children = node.getChildren();
                    children.forEach(collectSpellCheckNodes);
                  } catch (error) {
                    console.warn('Could not get children for node:', error);
                  }
                }
              };

              collectSpellCheckNodes(root);

              // Replace spell check nodes with regular text nodes
              nodesToReplace.forEach(({ node, replacement }) => {
                try {
                  node.replace(replacement);
                } catch (error) {
                  console.warn('Could not replace spell check node:', error);
                }
              });

              // Now apply new spell check highlights
              if (errors.length > 0) {
                applySpellCheckHighlights(root, errors);
              }
            });
          } catch (error) {
            console.error('Spell check error:', error);
          }
        }, 1000);
      });
    };

    const handleTyping = () => {
      isTyping = true;

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      typingTimeout = setTimeout(() => {
        isTyping = false;
        performSpellCheck();
      }, 1000);
    };

    const applySpellCheckHighlights = (root, errors) => {
      const allTextNodes = [];
      let currentOffset = 0;

      const collectTextNodes = (node) => {
        if ($isTextNode(node) && !$isSpellCheckNode(node)) {
          const text = node.getTextContent();
          allTextNodes.push({
            node,
            text,
            startOffset: currentOffset,
            endOffset: currentOffset + text.length,
          });
          currentOffset += text.length;
        }

        if ($isElementNode(node)) {
          try {
            const children = node.getChildren();
            children.forEach(collectTextNodes);
          } catch (error) {
            console.warn('Could not get children for node:', error);
          }
        }
      };

      collectTextNodes(root);

      // Apply highlights for each error
      errors.forEach((error) => {
        const errorStart = error.offset;
        const errorEnd = error.offset + error.length;

        allTextNodes.find((textNodeInfo) => {
          if (errorStart >= textNodeInfo.startOffset && errorEnd <= textNodeInfo.endOffset) {
            const relativeStart = errorStart - textNodeInfo.startOffset;
            const relativeEnd = errorEnd - textNodeInfo.startOffset;

            try {
              highlightErrorInNode(textNodeInfo.node, relativeStart, relativeEnd, error.suggestions);
            } catch (error) {
              console.warn('Could not highlight error in node:', error);
            }
            return true;
          }
          return false;
        });
      });
    };

    const highlightErrorInNode = (node, start, end, suggestions) => {
      const text = node.getTextContent();
      const beforeText = text.substring(0, start);
      const errorText = text.substring(start, end);
      const afterText = text.substring(end);

      const nodes = [];

      if (beforeText) {
        nodes.push($createTextNode(beforeText));
      }

      nodes.push($createSpellCheckNode(errorText, suggestions));

      if (afterText) {
        nodes.push($createTextNode(afterText));
      }

      if (nodes.length > 0) {
        try {
          node.replace(nodes[0]);
          for (let i = 1; i < nodes.length; i++) {
            nodes[i - 1].insertAfter(nodes[i]);
          }
        } catch (error) {
          console.warn('Could not replace node during highlighting:', error);
        }
      }
    };

    // Register listeners with typing detection
    const removeListeners = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        try {
          editorState.read(() => {
            handleTyping();
          });
        } catch (error) {
          console.warn('Error in spell check update listener:', error);
        }
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          try {
            if (!isTyping) {
              performSpellCheck();
            }
          } catch (error) {
            console.warn('Error in spell check selection change:', error);
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    return () => {
      [timeoutId, typingTimeout].forEach((timeout) => timeout && clearTimeout(timeout));
      document.removeEventListener('click', handleSpellCheckClick);
      removeListeners();
    };
  }, [editor, handleSpellCheckClick]);

  // Create a mock spell check node object for the modal
  const modalSpellCheckNode = modalState.isVisible
    ? {
        getSuggestions: () => modalState.suggestions,
        getTextContent: () => modalState.originalText,
      }
    : null;

  return (
    <SpellCheckPluginModal
      isVisible={modalState.isVisible}
      onClose={closeModal}
      spellCheckNode={modalSpellCheckNode}
      position={modalState.position}
      onApplySuggestion={applySuggestion}
      onIgnore={ignoreError}
    />
  );
}

// Hook version for easier integration
export function useSpellCheckPlugin() {
  return SpellCheckPlugin;
}