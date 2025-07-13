// src/components/Editor/Editor.js
import React, {
    useState, useCallback
  } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import './Editor.css';
import { editorConfig } from './plugins/lexicalUtil';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode } from '@lexical/list';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { SpellCheckPlugin, SpellCheckNode } from './plugins/SpellCheckPlugin';

function Editor({
    toolbar = { toolList: '' },
    id,
    debug = false,
    onChange = undefined,
    initialValue = '',
    editorRefAssignmentFunction = undefined,
    onBlurOutsideOfEditor = undefined,
    customTools = [],
    lexicalPlugins = [],
    editable = true,
    ariaLabel = '',
    enableSpellCheck = true, // New prop to enable/disable spell checking
}) {

    const [editorState, setEditorState] = useState({
        isToolbarActive: false,
        isEditorActive: false,
        floatingAnchorElem: null,
        canUndo: false,
        canRedo: false,
      });

      const handleUndo = useCallback((canUndo) => {
        setEditorState((prev) => ({ ...prev, canUndo }));
      }, []);
    
      const handleRedo = useCallback((canRedo) => {
        setEditorState((prev) => ({ ...prev, canRedo }));
      }, []);

      // Enhanced editor config to include SpellCheckNode
      const enhancedEditorConfig = {
        ...editorConfig,
        nodes: [
          ...(editorConfig.nodes || []),
          SpellCheckNode, // Add SpellCheckNode to the editor configuration
          ListItemNode,
          TableNode,
          TableRowNode,
          TableCellNode,
        ],
        onError: (error) => {
          console.error('Lexical Editor Error:', error);
          if (debug) {
            throw error;
          }
        }
      };

  return (
    <LexicalComposer initialConfig={enhancedEditorConfig}>
      <div className="editor-container">
        {editorRefAssignmentFunction && (
          <EditorRefPlugin editorRef={editorRefAssignmentFunction}/>
        )}
        <ToolbarPlugin
            id={`lexical-toolbar-${id}`}
            toolList={toolbar.toolList}
            showToolbar={editorState.isToolbarActive}
            isCanUndo={handleUndo}
            isCanRedo={handleRedo}
            editorId={id}
            customTools={customTools}
            tabIndex="0"
          />

        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Enter some text...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <TablePlugin />
          <ListPlugin />
          
          {/* Conditionally render SpellCheckPlugin */}
          {enableSpellCheck && <SpellCheckPlugin />}
          
          {/* Render any additional custom plugins */}
          {lexicalPlugins.map((PluginComponent, index) => (
            <PluginComponent key={index} />
          ))}
        </div>
      </div>
    </LexicalComposer>
  );
}

export default Editor;