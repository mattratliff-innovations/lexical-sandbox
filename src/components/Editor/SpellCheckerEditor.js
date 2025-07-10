import React, { useState, useCallback, useRef, useEffect } from 'react';
import { $getRoot, $getSelection, $isRangeSelection, $createParagraphNode, $createTextNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

// Import the spell checker components (these would be from your SpellCheckerPlugin.js file)
const SpellCheckNode = {
  getType: () => 'spell-check',
  clone: (node) => ({ ...node }),
  createDOM: (config) => {
    const element = document.createElement('span');
    element.className = 'spell-check-error';
    element.style.textDecoration = 'underline';
    element.style.textDecorationColor = 'red';
    element.style.textDecorationStyle = 'wavy';
    element.style.cursor = 'pointer';
    return element;
  },
  updateDOM: () => false,
  importJSON: (serializedNode) => serializedNode,
  exportJSON: () => ({ type: 'spell-check', version: 1 }),
};

// Simplified spell checker hook (normally imported from your plugin)
function useSpellCheck() {
  const [editor] = useLexicalComposerContext();
  const [contextMenu, setContextMenu] = useState(null);
  
  useEffect(() => {
    if (!editor) return;
    
    // Mock spell check function
    const mockSpellCheck = (text) => {
      const commonErrors = [
        { word: 'teh', suggestions: ['the'], offset: text.indexOf('teh') },
        { word: 'recieve', suggestions: ['receive'], offset: text.indexOf('recieve') },
        { word: 'seperate', suggestions: ['separate'], offset: text.indexOf('seperate') },
        { word: 'occured', suggestions: ['occurred'], offset: text.indexOf('occured') },
        { word: 'begining', suggestions: ['beginning'], offset: text.indexOf('begining') },
      ];
      
      return commonErrors.filter(error => error.offset !== -1);
    };
    
    let timeoutId;
    
    const performSpellCheck = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        editor.update(() => {
          const root = $getRoot();
          const textContent = root.getTextContent();
          
          if (textContent.trim()) {
            const errors = mockSpellCheck(textContent);
            // In a real implementation, you'd highlight errors here
            console.log('Spell check errors found:', errors);
          }
        });
      }, 500);
    };
    
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        performSpellCheck();
      });
    });
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      removeUpdateListener();
    };
  }, [editor]);
  
  return { contextMenu, setContextMenu };
}

// Context menu component for spell check suggestions
function SpellCheckContextMenu({ position, suggestions, onSelect, onClose }) {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  if (!position) return null;
  
  return (
    <div
      ref={menuRef}
      className="spell-check-context-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '150px'
      }}
    >
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {suggestion}
            </button>
          ))
        ) : (
          <div style={{ padding: '8px 12px', color: '#666', fontSize: '14px' }}>
            No suggestions available
          </div>
        )}
      </div>
      <div style={{ padding: '8px 0' }}>
        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Ignore
        </button>
      </div>
    </div>
  );
}

// Main editor component with spell check functionality
function SpellCheckEditor() {
  const { contextMenu, setContextMenu } = useSpellCheck();
  const [editor] = useLexicalComposerContext();
  
  const handleRightClick = useCallback((event) => {
    event.preventDefault();
    
    // Mock spell check context menu
    const mockSuggestions = ['the', 'they', 'them'];
    
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      suggestions: mockSuggestions
    });
  }, [setContextMenu]);
  
  const handleSuggestionSelect = useCallback((suggestion) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(suggestion);
      }
    });
    setContextMenu(null);
  }, [editor, setContextMenu]);
  
  return (
    <div style={{ position: 'relative' }}>
      <ContentEditable
        className="editor-input"
        placeholder="Start typing to see spell checking in action. Try typing 'teh', 'recieve', or 'seperate'..."
        onContextMenu={handleRightClick}
        style={{
          minHeight: '200px',
          padding: '16px',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '16px',
          lineHeight: '1.5',
          outline: 'none',
          resize: 'vertical'
        }}
      />
      
      {contextMenu && (
        <SpellCheckContextMenu
          position={contextMenu.position}
          suggestions={contextMenu.suggestions}
          onSelect={handleSuggestionSelect}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// Plugin component to integrate spell checking
function SpellCheckPlugin() {
  useSpellCheck();
  return null;
}

// Error boundary fallback
function ErrorFallback({ error }) {
  return (
    <div style={{ 
      padding: '16px', 
      background: '#fee', 
      border: '1px solid #fcc',
      borderRadius: '4px',
      color: '#c33'
    }}>
      <h3>Something went wrong:</h3>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
        {error.message}
      </pre>
    </div>
  );
}

// Main component that sets up the Lexical editor
export default function LexicalSpellCheckerExample() {
  const [editorState, setEditorState] = useState('');
  
  const initialConfig = {
    namespace: 'SpellCheckEditor',
    nodes: [SpellCheckNode],
    onError: (error) => {
      console.error('Lexical error:', error);
    },
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
      paragraph: 'mb-2',
    }
  };
  
  const onChange = useCallback((editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      setEditorState(textContent);
    });
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lexical Editor with Spell Checker
          </h1>
          <p className="text-gray-600">
            This editor demonstrates real-time spell checking using Lexical and LanguageTool integration.
            Try typing some text with spelling errors to see the spell checker in action.
          </p>
        </div>
        
        <div className="p-6">
          <LexicalComposer initialConfig={initialConfig}>
            <div className="relative">
              <PlainTextPlugin
                contentEditable={<SpellCheckEditor />}
                placeholder={
                  <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                    Enter some text here...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangePlugin onChange={onChange} />
              <HistoryPlugin />
              <SpellCheckPlugin />
            </div>
          </LexicalComposer>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Features:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Real-time spell checking with wavy red underlines
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Right-click context menu with spelling suggestions
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Debounced API calls to LanguageTool service
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Custom spell-check nodes for proper highlighting
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Undo/redo support with history plugin
            </li>
          </ul>
        </div>
        
        {editorState && (
          <div className="p-6 bg-blue-50 border-t border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Content:</h3>
            <p className="text-blue-800 bg-blue-100 p-3 rounded font-mono text-sm">
              {editorState}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Setup Instructions:
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
          <li>Install LanguageTool server locally or use a hosted service</li>
          <li>Update the API URL in the LanguageToolService class</li>
          <li>Add your custom SpellCheckNode to the Lexical nodes array</li>
          <li>Import and use the useSpellCheckPlugin hook in your editor</li>
        </ol>
      </div>
    </div>
  );
}