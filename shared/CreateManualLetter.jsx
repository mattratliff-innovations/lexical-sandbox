/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-props-no-spreading */
import { useContext, useEffect, useRef, useState } from 'react';

import { DrButton } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import './CreateLetter.css';
import {
  changeFormTypeHelper,
  fetchCreateManualLetterInitialData,
  filingTypeDisplayName,
  filterLetterTypesByFormTypeVawa,
  prepManualLetterFormData,
  processManualLetterInitialDataResults,
  showErrorToast,
  showSuccessToast,
} from './CreateLetterHelperFunctions';
import StandardParagraphSelector from './StandardParagraphSelector';
import { AppContext } from '../../AppProvider';
import { CheckBoxContainer, LabelContainer, StyledCheckbox, StyledHr, StyledLabel } from '../../components/designedComponents';
import { H1, H3 } from '../../components/typography';
import { DEFAULT_FILING_TYPE_FOR_ELIS, ELIS, MAIN_PARENT_CODE } from '../../constants/selectOptions';
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import { AdminFormProvider, useAdminFormContext } from '../../contexts/AdminFormContext';
import useMultiRequestLoading from '../../hooks/useMultiRequestLoading';
import { createLetter } from '../../http/letters';
import { fetchOrganization } from '../../http/organizations';
import LoadingFallback from '../../utils/LoadingFallback';
import CustomError from '../util/CustomError';

function CreateManualLetterContent() {
  const { currentUser } = useContext(AppContext);
  const redirect = useNavigate();
  const location = useLocation();
  const { setAdminErrorMessage } = useAdminFormContext();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm({ mode: 'all' });
  const [sourceSystemList, setSourceSystemList] = useState([]);
  const [sourceSystemId, setSourceSystemId] = useState(''); // letter params uses id
  const [filingTypeList, setFilingTypeList] = useState([]);
  const [filingTypeName, setFilingTypeName] = useState('');
  const [formTypeList, setFormTypeList] = useState([]);
  const [formTypeCode, setFormTypeCode] = useState('');
  const [formTypeVawa, setFormTypeVawa] = useState('');
  const [letterTypeDisplayList, setLetterTypeDisplayList] = useState([]);
  const [letterTypeId, setLetterTypeId] = useState('');
  const [letterTypeIdSelected, setLetterTypeIdSelected] = useState('');
  // const [, setLetterTypeVawa] = useState('');
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [allLetterTypesList, setAllLetterTypeList] = useState([]);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const [isVawaCheckboxDisabled, setIsVawaCheckboxDisabled] = useState(false);
  const { loading, markFinished } = useMultiRequestLoading(1);
  const hasFetchedRef = useRef(false);

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
      fetchCreateManualLetterInitialData(currentUser.defaultOrg, MAIN_PARENT_CODE)
        .then((results) => {
          const { data, errors } = processManualLetterInitialDataResults(results);

          if (data.formTypes) setFormTypeList(data.formTypes);
          if (data.sourceSystems) setSourceSystemList(data.sourceSystems.data);
          if (data.filingTypes) setFilingTypeList(data.filingTypes.data);

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
    const filteredLetterTypes = filterLetterTypesByFormTypeVawa(allLetterTypesList, formTypeVawa);
    setLetterTypeDisplayList(filteredLetterTypes);

    if (formTypeVawa === VAWA_ONLY) {
      setIsVawaChecked(true);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', true);
    } else if (formTypeVawa === NON_VAWA_ONLY) {
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', false);
    } else {
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(false);
    }
  }, [formTypeVawa, allLetterTypesList, setValue]);

  /**
   * Creates the new letter
   * @param {form data} data
   */
  const onSubmit = async (data) => {
    const organization = await fetchOrganization(currentUser.defaultOrg);

    const preppedFormData = await prepManualLetterFormData(
      data,
      organization,
      location,
      formTypeCode,
      letterTypeIdSelected,
      currentUser,
      sourceSystemId,
      filingTypeName
    );

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
    const [selectedLetterTypeId, selectedLetterTypeVawa] = letterTypeValues.split('|');
    setLetterTypeIdSelected(selectedLetterTypeId);

    // Only when formType is VAWA_NON_VAWA
    if (formTypeVawa === VAWA_NON_VAWA) {
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

    setClassPreferenceId('');
    setValue('classPreferenceId', '');
    setIsClassPreferenceDisabled(selectedLetterTypeId === '');
    setLetterTypeId(selectedLetterTypeId);
  };

  const handleClassPreference = (event) => {
    setClassPreferenceId(event.target.value);
  };

  const handleSourceSystemChange = (sourceSystemValues) => {
    // sourceSystemValues format: id|child_code
    const [selectedSourceSystemId, selectedSourceSystemChildCode] = sourceSystemValues.split('|');
    setSourceSystemId(selectedSourceSystemId);

    const isELIS = selectedSourceSystemChildCode === ELIS;

    const filingTypeSelect = document.querySelector('#filingTypeId');
    if (isELIS) {
      filingTypeSelect.setAttribute('disabled', '');
      setFilingTypeName(DEFAULT_FILING_TYPE_FOR_ELIS);
      setValue('filingTypeId', DEFAULT_FILING_TYPE_FOR_ELIS);
    } else {
      setValue('filingTypeId', '');
      filingTypeSelect.removeAttribute('disabled');
    }
  };

  const handleFilingType = (filingTypeValue) => {
    setFilingTypeName(filingTypeValue);
  };

  const handleChangeFormType = async (formTypeValues) => {
    const result = await changeFormTypeHelper(formTypeValues, currentUser.defaultOrg, isVawaChecked);
    setFormTypeCode(result.selectedFormTypeCode);
    setFormTypeVawa(result.selectedFormTypeVawa);
    setAllLetterTypeList(result.allLetterTypes);
    setLetterTypeDisplayList(result.filteredLetterTypes);
    setClassPreferenceList(result.classPreferences);
  };

  if (!location.state) {
    return <>Redirecting...</>;
  }

  if (loading) return <LoadingFallback />;

  return (
    <form className="mb-4">
      <div className="row mt-3">
        <div className="col-sm-1" />
        <div className="col-sm-10">
          <H1>Create Letter Manually</H1>
          <H3>{`Receipt Number ${location.state.createLetterObj.registration.receiptNumber}`}</H3>
          <CustomError />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <label htmlFor="sourceSystemId" className="col-form-label-lg required">
            Select Source System
          </label>

          <select
            {...register('sourceSystemId', { required: { value: true } })}
            id="sourceSystemId"
            data-testid="sourceSystemId"
            className="form-select form-select-lg"
            onChange={(e) => {
              handleSourceSystemChange(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Select Source System ---</option>
            {Array.isArray(sourceSystemList) &&
              sourceSystemList.map((sourceSystem) => (
                <option
                  key={sourceSystem.id}
                  value={`${sourceSystem.id}|${sourceSystem.attributes.childCode}`}
                  data-testid={`sourceSystemId_${sourceSystem.id}`}>
                  {sourceSystem.attributes.childCode}
                </option>
              ))}
          </select>
        </div>

        <div className="col-sm-5">
          <label htmlFor="filingTypeId" className="col-form-label-lg required">
            Select Filing Type
          </label>

          <select
            {...register('filingTypeId', { required: { value: true } })}
            id="filingTypeId"
            data-testid="filingTypeId"
            className="form-select form-select-lg"
            onChange={(e) => {
              handleFilingType(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Select Filing Type ---</option>
            {Array.isArray(filingTypeList) &&
              filingTypeList.map((filingType) => (
                <option key={filingType.id} value={filingType.attributes.name} data-testid={`filingTypeId_${filingType.id}`}>
                  {filingTypeDisplayName(filingType.attributes.name)}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <label htmlFor="formTypeId" className="col-form-label-lg required">
            Choose Form Type
          </label>

          <select
            {...register('formTypeName', { required: { value: true } })}
            id="formTypeId"
            data-testid="formTypeId"
            className="form-select form-select-lg"
            onChange={(e) => {
              handleChangeFormType(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Choose Form Type ---</option>
            {Array.isArray(formTypeList) &&
              formTypeList.map((formtype) => (
                <option key={formtype.id} value={`${formtype.code}|${formtype.vawaCategory.name}`} data-testid={`formTypeId_${formtype.id}`}>
                  {formtype.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="row mt-4">
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
            disabled={letterTypeDisplayList.length === 0}
            onChange={(e) => {
              handleLetterTypeChange(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Select Letter Type ---</option>
            {Array.isArray(letterTypeDisplayList) &&
              letterTypeDisplayList.map((lettertype) => (
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
              {classPreferenceList.length === 0 ? '--- No Available Class Preferences ---' : '--- Select Class Preference ---'}
            </option>
            {Array.isArray(classPreferenceList) &&
              classPreferenceList.map((cp) => (
                <option key={cp.id} value={cp.id} data-testid={`classPreferenceId_${cp.id}`}>
                  {cp.name}
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
            formTypeCode={formTypeCode}
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

export default function CreateManualLetter() {
  return (
    <AdminFormProvider>
      <CreateManualLetterContent />
    </AdminFormProvider>
  );
}
