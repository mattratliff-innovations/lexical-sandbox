import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { toast, Flip } from 'react-toastify';
import { DateTime, Interval } from 'luxon';
import { DrButton, DrAlert } from '@druid/druid';
import { H1 } from '../../components/typography';
import LetterResults from './LetterResults';
import { StyledInput, StyledLabel, StyledHr, InputContainer, StyledSelect, StyledOption } from '../../components/designedComponents';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { AppContext } from '../../AppProvider';
import { ADMINISTRATOR_PERMISSION } from '../../oidc/Authentication';
import FilterMenu from './FilterMenu';
import { useFeatureFlags } from '../admin/flag/FeatureFlagsProvider';

import LoadingFallback from '../../utils/LoadingFallback';
import useMultiRequestLoading from '../../hooks/useMultiRequestLoading';

const MAX_DATE_RANGE_YEARS = 1;
const DATE_FORMAT = 'yyyy-MM-dd';
const DEFAULT_MONTHS_AGO = 1;
const DATE_RANGE_MAX_DAYS = 366;

export const FUTURE_DATE_ERROR = 'Date cannot be in the future';
export const PAST_YEAR_ERROR = 'Date Range exceeds one year';
export const START_BEFORE_END_DATE = 'Start Date cannot be after End Date';
export const START_DATE_REQUIRED = 'Start Date is required';
export const END_DATE_REQUIRED = 'End Date is required';
export const INVALID_DATE_FORMAT = 'Invalid Date Format';

export const getMinDate = () => {
  const today = DateTime.local();
  const newDateTime = today.minus({ years: MAX_DATE_RANGE_YEARS });
  const formattedDate = newDateTime.toFormat(DATE_FORMAT);
  return formattedDate;
};

export const getMaxDate = () => {
  const today = DateTime.local();
  const formattedDate = today.toFormat(DATE_FORMAT);
  return formattedDate;
};

export const getDefaultStartDate = () => {
  const today = DateTime.local();
  const weekAgo = today.minus({ months: DEFAULT_MONTHS_AGO });
  const formattedDate = weekAgo.toFormat(DATE_FORMAT);
  return formattedDate;
};

export default function SearchLetters() {
  const [filteredLetters, setFilteredLetters] = useState([]);
  const [letterStatuses, setLetterStatuses] = useState([]);
  const [organizationList, setOrganizationList] = useState([]);
  const [formTypeList, setFormTypeList] = useState([]);
  const [letterTypeList, setLetterTypeList] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    formTypeFilterCheckbox: true,
    organizationFilterCheckbox: true,
    statusFilterCheckbox: true,
    alienNumberFilterCheckbox: true,
    letterTypeFilterCheckbox: true,
  });
  const [searchErrorMessage, setSearchErrorMessage] = useState();
  const { featureFlags, refreshFlags } = useFeatureFlags();

  const axios = createAuthenticatedAxios();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    getValues,
    setValue,
    setError,
  } = useForm({ mode: 'all' });

  const { currentUser } = useContext(AppContext);
  const { loading, markFinished } = useMultiRequestLoading(3);

  useEffect(() => {
    refreshFlags();
  }, []);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letters/letter/status`)
      .then((response) => {
        setLetterStatuses(response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Letter Statuses', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  }, []);

  const allQueriesReturned = () => organizationList.length > 0 && letterStatuses.length > 0 && formTypeList.length > 0 && letterTypeList.length > 0;

  useEffect(() => {
    if (!allQueriesReturned()) {
      return;
    } // Only prefill after all selects are populated.

    const savedData = localStorage.getItem('formData');

    // Default to returning everything
    const params = {
      letter: {
        receiptNumber: '',
        updatedAtStart: getDefaultStartDate(),
        updatedAtEnd: getMaxDate(),
      },
    };

    const parsedData = JSON.parse(savedData);

    if (parsedData) {
      Object.keys(parsedData).forEach((key) => {
        setValue(key, parsedData[key]);
        params.letter[key] = parsedData[key];
      });
    }
    localStorage.setItem('formData', JSON.stringify(parsedData));

    axios
      .get(`${APP_API_ENDPOINT}/letters/letter_search`, {
        params: { ...params },
      })
      .then((response) => {
        setFilteredLetters(response.data);
      })
      .catch((e) => {
        setSearchErrorMessage(e?.response?.data?.error);
      });
  }, [setValue, allQueriesReturned()]);

  useEffect(() => {
    if (currentUser.roleName === ADMINISTRATOR_PERMISSION) {
      axios
        .get(`${APP_API_ENDPOINT}/organizations`)
        .then((response) => {
          setOrganizationList(response.data);
        })
        .catch(() => {
          toast.error('There was an error retrieving the Letters', {
            position: 'top-center',
            transition: Flip,
            theme: 'dark',
          });
        });
    } else {
      setOrganizationList(currentUser.organizations);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/form_types`)
      .then((response) => {
        setFormTypeList(response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Form Type list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  }, []);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letter_types`)
      .then((response) => {
        setLetterTypeList(response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Letter Type list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const buildSearchParams = (valuesObject) => {
    const newValues = valuesObject;

    Object.entries(newValues).forEach(([key, value]) => {
      if (!value) {
        delete newValues[key];
      } // Don't send blank values.
      if (key === 'receiptNumber' && newValues[key]) {
        newValues[key] = newValues[key].toUpperCase();
      }
    });

    return newValues;
  };

  const isDateRangeExceedYear = (start, end) => {
    const diff = Interval.fromDateTimes(start, end);
    const diffDays = diff.length('days');
    return diffDays > DATE_RANGE_MAX_DAYS;
  };

  function isCorrectFormat(formDate) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(formDate);
  }

  const isValidDateRange = (formStartDate, formEndDate) => {
    let isValid = true;

    // The Date input should prevent incorrect format
    if (!isCorrectFormat(formStartDate)) {
      setError('updatedAtStart', {
        type: 'custom',
        message: INVALID_DATE_FORMAT,
      });
      return false;
    }
    if (!isCorrectFormat(formEndDate)) {
      setError('updatedAtEnd', {
        type: 'custom',
        message: INVALID_DATE_FORMAT,
      });
      return false;
    }

    const start = DateTime.fromISO(formStartDate);
    const end = DateTime.fromISO(formEndDate);

    if (start > end) {
      setError('updatedAtStart', {
        type: 'custom',
        message: START_BEFORE_END_DATE,
      });
      isValid = false;
    } else if (isDateRangeExceedYear(start, end)) {
      setError('updatedAtStart', { type: 'custom', message: PAST_YEAR_ERROR });
      isValid = false;
    }
    return isValid;
  };

  const onSubmit = async () => {
    const formStartDate = getValues('updatedAtStart');
    const formEndDate = getValues('updatedAtEnd');

    if (!isValidDateRange(formStartDate, formEndDate)) {
      return;
    }
    const valuesObject = getValues();
    localStorage.setItem('formData', JSON.stringify(valuesObject));

    const newValues = buildSearchParams(valuesObject);

    // When empty, set a default of a blank receiptNumber (or the search will error)
    if (Object.keys(newValues).length === 0) {
      newValues.receiptNumber = '';
    }
    axios
      .get(`${APP_API_ENDPOINT}/letters/letter_search`, {
        params: { letter: { ...newValues } },
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response) => {
        setSearchErrorMessage(null);
        setFilteredLetters(response.data);
      })
      .catch((e) => {
        setSearchErrorMessage(e?.response?.data?.error);
      });
  };

  const handleFilterCheckboxOnClick = (event) => {
    // clear the associated dropdown
    setValue(event.target.attributes['data-associated-select-id'].value, '');
    // Record the clicked checkbox's value
    setCurrentFilters({
      ...currentFilters,
      [event.target.id]: event.target.checked,
    });
  };

  const isDateInFuture = (formDate) => {
    const dateValue = DateTime.fromISO(formDate);
    const today = DateTime.local();
    return dateValue.startOf('day') > today.startOf('day');
  };

  if (loading) return <LoadingFallback />;

  return (
    <div className="page_min_height">
      <div className="row mt-3">
        <div className="col-sm-1" />
        <div className="col-sm-10">
          <div className="row">
            <div className="col-sm-12">
              <H1 data-testid="header">
                {featureFlags?.find((flag) => flag.id === 'new_ui')?.state === true ? 'NEW UI Search' : 'Search All Letters'}
              </H1>
            </div>
          </div>
        </div>

        <div className="col-sm-1">
          <FilterMenu currentFilters={currentFilters} handleFilterCheckboxOnClick={handleFilterCheckboxOnClick} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />

        <div className="col-sm-10">
          {searchErrorMessage && (
            <div className="row mb-3">
              <div className="col-sm-8">
                <DrAlert type="error" noCloseBtn alert={searchErrorMessage} />
              </div>
            </div>
          )}
        </div>
      </div>

      <form>
        <div className="row">
          <div className="col-sm-1" />
          <div className="col-sm-10">
            <div className="row mb-3" data-testid="filterContainer">
              <div className="col-sm-2">
                <InputContainer>
                  <StyledLabel htmlFor="searchBox">Receipt Number Starts With</StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('receiptNumber')}
                    id="searchBox"
                    maxLength="13"
                    placeholder="Enter 3 characters"
                    onKeyDown={handleKeyDown}
                  />
                </InputContainer>
              </div>

              <div className="col-sm-2">
                <InputContainer>
                  <StyledLabel htmlFor="updatedAtStart" className="required">
                    Last Updated - Start
                  </StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('updatedAtStart', {
                      required: { value: true, message: START_DATE_REQUIRED },
                      validate: (value) => !isDateInFuture(value) || FUTURE_DATE_ERROR,
                    })}
                    id="updatedAtStart"
                    maxLength="100"
                    aria-describedby="updatedAtStart2"
                    onKeyDown={handleKeyDown}
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    defaultValue={getDefaultStartDate()}
                  />
                  {errors?.updatedAtStart?.message ? (
                    <div className="text-danger mt-1" aria-live="polite" role="alert">
                      {errors?.updatedAtStart?.message}
                    </div>
                  ) : (
                    <StyledLabel id="updatedAtStart2">1-year date range limit</StyledLabel>
                  )}
                </InputContainer>
              </div>

              <div className="col-sm-2">
                <InputContainer>
                  <StyledLabel htmlFor="updatedAtEnd" className="required">
                    Last Updated - End
                  </StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('updatedAtEnd', {
                      required: { value: true, message: END_DATE_REQUIRED },
                      validate: (value) => !isDateInFuture(value) || FUTURE_DATE_ERROR,
                    })}
                    id="updatedAtEnd"
                    maxLength="100"
                    aria-describedby="updatedAtEnd2"
                    onKeyDown={handleKeyDown}
                    type="date"
                    min={getMinDate()}
                    max={getMaxDate()}
                    defaultValue={getMaxDate()}
                  />
                  {errors?.updatedAtEnd?.message ? (
                    <div className="text-danger mt-1" aria-live="polite" role="alert">
                      {errors?.updatedAtEnd?.message}
                    </div>
                  ) : (
                    <StyledLabel id="updatedAtEnd2">1-year date range limit</StyledLabel>
                  )}
                </InputContainer>
              </div>

              {currentFilters.organizationFilterCheckbox && (
                <div className="col-sm-2">
                  <InputContainer>
                    <StyledLabel htmlFor="organizationId">Choose Organization</StyledLabel>
                    <StyledSelect
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('organizationId')}
                      id="organizationId"
                      data-testid="organizationId">
                      <StyledOption value="" />
                      {organizationList.map((letterOrganization) => (
                        <StyledOption
                          key={letterOrganization.id}
                          value={letterOrganization.id}
                          data-testid={`letterOrganizationId_${letterOrganization.id}`}>
                          {letterOrganization.name}
                        </StyledOption>
                      ))}
                    </StyledSelect>
                  </InputContainer>
                </div>
              )}

              {currentFilters.statusFilterCheckbox && (
                <div className="col-sm-2">
                  <InputContainer>
                    <StyledLabel htmlFor="statusId">Choose Status</StyledLabel>
                    <StyledSelect
                      textType="capitalize"
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('statusId')}
                      id="statusId"
                      data-testid="statusId">
                      <StyledOption textType="capitalize" value="" />
                      {letterStatuses.map((letterStatus) => (
                        <StyledOption key={letterStatus.id} value={letterStatus.id} data-testid={`letterStatusId_${letterStatus.id}`}>
                          {letterStatus.id}
                        </StyledOption>
                      ))}
                    </StyledSelect>
                  </InputContainer>
                </div>
              )}

              {currentFilters.formTypeFilterCheckbox && (
                <div className="col-sm-2">
                  <InputContainer>
                    <StyledLabel htmlFor="formTypeCode">Choose Form Type</StyledLabel>
                    <StyledSelect
                      textType="uppercase"
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('formTypeCode')}
                      id="formTypeCode"
                      data-testid="formTypeCode"
                      onKeyDown={handleKeyDown}>
                      <StyledOption textType="uppercase" value="" />
                      {formTypeList.map((formType) => (
                        <StyledOption key={formType.id} value={formType.code} data-testid={`formTypeId_${formType.id}`}>
                          {formType.name}
                        </StyledOption>
                      ))}
                    </StyledSelect>
                  </InputContainer>
                </div>
              )}

              {currentFilters.letterTypeFilterCheckbox && (
                <div className="col-sm-2">
                  <InputContainer>
                    <StyledLabel htmlFor="letterType">Choose Letter Type</StyledLabel>
                    <StyledSelect
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('letterType')}
                      id="letterType"
                      data-testid="letterType">
                      <StyledOption value="" />
                      {letterTypeList.map((letterType) => (
                        <StyledOption key={letterType.id} value={letterType.id} data-testid={`letterTypeId_${letterType.id}`}>
                          {letterType.name}
                        </StyledOption>
                      ))}
                    </StyledSelect>
                  </InputContainer>
                </div>
              )}

              {currentFilters.alienNumberFilterCheckbox && (
                <div className="col-sm-2">
                  <InputContainer>
                    <StyledLabel htmlFor="aNumberSearchBox">A-Number</StyledLabel>
                    <StyledInput
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('alienNumber')}
                      id="aNumberSearchBox"
                      maxLength="13"
                      onKeyDown={handleKeyDown}
                      aria-describedby="aNumber"
                    />
                  </InputContainer>
                </div>
              )}

              <div className="col-sm-2">
                <InputContainer>
                  <StyledLabel htmlFor="fullTextSearch">Letter Body Contains</StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('fullTextSearch')}
                    id="fullTextSearch"
                    onKeyDown={handleKeyDown}
                  />
                </InputContainer>
              </div>
            </div>
          </div>
          <div className="col-sm-1" />
        </div>

        <div className="row">
          <div className="col-sm-1" />
          <div className="col-sm-10">
            <div className="row mb-3">
              <div className="col-sm-4">
                <DrButton
                  data-testid="searchSubmit"
                  id="search-submit-button"
                  variant="primary"
                  onClick={() => handleSubmit(onSubmit)()}
                  isDisabled={isSubmitting}
                  styles={{ button: { width: '150px' } }}>
                  {isSubmitting ? 'Searching...' : 'Search'}
                </DrButton>
              </div>
            </div>
          </div>
          <div className="col-sm-1" />
        </div>
      </form>
      <div className="row">
        <div className="col-lg-1" />
        <div className="col-lg-10">
          <StyledHr />
        </div>
        <div className="col-lg-1" />
      </div>
      <LetterResults filteredLetters={filteredLetters} />
    </div>
  );
}
