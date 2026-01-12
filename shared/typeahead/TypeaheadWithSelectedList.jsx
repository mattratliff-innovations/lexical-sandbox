/* eslint-disable scribe/require-loading-check-for-axios */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DrIcon } from '@druid/druid';
import styled from '@emotion/styled';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { Typeahead } from 'react-bootstrap-typeahead';

import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../http/authenticatedAxios';
import { StyledLabel } from '../designedComponents';
import './TypeaheadWithSelectedList.css';

export const LETTER_TYPE_RETRIEVAL_ERROR = 'Encountered an unknown error retrieving Letter Types.';

// #region StyleComponents
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
// #endregion

// Constants
const TYPEAHEAD_TYPES = {
  FORMS_AND_LETTERS: 'formsAndLetters',
  FORMS_AND_CLASS_PREFERENCES: 'formsAndClassPreferences',
  LETTERS_AND_HEADERS: 'headers',
};

const API_ENDPOINTS = {
  LETTER_TYPES: '/letter_types/available_letter_types_for_form_type',
  CLASS_PREFERENCES: '/class_preferences/available_class_preferences_for_form_type',
  ALL_LETTER_TYPES: '/letter_types',
  ALL_HEADERS: '/headers',
};

export default function TypeaheadWithSelectedList({ typeaheadId, typeaheadLabel, options = null, setValues, multiMode = false }) {
  const axios = useMemo(() => createAuthenticatedAxios(), []);

  // State management
  const [availableOptions, setAvailableOptions] = useState([]);
  const [allData, setAllData] = useState([]);
  const [currentForm, setCurrentForm] = useState({});
  const [currentLetterType, setCurrentLetterType] = useState(null);
  // const [currentHeader, setCurrentHeader] = useState(null);
  const [formTypes, setFormTypes] = useState([]);
  const [letterTypes, setLetterTypes] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selected, setSelected] = useState([]);

  const isClassPreferenceTypeahead = typeaheadId === TYPEAHEAD_TYPES.FORMS_AND_CLASS_PREFERENCES;
  const isLettersAndHeadersTypeahead = typeaheadId === TYPEAHEAD_TYPES.LETTERS_AND_HEADERS;

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

  // Independent fetch functions for letters and headers mode
  const fetchAllLetterTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${APP_API_ENDPOINT}${API_ENDPOINTS.ALL_LETTER_TYPES}`);
      console.log(response);
      const mappedData = response.data.map((item) => ({
        id: item.id,
        label: item.name,
        name: item.name,
      }));
      console.log(mappedData);
      setLetterTypes(mappedData);
    } catch (error) {
      console.error('API error fetching letter types:', error);
    }
  }, [axios]);

  const fetchAllHeaders = useCallback(async () => {
    try {
      const response = await axios.get(`${APP_API_ENDPOINT}${API_ENDPOINTS.ALL_HEADERS}`);
      const mappedData = response.data.map((item) => ({
        id: item.id,
        label: item.name,
        name: item.name,
      }));
      setHeaders(mappedData);
    } catch (error) {
      console.error('API error fetching headers:', error);
    }
  }, [axios]);

  /**
   * For letters and headers mode, no reconciliation needed since they're independent
   * For forms mode, filters based on current form selection
   */
  const reconcileOptions = useCallback(() => {
    if (!multiMode) return;

    // Handle letters and headers mode - no filtering needed, fully independent
    if (isLettersAndHeadersTypeahead) {
      // Both letter types and headers are always available
      return;
    }

    // Handle forms mode
    if (!currentForm.id) return;

    const formData = allData.find((data) => data.form?.id === currentForm.id);
    if (!formData) return;

    const sourceData = !isClassPreferenceTypeahead ? formData.letters : formData.preferences;
    if (!sourceData) return;

    let validOptions = _.cloneDeep(sourceData);

    options.selected?.forEach((selectedOption) => {
      sourceData.forEach((sourceItem) => {
        const isMatch = !isClassPreferenceTypeahead
          ? selectedOption.form?.id === currentForm.id && sourceItem.id === selectedOption.letter?.id
          : selectedOption.form?.id === currentForm.id && sourceItem.id === selectedOption.classPreference?.id;

        if (isMatch) {
          validOptions = validOptions.filter((option) => option.id !== sourceItem.id);
        }
      });
    });

    setAvailableOptions(validOptions);
  }, [multiMode, currentForm.id, allData, options.selected, isClassPreferenceTypeahead, isLettersAndHeadersTypeahead]);

  /**
   * If multimode then looks up the associated component data
   */
  useEffect(() => {
    if (multiMode) {
      reconcileOptions();
    }
  }, [multiMode, reconcileOptions]);

  /**
   * Prepopulate the form/letter type/header data and any already saved selected data
   */
  useEffect(() => {
    if (multiMode) {
      if (isLettersAndHeadersTypeahead) {
        // Fetch both letter types and headers independently
        // console.log('org id = ', options.organizationId);
        // if (options.organizationId) {
        console.log('getting letter types');
        fetchAllLetterTypes();
        fetchAllHeaders();
        // }
        // Debug: Log what's in selected to help troubleshoot
        if (options.selected && options.selected.length > 0) {
          console.log('Letters and Headers - Selected items:', options.selected);
        }
      } else {
        setFormTypes(options.formOptions || []);
      }
      setSelected(options.selected || []);
    } else {
      setSelected(options?.filter((option) => option.selected) || []);
      setAvailableOptions(options?.filter((option) => !option.selected) || []);
    }
  }, [options, multiMode, isLettersAndHeadersTypeahead, fetchAllLetterTypes, fetchAllHeaders]);

  /**
   * Removes or adds entries in the selection list
   * For letters and headers mode, creates xref when both are selected
   */
  const handleOptionChange = useCallback(
    (selectedOptions, action) => {
      const clonedOptions = _.cloneDeep(options);

      if (action === 'add') {
        const [selectedOption] = selectedOptions;

        if (multiMode) {
          let newSelection;

          if (isLettersAndHeadersTypeahead) {
            // Letters and Headers mode - both must be selected to create entry
            // Determine if this is a letter type or header selection
            const isLetterTypeSelection = letterTypes.some((lt) => lt.id === selectedOption.id);
            const isHeaderSelection = headers.some((h) => h.id === selectedOption.id);

            if (isLetterTypeSelection) {
              setCurrentLetterType(selectedOption);
              // Don't add to selected yet, wait for header
              return;
            }
            if (isHeaderSelection) {
              // setCurrentHeader(selectedOption);
              // Check if letter type is already selected
              if (!currentLetterType) {
                // Can't add without a letter type
                return;
              }

              // Both are selected, create the xref entry
              newSelection = {
                letterType: currentLetterType,
                header: selectedOption,
              };

              const existingIndex = clonedOptions.selected?.findIndex(
                (item) => item.header?.id === selectedOption.id && item.letterType?.id === currentLetterType.id
              );

              if (existingIndex === -1 || existingIndex === undefined) {
                clonedOptions.selected.push(newSelection);
                // Reset selections
                setCurrentLetterType(null);
                // setCurrentHeader(null);
              }
            }
          } else {
            // Forms mode - letter or class preference
            newSelection = {
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
            if (isLettersAndHeadersTypeahead) {
              // Letters and Headers mode
              return item.header?.id === selectedOptions.header?.id && item.letterType?.id === selectedOptions.letterType?.id;
            }
            // Forms mode
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
    [options, multiMode, currentForm, currentLetterType, letterTypes, headers, isClassPreferenceTypeahead, isLettersAndHeadersTypeahead, setValues]
  );

  /**
   * When the user selects the form from the dropdown list
   * Step 1: select the form
   * Step 2: select the associated entity (class preference, letter type, etc..)
   * Coupled to letter data and class preference data
   */
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
    [allData, isClassPreferenceTypeahead, retrieveLetters, retrieveClassPreferences]
  );

  /**
   * Adds the typeahead search component
   * For letters and headers mode, returns headers list
   * @returns Typehead component
   */
  const renderTypeahead = () => {
    let options;
    let placeholder;
    let ariaLabel;

    if (isLettersAndHeadersTypeahead) {
      // In letters and headers mode, this is the headers dropdown
      options = headers;
      placeholder = `-Enter Header-`;
      ariaLabel = `Search Headers`;
    } else {
      // Forms mode - use available options
      options = availableOptions;
      placeholder = `-Enter ${typeaheadLabel.slice(0, -3)}-`;
      ariaLabel = `Search ${typeaheadLabel}`;
    }

    const typeaheadProps = {
      id: `${typeaheadId}StyledTypeahead`,
      onChange: (opt) => handleOptionChange(opt, 'add'),
      options,
      selected: [],
      minLength: 1,
      highlightOnlyResult: true,
      inputProps: { 'aria-label': ariaLabel },
      placeholder,
      disabled: !options?.length,
      className: 'newClass',
    };

    return <Typeahead {...typeaheadProps} />;
  };

  /**
   * Used to render the final select list (remove an item)
   * Coupled to letter data, class preference data, and header data
   * @param {*} option The selected option passed in for rendering
   * @returns The type ahead container
   */
  const renderSelectedItem = (option, index) => {
    let primaryData;
    let itemData;
    let key;
    let displayLabel;
    let secondaryLabel;
    let removeLabel;

    if (multiMode) {
      if (isLettersAndHeadersTypeahead) {
        // Letters and Headers mode - letter type first, then header
        primaryData = option.letterType;
        itemData = option.header;
        // Use organizationLetterTypeHeaderXrefId or generate a unique key
        key = option.organizationLetterTypeHeaderXrefId || `${option.letterType?.id || 'lt'}-${option.header?.id || 'h'}-${index}`;
        displayLabel = primaryData?.name || primaryData?.label;
        secondaryLabel = itemData?.name || itemData?.label;
        removeLabel = `${primaryData?.name || primaryData?.label || 'Letter Type'} ${itemData?.name || itemData?.label || 'Header'}`;
      } else {
        // Forms mode
        primaryData = option.form;
        itemData = !isClassPreferenceTypeahead ? option.letter : option.classPreference;
        key = !isClassPreferenceTypeahead
          ? option.formLetterTypeXrefId || `${option.form?.id || 'f'}-${option.letter?.id || 'l'}-${index}`
          : option.formClassPreferenceXrefId || `${option.form?.id || 'f'}-${option.classPreference?.id || 'cp'}-${index}`;
        displayLabel = primaryData?.name || primaryData?.label;
        secondaryLabel = itemData?.name || itemData?.label;
        removeLabel = `${primaryData?.name || primaryData?.label || 'Form'} ${itemData?.name || itemData?.label || 'Item'}`;
      }
    } else {
      // Single mode
      key = option.id || `single-${index}`;
      displayLabel = option.label || option.name;
      secondaryLabel = null;
      removeLabel = option.label || option.name || 'Item';
    }

    return (
      <SelectedTypeContainer key={`container-for-user-selected-${key}`} style={{ borderBottom: '1px #F6F6F6 solid' }} className="container">
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

  /**
   * Note: For letters and headers mode, both dropdowns are shown independently
   */
  return (
    <>
      {multiMode && !isLettersAndHeadersTypeahead && (
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

      {multiMode && isLettersAndHeadersTypeahead && (
        <>
          <div className="pb-2 d-flex flex-column" data-testid="letterTypesSelect">
            <StyledLabel htmlFor={`${typeaheadId}LetterTypeTypeahead`}>Search Letter Types</StyledLabel>
            <Typeahead
              id={`${typeaheadId}TypeaheadForLetterTypes`}
              onChange={(opt) => handleOptionChange(opt, 'add')}
              options={letterTypes}
              selected={currentLetterType ? [currentLetterType] : []}
              minLength={1}
              highlightOnlyResult
              inputProps={{
                'aria-label': 'Search Letter Types',
              }}
              placeholder="-Enter Letter Type-"
            />
          </div>

          <div className="pb-2 d-flex flex-column" data-testid={typeaheadId}>
            <StyledLabel htmlFor={`${typeaheadId}Typeahead`}>Search Headers</StyledLabel>
            {renderTypeahead()}
          </div>
        </>
      )}

      {!isLettersAndHeadersTypeahead && (
        <div className="pb-2 d-flex flex-column" data-testid={typeaheadId}>
          <StyledLabel htmlFor={`${typeaheadId}Typeahead`}>{`Search ${typeaheadLabel}`}</StyledLabel>
          {renderTypeahead()}
        </div>
      )}

      <div>
        <StyledLabel>{`Selected ${typeaheadLabel}`}</StyledLabel>
        <SelectedList data-testid={`typeaheadSelectedContainer_${typeaheadId}`} className="py-1">
          {selected
            ?.filter((item) => {
              // Filter out invalid items
              if (!item) return false;
              if (isLettersAndHeadersTypeahead) {
                // Must have both letterType and header
                return item.letterType && item.header;
              }
              if (multiMode) {
                // Must have form and either letter or classPreference
                return item.form && (item.letter || item.classPreference);
              }
              // Single mode - must have id or value
              return item.id || item.value;
            })
            .map((item, index) => renderSelectedItem(item, index))}
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
          letterType: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
          }),
          letter: PropTypes.shape({
            id: PropTypes.string,
            label: PropTypes.string,
            name: PropTypes.string,
          }),
          header: PropTypes.shape({
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
          organizationLetterTypeHeaderXrefId: PropTypes.string,
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
