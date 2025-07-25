import PropTypes from 'prop-types';
import './Lexical4Admin.css';
import { Controller } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import LexicalEditor from '../LexicalEditor';
import { exportLexicalHtml } from '../lexicalUtil';

const standardList = ['undo', 'redo', 'bold', 'italic', 'underline', 'indent', 'outdent', 'numlist', 'bullist', 'alignMenu', 'cut', 'copy', 'paste'];

const letterToolList = {
  leftSide: standardList,
  rightSide: ['table', 'insert'],
};

const headerToolList = {
  leftSide: ['undo', 'redo', 'bold', 'alignMenu'],
  rightSide: ['insert'],
};

const snippetToolList = {
  leftSide: standardList,
  rightSide: [],
};

const defaultP = '<p class="editor-paragraph"><br></p>';

export default function Lexical4Admin({ id, name, control, type = '', isRequired = false, ariaLabel = '', initialValue = '' }) {
  const [toolBarBtns, setToolBarBtns] = useState(letterToolList);

  useEffect(() => {
    if (type === 'header') setToolBarBtns(headerToolList);
    if (type === 'snippet') setToolBarBtns(snippetToolList);
  }, []);

  return (
    <div className="admin">
      <Controller
        control={control}
        name={name}
        rules={
          isRequired && {
            validate: (value) => !(value === '' || value === defaultP),
          }
        }
        render={({ field, formState }) => (
          <>
            <LexicalEditor
              id={id}
              initialValue={initialValue}
              toolList={toolBarBtns}
              ariaLabel={ariaLabel}
              onChange={(_editorState, editor) => {
                const htmlString = exportLexicalHtml(editor);
                field.onChange(htmlString);
              }}
              type={`4admin${type}`}
            />

            {formState?.errors?.content && (
              <div className="text-danger" aria-live="polite" role="alert">
                Content is required!
              </div>
            )}
          </>
        )}
      />
    </div>
  );
}

Lexical4Admin.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  initialValue: PropTypes.string,
  ariaLabel: PropTypes.string,
  isRequired: PropTypes.bool,
  control: PropTypes.shape({ register: PropTypes.func.isRequired }).isRequired,
};
