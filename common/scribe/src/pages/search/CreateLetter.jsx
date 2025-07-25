import React, { useContext, useState, useEffect } from 'react';
import { toast, Flip } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import './CreateLetter.css';
import { DrButton } from '@druid/druid';
import { AppContext } from '../../AppProvider';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { useAdminFormContext, AdminFormProvider } from '../../contexts/AdminFormContext';
import { StyledHr, CheckBoxContainer, StyledCheckbox, LabelContainer, StyledLabel } from '../../components/designedComponents';
import CustomError from '../util/CustomError';
import { H1, H3 } from '../../components/typography';
import StandardParagraphSelector from './StandardParagraphSelector';

import useMultiRequestLoading from '../../hooks/useMultiRequestLoading';
import LoadingFallback from '../../utils/LoadingFallback';

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
  const [allLetterTypesList, setAllLetterTypeList] = useState([]);
  const [letterTypeDisplayList, setLetterTypeDisplayList] = useState([]);
  const [letterTypeId, setLetterTypeId] = useState('');
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const axios = createAuthenticatedAxios();
  const { loading, markFinished } = useMultiRequestLoading(2);

  const fetchData = (endpoint, params, setState, errorMessage, setState2 = null) => {
    axios
      .get(`${APP_API_ENDPOINT}/${endpoint}`, { params })
      .then((response) => {
        setState(response.data);
        if (setState2 !== null) {
          setState2(response.data);
        }
      })
      .catch(() => {
        toast.error(errorMessage, {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => markFinished());
  };

  useEffect(() => {
    if (!location.state) {
      redirect('/search');
      return;
    }

    const fetchInitialData = async () => {
      fetchData(
        'letter_types/letter_types_for_case',
        {
          form_type: location.state.createLetterObj?.registration?.formTypeName,
          organization_id: currentUser.defaultOrg,
        },
        setLetterTypeDisplayList,
        'There was an error retrieving the Letter Types list',
        setAllLetterTypeList
      );

      fetchData(
        'class_preferences/class_preferences_for_case',
        { form_type: location.state.createLetterObj?.registration?.formTypeName },
        setClassPreferenceList,
        'There was an error retrieving the Class Preferences list'
      );
    };

    fetchInitialData();
  }, []);

  const handleLetterTypeChange = (event) => {
    const selectedLetterTypeId = event.target.value;
    setClassPreferenceId('');
    setValue('classPreferenceId', '');
    setIsClassPreferenceDisabled(selectedLetterTypeId === '');
    setLetterTypeId(selectedLetterTypeId);
  };

  const handleClassPreference = (event) => {
    setClassPreferenceId(event.target.value);
  };

  const handleVawaCheckboxChange = (event) => {
    if (event.target.checked === true) {
      // display only VAWA letter types
      const vawaLetterTypesArray = allLetterTypesList.filter((item) => item.vawa !== false);
      setLetterTypeDisplayList(vawaLetterTypesArray);
    } else {
      // display all letter types
      setLetterTypeDisplayList(allLetterTypesList);
    }
    setIsVawaChecked(event.target.checked);
  };

  // Makes address into addressAttributes, etc
  const prepFormData = (data) => {
    const draft = JSON.parse(JSON.stringify(location.state.createLetterObj));
    const newPetitioner = draft.petitionerType;
    if (newPetitioner) {
      newPetitioner.addressAttributes = draft.petitionerType?.address;
      delete newPetitioner.address;
    }

    const newRepresentative = draft.representativeType;
    if (newRepresentative) {
      newRepresentative.addressAttributes = draft.representativeType?.address;
      delete newRepresentative.address;
    }

    const apiFriendlyHash = {
      registrationAttributes: draft.registration,
      applicantTypesAttributes: draft.applicantTypes.map((applicant) => {
        const newApplicant = { ...applicant };
        newApplicant.addressAttributes = newApplicant.address;
        delete newApplicant.address;
        return newApplicant;
      }),
      petitionerTypeAttributes: newPetitioner,
      representativeTypeAttributes: newRepresentative,
      standardParagraphIds: data.includedStdParagraphsInput,
      ...draft,
    };

    ['registration', 'applicantTypes', 'petitionerType', 'representativeType'].forEach((prop) => {
      delete apiFriendlyHash[prop];
    });

    apiFriendlyHash.letterTypeId = data.letterTypeId;
    apiFriendlyHash.organizationId = currentUser.defaultOrg;

    return apiFriendlyHash;
  };

  const onSubmit = async (data) => {
    const preppedFormData = prepFormData(data);
    axios
      .post(`${APP_API_ENDPOINT}/letters/`, preppedFormData)
      .then((response) => {
        toast.success('The draft letter was created successfully!', {
          position: 'top-center',
          autoClose: 1000,
          transition: Flip,
          theme: 'dark',
          toastId: 'toastCreateLetter',
        });
        redirect(`/draft/${response.data.id}`);
      })
      .catch((e) => setAdminErrorMessage(e?.response?.data?.error));
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
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('vawa')}
              type="checkbox"
              id="vawa"
              data-testid="vawa"
              checked={isVawaChecked}
              onChange={handleVawaCheckboxChange}
            />
            <LabelContainer>
              <StyledLabel htmlFor="vawa">Filter by VAWA</StyledLabel>
            </LabelContainer>
          </CheckBoxContainer>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-1" />
        <div className="col-sm-5">
          <label htmlFor="letterTypeId" className="col-form-label-lg required">
            Choose Letter Type
          </label>

          <select
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('letterTypeId', { required: { value: true } })}
            id="letterTypeId"
            data-testid="letterTypeId"
            className="form-select form-select-lg"
            onChange={handleLetterTypeChange}>
            <option value="">--- Select Letter Type ---</option>
            {letterTypeDisplayList.map((lettertype) => (
              <option key={lettertype.id} value={lettertype.id} data-testid={`letterTypeId_${lettertype.id}`}>
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
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('classPreferenceId', { required: { value: false } })}
            id="classPreferenceId"
            data-testid="classPreferenceId"
            className="form-select form-select-lg"
            onChange={handleClassPreference}
            disabled={isClassPreferenceDisabled || classPreferenceList.length === 0}>
            <option value="">
              {classPreferenceList.length === 0 ? '--- No Available Class Preferences ---' : '--- Select Class Preference ---'}
            </option>
            {classPreferenceList.map((cp) => (
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
