/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';

import TypeaheadWithSelectedList from './TypeaheadWithSelectedList';

export default function ControlledComboBox({ control, name, rule = null, typeaheadId, ...props }) {
  const isLettersAndHeaders = typeaheadId === 'headers';

  return (
    <Controller
      control={control}
      name={name}
      rules={
        rule && {
          validate: (value) => {
            // For letters and headers mode, check if there are any selected items
            if (isLettersAndHeaders) {
              return value?.selected && value.selected.length > 0;
            }
            // For other modes, check if any option is selected
            return value?.some((option) => option.selected);
          },
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

            <TypeaheadWithSelectedList {...props} typeaheadId={typeaheadId} options={field?.value} setValues={field?.onChange} />
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
  typeaheadId: PropTypes.string.isRequired,
};
