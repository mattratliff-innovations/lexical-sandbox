/* eslint-disable no-nested-ternary, require-loading-check-for-axios */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import styled from '@emotion/styled';
import _ from 'lodash';
import { DrIcon } from '@druid/druid';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { StyledLabel } from '../designedComponents';
import './TypeaheadWithSelectedList.css';

export const LETTER_TYPE_RETRIEVAL_ERROR = 'Encountered an unknown error retrieving Letter Types.';

// Styled Components
const SelectedList = styled.div`
  border: #707070 2px solid;
  height: 244px;
  overflow: auto;
`;

const ItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SelectedTypeContainer = styled.div`
  .row > * {
    margin: 0;
  }
  [class^='col-'] {
    padding-left: 0;
    padding-right: 0;
  }
`;

// Constants
const TYPEAHEAD_TYPES = {
  FORMS_AND_LETTERS: 'formsAndLetters',
  FORMS_AND_CLASS_PREFERENCES: 'formsAndClassPreferences',
};

const API_ENDPOINTS = {
  LETTER_TYPES: '/letter_types/available_letter_types_for_form_type',
  CLASS_PREFERENCES: '/class_preferences/available_class_preferences_for_form_type',
};

export default function TypeaheadWithSelectedList({ typeaheadId, typeaheadLabel, options = null, setValues, multiMode = false }) {
  const axios = useMemo(() => createAuthenticatedAxios(), []);

  // State management
  const [availableOptions, setAvailableOptions] = useState([]);
  const [allData, setAllData] = useState([]);
  const [currentForm, setCurrentForm] = useState({});
  const [formTypes, setFormTypes] = useState([]);
  const [selected, setSelected] = useState([]);

  const isClassPreferenceTypeahead = typeaheadId === TYPEAHEAD_TYPES.FORMS_AND_CLASS_PREFERENCES;

  // API calls
  const fetchData = useCallback(
    async (form, endpoint, dataKey) => {
      try {
        const params = { form_type_id: form.id };
        const response = await axios.get(`${APP_API_ENDPOINT}${endpoint}`, { params });

        const mappedData = response.data
          .map((item) => {
            const xrefKey = dataKey === 'letters' ? 'formLetterTypeXrefs' : 'classPreferenceFormXrefs';
            if (item[xrefKey]?.[0]?.id) {
              return {
                id: item.id,
                label: item.name,
                name: item.name,
              };
            }
            return null;
          })
          .filter(Boolean);

        const newData = { form, [dataKey]: mappedData };
        setAllData((prev) => [...prev, newData]);
      } catch (error) {
        console.error(`API error fetching ${dataKey}:`, error);
      }
    },
    [axios]
  );

  const retrieveLetters = useCallback((form) => fetchData(form, API_ENDPOINTS.LETTER_TYPES, 'letters'), [fetchData]);

  const retrieveClassPreferences = useCallback((form) => fetchData(form, API_ENDPOINTS.CLASS_PREFERENCES, 'preferences'), [fetchData]);

  // Data reconciliation
  const reconcileOptions = useCallback(() => {
    if (!multiMode || !currentForm.id) return;

    const formData = allData.find((data) => data.form.id === currentForm.id);
    if (!formData) return;

    const sourceData = !isClassPreferenceTypeahead ? formData.letters : formData.preferences;
    if (!sourceData) return;

    let validOptions = _.cloneDeep(sourceData);

    options.selected?.forEach((selectedOption) => {
      sourceData.forEach((sourceItem) => {
        const isMatch = !isClassPreferenceTypeahead
          ? selectedOption.form.id === currentForm.id && sourceItem.id === selectedOption.letter?.id
          : selectedOption.form.id === currentForm.id && sourceItem.id === selectedOption.classPreference?.id;

        if (isMatch) {
          validOptions = validOptions.filter((option) => option.id !== sourceItem.id);
        }
      });
    });

    setAvailableOptions(validOptions);
  }, [multiMode, currentForm.id, allData, options.selected, !isClassPreferenceTypeahead]);

  // Effects
  useEffect(() => {
    if (multiMode) {
      reconcileOptions();
    }
  }, [multiMode, reconcileOptions]);

  useEffect(() => {
    if (multiMode) {
      setFormTypes(options.formOptions || []);
      setSelected(options.selected || []);
    } else {
      setSelected(options?.filter((option) => option.selected) || []);
      setAvailableOptions(options?.filter((option) => !option.selected) || []);
    }
  }, [options, multiMode]);

  // Event handlers
  const handleOptionChange = useCallback(
    (selectedOptions, action) => {
      const clonedOptions = _.cloneDeep(options);

      if (action === 'add') {
        const [selectedOption] = selectedOptions;

        if (multiMode) {
          const newSelection = {
            form: currentForm,
            ...(!isClassPreferenceTypeahead ? { letter: selectedOption } : { classPreference: selectedOption }),
          };

          const existingIndex = clonedOptions.selected?.findIndex((item) => {
            const itemId = !isClassPreferenceTypeahead ? item.letter?.id : item.classPreference?.id;
            const selectedId = !isClassPreferenceTypeahead ? selectedOption.id : selectedOption.id;
            return itemId === selectedId && item.form?.id === currentForm.id;
          });

          if (existingIndex === -1 || existingIndex === undefined) {
            clonedOptions.selected.push(newSelection);
          }
        } else {
          const foundIndex = clonedOptions.findIndex((item) => item.value === selectedOption.value);
          if (foundIndex !== -1) {
            clonedOptions[foundIndex].selected = true;
          }
        }
      }

      if (action === 'remove') {
        if (multiMode) {
          const indexToRemove = clonedOptions.selected.findIndex((item) => {
            const itemId = !isClassPreferenceTypeahead ? item.letter?.id : item.classPreference?.id;
            const targetId = !isClassPreferenceTypeahead ? selectedOptions.letter?.id : selectedOptions.classPreference?.id;
            return itemId === targetId && item.form?.id === selectedOptions.form?.id;
          });

          if (indexToRemove > -1) {
            clonedOptions.selected.splice(indexToRemove, 1);
          }
        } else {
          const foundIndex = clonedOptions.findIndex((item) => item.value === selectedOptions.value);
          if (foundIndex !== -1) {
            clonedOptions[foundIndex].selected = false;
          }
        }
      }

      setValues(clonedOptions);
    },
    [options, multiMode, currentForm, !isClassPreferenceTypeahead, setValues]
  );

  const handleFormSelection = useCallback(
    (selectedForms) => {
      if (selectedForms.length === 0) return;

      const selectedForm = selectedForms[0];
      setCurrentForm(selectedForm);

      const existingData = allData?.find((data) => data?.form?.id === selectedForm?.id);
      if (!existingData) {
        if (!isClassPreferenceTypeahead) {
          retrieveLetters(selectedForm);
        } else if (isClassPreferenceTypeahead) {
          retrieveClassPreferences(selectedForm);
        }
      }
    },
    [allData, !isClassPreferenceTypeahead, isClassPreferenceTypeahead, retrieveLetters, retrieveClassPreferences]
  );

  // Render helpers
  const renderTypeahead = () => {
    const typeaheadProps = {
      id: `${typeaheadId}StyledTypeahead`,
      onChange: (opt) => handleOptionChange(opt, 'add'),
      options: availableOptions,
      selected: [],
      minLength: 1,
      highlightOnlyResult: true,
      inputProps: { 'aria-label': `Search ${typeaheadLabel}` },
      placeholder: `-Enter ${typeaheadLabel.slice(0, -3)}-`,
      disabled: !availableOptions?.length,
      className: 'newClass',
    };

    return <Typeahead {...typeaheadProps} />;
  };

  const renderSelectedItem = (option) => {
    const form = multiMode ? option.form : null;
    const itemData = multiMode ? (!isClassPreferenceTypeahead ? option.letter : option.classPreference) : null;

    const key = multiMode ? (!isClassPreferenceTypeahead ? option.formLetterTypeXrefId : option.formClassPreferenceXrefId) : option.id;

    const displayLabel = multiMode ? form?.name : option.label;
    const secondaryLabel = multiMode ? itemData?.label : null;
    const removeLabel = multiMode ? `${form?.name} ${itemData?.name}` : option.label;

    return (
      <SelectedTypeContainer
        key={`container-for-user-selected-form-${option?.id}`}
        style={{ borderBottom: '1px #F6F6F6 solid' }}
        className="container">
        <div className="row">
          <div className={multiMode ? 'col-3' : 'col-12'}>
            <ItemContainer>
              <Button
                onClick={() => handleOptionChange(option, 'remove')}
                data-testid={`removeButtonFor${key}`}
                variant="link"
                size="sm"
                className="iconRemoveOptionBtn">
                <DrIcon alt={`Remove ${removeLabel}`} title={`Remove ${removeLabel}`} height="28px" width="28px" iconName="xmark" color="#707070" />
              </Button>
              <span>{displayLabel}</span>
            </ItemContainer>
          </div>

          {multiMode && (
            <div className="col-9">
              <div>{secondaryLabel}</div>
            </div>
          )}
        </div>
      </SelectedTypeContainer>
    );
  };

  return (
    <>
      {multiMode && (
        <div className="pb-2 d-flex flex-column" data-testid="formTypesSelect">
          <StyledLabel htmlFor={`${typeaheadId}Typeahead`}>Search Form Types</StyledLabel>
          <Typeahead
            id={`${typeaheadId}TypeaheadForFormTypes`}
            onChange={handleFormSelection}
            options={formTypes}
            minLength={1}
            highlightOnlyResult
            inputProps={{
              'aria-label': `Search Form Types for ${typeaheadLabel}`,
            }}
            placeholder="-Enter Form Type-"
          />
        </div>
      )}

      <div className="pb-2 d-flex flex-column" data-testid={typeaheadId}>
        <StyledLabel htmlFor={`${typeaheadId}Typeahead`}>{`Search ${typeaheadLabel}`}</StyledLabel>
        {(!isClassPreferenceTypeahead || isClassPreferenceTypeahead) && renderTypeahead()}
      </div>

      <div>
        <StyledLabel>{`Selected ${typeaheadLabel}`}</StyledLabel>
        <SelectedList data-testid={`typeaheadSelectedContainer_${typeaheadId}`} className="py-1">
          {selected?.map(renderSelectedItem)}
        </SelectedList>
      </div>
    </>
  );
}

TypeaheadWithSelectedList.propTypes = {
  typeaheadId: PropTypes.string.isRequired,
  typeaheadLabel: PropTypes.string.isRequired,
  setValues: PropTypes.func.isRequired,
  multiMode: PropTypes.bool,
  options: PropTypes.oneOfType([
    PropTypes.shape({
      selected: PropTypes.arrayOf(
        PropTypes.shape({
          form: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
          }),
          letter: PropTypes.shape({
            id: PropTypes.string,
            label: PropTypes.string,
            name: PropTypes.string,
          }),
          classPreference: PropTypes.shape({
            id: PropTypes.string,
            label: PropTypes.string,
            name: PropTypes.string,
          }),
          formLetterTypeXrefId: PropTypes.string,
          formClassPreferenceXrefId: PropTypes.string,
        })
      ),
      formOptions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        })
      ),
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        value: PropTypes.string,
        label: PropTypes.string,
        selected: PropTypes.bool,
      })
    ),
  ]),
};
