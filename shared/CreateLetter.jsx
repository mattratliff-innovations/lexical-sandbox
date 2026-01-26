/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useRef, useState } from 'react';

import { DrButton } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import './CreateLetter.css';
import {
  fetchCreateLetterInitialData,
  filterLetterTypesByFormTypeVawa,
  prepLetterFormData,
  processLetterInitialDataResults,
  showErrorToast,
  showSuccessToast,
} from './CreateLetterHelperFunctions';
import StandardParagraphSelector from './StandardParagraphSelector';
import { AppContext } from '../../AppProvider';
import { CheckBoxContainer, LabelContainer, StyledCheckbox, StyledHr, StyledLabel } from '../../components/designedComponents';
import { H1, H3 } from '../../components/typography';
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import { AdminFormProvider, useAdminFormContext } from '../../contexts/AdminFormContext';
import useMultiRequestLoading from '../../hooks/useMultiRequestLoading';
import { createLetter } from '../../http/letters';
import { fetchOrganization } from '../../http/organizations';
import LoadingFallback from '../../utils/LoadingFallback';
import CustomError from '../util/CustomError';

function CreateLetterContent() {
  const { currentUser } = useContext(AppContext);
  const { setAdminErrorMessage } = useAdminFormContext();

  const redirect = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm({ mode: 'all' });
  const [formTypeByCode, setFormTypeByCode] = useState([]);
  const [allLetterTypesList, setAllLetterTypeList] = useState([]);
  const [letterTypeDisplayList, setLetterTypeDisplayList] = useState([]);
  const [letterTypeId, setLetterTypeId] = useState('');
  const [letterCategoryHacIds, setLetterCategoryHacIds] = useState([]);
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [isLetterCategoryHacDisabled, setIsLetterCategoryHacDisabled] = useState(true);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const [isVawaCheckboxDisabled, setIsVawaCheckboxDisabled] = useState(false);
  const { loading, markFinished } = useMultiRequestLoading(1);
  const hasFetchedRef = useRef(false);
  const [letterTypeIdSelected, setLetterTypeIdSelected] = useState('');

  useEffect(() => {
    if (!location.state) {
      redirect('/search');
    }
  }, [location.state, redirect]);

  /**
   * Gets the list of form types, source systems, and filing types for initial page load
   */
  useEffect(() => {
    if (!location.state || !currentUser?.defaultOrg || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    const fetchInitialData = async () => {
      fetchCreateLetterInitialData(currentUser.defaultOrg, location.state.createLetterObj?.registration?.formTypeName)
        .then((results) => {
          const { data, errors } = processLetterInitialDataResults(results);

          if (data.letterTypeDisplayList) setLetterTypeDisplayList(data.allLetterTypes);
          if (data.allLetterTypes) setAllLetterTypeList(data.allLetterTypes);
          if (data.classPreferences) setClassPreferenceList(data.classPreferences);
          if (data.formType) setFormTypeByCode(data.formType);

          if (errors.length > 0) {
            const errorMessage = `There was an error retrieving: ${errors.join(', ')}`;
            showErrorToast(errorMessage);
          }
        })
        .finally(() => {
          markFinished();
        });
    };

    fetchInitialData();
  }, [currentUser.defaultOrg]);

  /**
   * Sets the state variables for the letter types and VAWA
   */
  useEffect(() => {
    const filteredLetterTypes = filterLetterTypesByFormTypeVawa(allLetterTypesList, formTypeByCode?.vawaCategory?.name);
    setLetterTypeDisplayList(filteredLetterTypes);

    if (formTypeByCode?.vawaCategory?.name === VAWA_ONLY) {
      setIsVawaChecked(true);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', true);
    } else if (formTypeByCode?.vawaCategory?.name === NON_VAWA_ONLY) {
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', false);
    } else {
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(false);
    }
  }, [allLetterTypesList, formTypeByCode, setValue]);

  /**
   * Creates the new letter
   * @param {form data} data
   */
  const onSubmit = async (data) => {
    const organization = await fetchOrganization(currentUser.defaultOrg);
    // eslint-disable-next-line no-param-reassign
    data.letterTypeId = letterTypeIdSelected;
    const preppedFormData = await prepLetterFormData(data, organization, location, currentUser);

    try {
      const response = await createLetter(preppedFormData);
      showSuccessToast('The draft letter was created successfully!');
      redirect(`/draft/${response.id}`);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  // HANDLERS
  const handleVawaCheckboxChange = (event) => {
    setIsVawaChecked(event.target.checked);
    if (event.target.checked === true) {
      const vawaLetterTypesArray = allLetterTypesList.filter(
        (item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
    } else {
      setLetterTypeDisplayList(allLetterTypesList);
    }
  };

  const handleLetterTypeChange = (letterTypeValues) => {
    // Parse the value as "id|vawaCategory"
    const [selectedLetterTypeId, selectedLetterTypeVawa] = letterTypeValues.split('|');
    setLetterTypeIdSelected(selectedLetterTypeId);

    // Only when formType is VAWA_NON_VAWA
    if (formTypeByCode?.vawaCategory?.name === VAWA_NON_VAWA) {
      if (selectedLetterTypeVawa === VAWA_ONLY) {
        setValue('vawa', true);
      } else if (selectedLetterTypeVawa === NON_VAWA_ONLY) {
        setValue('vawa', false);
      } else if (selectedLetterTypeVawa === VAWA_NON_VAWA && isVawaChecked) {
        setValue('vawa', true);
      } else if (selectedLetterTypeVawa === VAWA_NON_VAWA) {
        setValue('vawa', false);
      }
    }

    // Only when the associated letter type has a letter category of Request for Evidence
    const selectedLetterType = allLetterTypesList.find((letterType) => letterType.id === selectedLetterTypeId);

    if (
      selectedLetterType &&
      selectedLetterType?.letterCategory &&
      selectedLetterType?.letterCategory.name.toLowerCase() === 'request for evidence'
    ) {
      setLetterCategoryHacIds(selectedLetterType.letterCategory.letterCategoryHacs);
      setIsLetterCategoryHacDisabled(false);
    } else {
      setLetterCategoryHacIds([]);
      setIsLetterCategoryHacDisabled(true);
    }

    setClassPreferenceId('');
    setValue('classPreferenceId', '');
    setIsClassPreferenceDisabled(selectedLetterTypeId === '');
    setLetterTypeId(selectedLetterTypeId);
  };

  const handleClassPreference = (event) => {
    setClassPreferenceId(event.target.value);
  };

  if (!location.state) {
    return <>Redirecting...</>;
  }

  if (loading) return <LoadingFallback />;

  return (
    <form className=" mb-4">
      <div className="row mt-3">
        <div className="col-sm-1" />
        <div className="col-sm-10">
          <H1>Create New Letter</H1>
          <CustomError />
          <H3>{`Form ${location.state.createLetterObj.registration.formTypeName}`}</H3>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <CheckBoxContainer>
            <StyledCheckbox
              {...register('vawa-display')}
              type="checkbox"
              id="vawa-display"
              data-testid="vawa-display"
              checked={isVawaChecked}
              disabled={isVawaCheckboxDisabled}
              onChange={handleVawaCheckboxChange}
            />
            <LabelContainer>
              <StyledLabel htmlFor="vawa-display">Filter by VAWA</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>

          <input {...register('vawa')} type="hidden" id="vawa" data-testid="vawa" value={isVawaChecked ? 'true' : 'false'} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <label htmlFor="letterTypeId" className="col-form-label-lg required">
            Choose Letter Type
          </label>

          <select
            {...register('letterTypeId', { required: { value: true } })}
            id="letterTypeId"
            data-testid="letterTypeId"
            className="form-select form-select-lg"
            onChange={(e) => {
              handleLetterTypeChange(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Select Letter Type ---</option>
            {Array.isArray(letterTypeDisplayList) &&
              letterTypeDisplayList?.map((lettertype) => (
                <option key={lettertype.id} value={`${lettertype.id}|${lettertype.vawaCategory.name}`} data-testid={`letterTypeId_${lettertype.id}`}>
                  {lettertype.name}
                </option>
              ))}
          </select>
        </div>

        <div className="col-sm-5">
          <label htmlFor="classPreferenceId" className="col-form-label-lg">
            Choose Class Preference
          </label>

          <select
            {...register('classPreferenceId', { required: { value: false } })}
            id="classPreferenceId"
            data-testid="classPreferenceId"
            className="form-select form-select-lg"
            onChange={handleClassPreference}
            disabled={isClassPreferenceDisabled || classPreferenceList.length === 0}>
            <option value="">
              {classPreferenceList?.length === 0 ? '--- No Available Class Preferences ---' : '--- Select Class Preference ---'}
            </option>
            {Array.isArray(classPreferenceList) &&
              classPreferenceList?.map((cp) => (
                <option key={cp.id} value={cp.id} data-testid={`classPreferenceId_${cp.id}`}>
                  {cp.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <label htmlFor="letterCategoryHacId" className={`col-form-label-lg ${isLetterCategoryHacDisabled ? '' : 'required'}`}>
            Choose HAC Update
          </label>

          <select
            {...register('letterCategoryHacId', { required: { value: !isLetterCategoryHacDisabled } })}
            id="letterCategoryHacId"
            aria-required="true"
            data-testid="letterCategoryHacId"
            className="form-select form-select-lg"
            disabled={isLetterCategoryHacDisabled || letterCategoryHacIds.length === 0}>
            <option value="" data-testid="letterCategoryHacId_default">
              --- Select HAC ---
            </option>
            {Array.isArray(letterCategoryHacIds) &&
              letterCategoryHacIds.map((lch) => (
                <option key={lch.id} value={lch.id} data-testid={`letterCategoryHacId_${lch.id}`}>
                  {lch.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-10">
          <StandardParagraphSelector
            letterTypeId={letterTypeId}
            formTypeCode={location.state.createLetterObj.registration.formTypeName}
            register={register}
            setValue={setValue}
            classPreferenceId={classPreferenceId}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-10">
          <StyledHr />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-8">
          <DrButton data-testid="createLetterButton" onClick={() => handleSubmit(onSubmit)()} id="submit-button" disabled={!isValid}>
            Create Letter
          </DrButton>

          <DrButton data-testid="cancelButton" onClick={() => redirect('/search')} variant="danger">
            Cancel
          </DrButton>
        </div>
      </div>
    </form>
  );
}

export default function CreateLetter() {
  return (
    <AdminFormProvider>
      <CreateLetterContent />
    </AdminFormProvider>
  );
}
