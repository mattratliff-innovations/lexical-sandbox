// // src/components/Editor/Editor.js
// import React, {
//     useState, useCallback
//   } from 'react';
// import { LexicalComposer } from '@lexical/react/LexicalComposer';
// import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
// import { ContentEditable } from '@lexical/react/LexicalContentEditable';
// import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
// import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
// import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
// // import TablePlugin from './plugins/TablePlugin';
// import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
// import ToolbarPlugin from './plugins/ToolbarPlugin';
// import theme from './themes/EditorTheme';
// import './Editor.css';
// import { editorConfig } from './plugins/lexicalUtil';
// import { ListPlugin } from '@lexical/react/LexicalListPlugin';
// import { ListItemNode } from '@lexical/list';
// import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
// import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';

// function Editor({
//     toolbar = { tooList: '' },
//     id,
//     debug = false,
//     onChange = undefined,
//     initialValue = '',
//     editorRefAssignmentFunction = undefined,
//     onBlurOutsideOfEditor = undefined,
//     customTools = [],
//     lexicalPlugins = [],
//     editable = true,
//     ariaLabel = '',
// }) {

//     const [editorState, setEditorState] = useState({
//         isToolbarActive: false,
//         isEditorActive: false,
//         floatingAnchorElem: null,
//         canUndo: false,
//         canRedo: false,
//       });

//       const handleUndo = useCallback((canUndo) => {
//         setEditorState((prev) => ({ ...prev, canUndo }));
//       }, []);
    
//       const handleRedo = useCallback((canRedo) => {
//         setEditorState((prev) => ({ ...prev, canRedo }));
//       }, []);

//   return (
//     <LexicalComposer initialConfig={{ ...editorConfig }}>
//       <div className="editor-container">
//         {editorRefAssignmentFunction && (
//           <EditorRefPlugin eidtorRef={editorRefAssignmentFunction}/>
//         )}
//         <ToolbarPlugin
//             id={`lexical-toolbar-${id}`}
//             toolList={toolbar.toolList}
//             showToolbar={editorState.isToolbarActive}
//             isCanUndo={handleUndo}
//             isCanRedo={handleRedo}
//             editorId={id}
//             customTools={customTools}
//             tabIndex="0"
//           />

//         <div className="editor-inner">
//           <RichTextPlugin
//             contentEditable={<ContentEditable className="editor-input" />}
//             placeholder={<div className="editor-placeholder">Enter some text...</div>}
//             ErrorBoundary={LexicalErrorBoundary}
//           />
//           <HistoryPlugin />
//           <AutoFocusPlugin />
//           <TablePlugin />
//           <ListPlugin />
//         </div>
//       </div>
//     </LexicalComposer>
//   );
// }

// export default Editor;


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
// import TablePlugin from './plugins/TablePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import theme from './themes/EditorTheme';
import './Editor.css';
import { editorConfig } from './plugins/lexicalUtil';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode } from '@lexical/list';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { SpellCheckNode, useSpellCheckPlugin } from './plugins/SpellCheckPlugin';

// SpellCheck Plugin Component
function SpellCheckPlugin() {
  useSpellCheckPlugin();
  return null;
}

function Editor({
    toolbar = { tooList: '' },
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

    // Enhanced editor configuration to include SpellCheckNode
    const enhancedEditorConfig = {
      ...editorConfig,
      nodes: [
        ...(editorConfig.nodes || []),
        ListItemNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        SpellCheckNode, // Add SpellCheckNode to the node registry
      ],
      onError: (error) => {
        console.error('Lexical Editor Error:', error);
      },
    };

  return (
    <LexicalComposer initialConfig={enhancedEditorConfig}>
      <div className="editor-container">
        {editorRefAssignmentFunction && (
          <EditorRefPlugin eidtorRef={editorRefAssignmentFunction}/>
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
          
          {/* Add SpellCheck Plugin */}
          {enableSpellCheck && <SpellCheckPlugin />}
          
          {/* Add any additional custom plugins */}
          {lexicalPlugins.map((Plugin, index) => (
            <Plugin key={index} />
          ))}
        </div>
      </div>
    </LexicalComposer>
  );
}

export default Editor;