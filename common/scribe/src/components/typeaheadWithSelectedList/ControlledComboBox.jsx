/* eslint-disable react/jsx-props-no-spreading */
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import React from 'react';
import TypeaheadWithSelectedList from './TypeaheadWithSelectedList';

export default function ControlledComboBox({ control, name, rule = null, ...props }) {
  return (
    <Controller
      control={control}
      name={name}
      rules={
        rule && {
          validate: (value) => value?.some((option) => option.selected),
        }
      }
      render={({ field, fieldState, formState }) =>
        field.value ? (
          <div className="mb-4">
            {fieldState.invalid && formState.isSubmitted && (
              <div className="text-danger" aria-live="polite" role="alert">
                {rule}
              </div>
            )}

            <TypeaheadWithSelectedList {...props} options={field?.value} setValues={field?.onChange} />
          </div>
        ) : null
      }
    />
  );
}
ControlledComboBox.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.shape({ register: PropTypes.func.isRequired }).isRequired,
  rule: PropTypes.string,
};
