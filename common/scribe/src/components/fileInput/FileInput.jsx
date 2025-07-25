import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { LabelContainer } from '../designedComponents';
import './FileInput.css';

function FileInput({ requiredErrorMessage = '', name, accept, multiple, id, required }) {
  const { register, unregister, setValue, watch } = useFormContext();

  const files = watch(name);
  const isFileUploaded = (file) => Array.isArray(file) && !!file?.length;

  const onDrop = useCallback(
    (droppedFiles) => {
      setValue(name, droppedFiles, { shouldValidate: true });
    },
    [setValue, name]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  useEffect(() => {
    const registerOptions = {};
    if (required) registerOptions.required = { value: true, message: requiredErrorMessage };

    register(name, registerOptions);
    return () => unregister(name);
  }, [register, unregister, name]);

  return (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...getRootProps()}
      type="file"
      role="button"
      id={id}>
      <input
        name={name}
        data-testid={`hidden-input-${id}`}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...getInputProps()}
      />

      <div className="file-input-container">
        <LabelContainer>
          <span>Drag file here or&nbsp;</span>
          <span className="fake-link">choose from folder</span>
        </LabelContainer>

        {isFileUploaded(files) && (
          <div className=" ">
            {files.map((file) => (
              <div key={file.name}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  data-testid={`file-input-thumbnail-${id}`}
                  style={{
                    objectFit: 'contain',
                    height: '200px',
                    width: '200px',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

FileInput.propTypes = {
  name: PropTypes.string.isRequired,
  accept: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  multiple: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  requiredErrorMessage: PropTypes.string,
};
export default FileInput;
