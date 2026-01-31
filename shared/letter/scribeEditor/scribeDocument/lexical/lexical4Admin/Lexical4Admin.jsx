import React from 'react';

import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';

import './Lexical4Admin.css';
import HighlightPlugin from '../letterEditor/plugins/HighlightPlugin';
import LexicalEditor from '../LexicalEditor';
import { standardToolList } from '../lexicalToolbarHelper';
import { exportLexicalHtml } from '../lexicalUtil';

const defaultP = '<p class="editor-paragraph"><br></p>';

export default function Lexical4Admin({
  id,
  name,
  control,
  type = '',
  isRequired = false,
  ariaLabel = '',
  initialValue = '',
  toolList = standardToolList,
}) {
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
              toolList={toolList}
              ariaLabel={ariaLabel}
              onChange={(_editorState, editor) => {
                const htmlString = exportLexicalHtml(editor);
                field.onChange(htmlString);
              }}
              type={`4admin${type}`}
              lexicalPlugins={[<HighlightPlugin key={`highlight-plugin-${id}`} />]}
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
  toolList: PropTypes.shape({ leftSide: PropTypes.arrayOf(PropTypes.string), rightSide: PropTypes.arrayOf(PropTypes.string) }),
};
