/* eslint-disable require-loading-check-for-axios */
import React, { useContext, useState, useEffect } from 'react';
import { toast, Flip } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import './CreateLetter.css';
import { DrButton } from '@druid/druid';
import { AppContext } from '../../AppProvider';
import { useAdminFormContext, AdminFormProvider } from '../../contexts/AdminFormContext';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import CustomError from '../util/CustomError';
import { StyledHr, CheckBoxContainer, StyledCheckbox, LabelContainer, StyledLabel } from '../../components/designedComponents';
import { H1, H3 } from '../../components/typography';
import StandardParagraphSelector from './StandardParagraphSelector';

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
  const [formTypeList, setFormTypeList] = useState([]);
  const [formTypeCode, setFormTypeCode] = useState('');
  const [letterTypeDisplayList, setLetterTypeDisplayList] = useState([]);
  const [letterTypeId, setLetterTypeId] = useState('');
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [allLetterTypesList, setAllLetterTypeList] = useState([]);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const axios = createAuthenticatedAxios();

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

  useEffect(() => {
    if (!location.state) {
      redirect('/search');
      return;
    }

    if (currentUser?.defaultOrg) {
      axios
        .get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_organization`, {
          params: { organization_id: currentUser.defaultOrg },
        })
        .then((response) => setFormTypeList(response.data))
        .catch(() => {
          toast.error('There was an error retrieving the Form Types list', {
            position: 'top-center',
            transition: Flip,
            theme: 'dark',
          });
        });
    }
  }, [currentUser?.defaultOrg]);

  const fetchData = (endpoint, params, setState, errorMessage) => {
    axios
      .get(`${APP_API_ENDPOINT}/${endpoint}`, { params })
      .then((response) => {
        setState(response.data);
      })
      .catch(() => {
        toast.error(errorMessage, {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  };

  const displayVawaLetterTypes = (vawaCheckboxValue, allLetterTypes) => {
    if (vawaCheckboxValue === true) {
      // display only VAWA letter types
      const vawaLetterTypesArray = allLetterTypes.filter((item) => item.vawa !== false);
      setLetterTypeDisplayList(vawaLetterTypesArray);
    } else {
      // display all letter types
      setLetterTypeDisplayList(allLetterTypes);
    }
  };

  const loadLetterTypes = (params) => {
    axios
      .get(`${APP_API_ENDPOINT}/${'letter_types/letter_types_for_case'}`, { params })
      .then((response) => {
        setAllLetterTypeList(response.data);
        displayVawaLetterTypes(isVawaChecked, response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Letter Types list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  };

  const changeFormType = (formTypeName) => {
    setFormTypeCode(formTypeName);
    loadLetterTypes({ form_type: formTypeName, organization_id: currentUser.defaultOrg });

    fetchData(
      'class_preferences/class_preferences_for_case',
      { form_type: formTypeName },
      setClassPreferenceList,
      'There was an error retrieving the Class Preferences list'
    );
  };

  const onSubmit = async (data) => {
    const preppedFormData = {
      registrationAttributes: {
        id: null,
        receiptNumber: location.state.createLetterObj.registration.receiptNumber,
        formTypeName: data.formTypeName.replace(/-/g, ''),
      },
      id: null,
      letterTypeId: data.letterTypeId,
      organizationId: currentUser.defaultOrg,
      manualCreation: true,
      standardParagraphIds: data.includedStdParagraphsInput,
    };

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
      .catch((e) => {
        setAdminErrorMessage(e?.response?.data?.error);
      });
  };

  if (!location.state) {
    return <>Redirecting...</>;
  }

  const handleVawaCheckboxChange = (event) => {
    setIsVawaChecked(event.target.checked);
    displayVawaLetterTypes(event.target.checked, allLetterTypesList);
  };

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
          <label htmlFor="formTypeId" className="col-form-label-lg required">
            Choose Form Type
          </label>

          <select
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('formTypeName', { required: { value: true } })}
            id="formTypeId"
            data-testid="formTypeId"
            className="form-select form-select-lg"
            onChange={(e) => {
              changeFormType(e.target.value);
            }}>
            <option value="">--- Choose Form Type ---</option>
            {formTypeList.map((formtype) => (
              <option key={formtype.id} value={formtype.code} data-testid={`formTypeId_${formtype.id}`}>
                {formtype.name}
              </option>
            ))}
          </select>
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
            disabled={letterTypeDisplayList.length === 0}
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
