// src/App.js
import Editor from './components/Editor/Editor';
import './App.css';

function App() {
  return (
    <div className="admin">
      <h1>Lexical Editor Playground for Scribe</h1><br/><br/><br/>
      <Editor id='scribe editor'
              initialValue=''
              toolbar={{
                toolList: 'spellcheck undo redo bold italic subscript superscript underline alignleft aligncenter alignright alignjustify bullist '
                + 'numlist outdent indent copy cut paste pasteword fontSize table footnote horizontalrule maximize source fontcase',
              }}
            />
            <br/>
            
            <button
              type="button"
              onClick={() => window.open('', '', 'width=400,height=400')}
            >
              Open Modal
            </button>
    </div>
  );
}

export default App;