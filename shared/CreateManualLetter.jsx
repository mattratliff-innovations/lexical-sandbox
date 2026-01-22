/* eslint-disable react/jsx-props-no-spreading */
import { useContext, useEffect, useState } from 'react';

import { DrButton } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flip, toast } from 'react-toastify';

import './CreateLetter.css';
import StandardParagraphSelector from './StandardParagraphSelector';
import { AppContext } from '../../AppProvider';
import { CheckBoxContainer, LabelContainer, StyledCheckbox, StyledHr, StyledLabel } from '../../components/designedComponents';
import { H1, H3 } from '../../components/typography';
import { DEFAULT_FILING_TYPE_FOR_ELIS, ELIS, FILING_TYPE_DISPLAY_NAMES, MAIN_PARENT_CODE } from '../../constants/selectOptions';
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import { AdminFormProvider, useAdminFormContext } from '../../contexts/AdminFormContext';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../http/authenticatedAxios';
import { fetchHeader } from '../../http/headers';
import { fetchOrganization } from '../../http/organizations';
import CustomError from '../util/CustomError';

// HTTP helper functions following the pattern from CreateLetter.jsx
const axios = createAuthenticatedAxios();

const fetchFormTypesForOrganization = async (organizationId) => {
  const response = await axios.get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_organization`, {
    params: { organization_id: organizationId },
  });
  return response.data;
};

const fetchSourceSystems = async (parentCode) => {
  const response = await axios.get(`${APP_API_ENDPOINT}/source_systems`, {
    params: { parent_code: parentCode },
  });
  return response.data.data;
};

const fetchFilingTypes = async () => {
  const response = await axios.get(`${APP_API_ENDPOINT}/filing_types`);
  return response.data.data;
};

const fetchLetterTypesForCase = async (formType, organizationId) => {
  const response = await axios.get(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`, {
    params: { form_type: formType, organization_id: organizationId },
  });
  return response.data;
};

const fetchClassPreferencesForCase = async (formType) => {
  const response = await axios.get(`${APP_API_ENDPOINT}/class_preferences/class_preferences_for_case`, {
    params: { form_type: formType },
  });
  return response.data;
};

const createLetter = async (letterData) => {
  const response = await axios.post(`${APP_API_ENDPOINT}/letters/`, letterData);
  return response.data;
};

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
  const [letterTypeVawa, setLetterTypeVawa] = useState('');
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [allLetterTypesList, setAllLetterTypeList] = useState([]);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const [isVawaCheckboxDisabled, setIsVawaCheckboxDisabled] = useState(false);

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

  const filingTypeDisplayName = (value) => {
    const expectedFilingType = Object.keys(FILING_TYPE_DISPLAY_NAMES).find((type) => type === value);

    if (expectedFilingType) {
      return FILING_TYPE_DISPLAY_NAMES[value];
    }

    return value;
  };

  const handleLetterTypeChange = (letterTypeValues) => {
    const [selectedLetterTypeId, selectedLetterTypeVawa] = letterTypeValues.split('|');
    setLetterTypeIdSelected(selectedLetterTypeId);
    setLetterTypeVawa(selectedLetterTypeVawa);

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

  useEffect(() => {
    if (!location.state) {
      redirect('/search');
      return;
    }

    if (currentUser?.defaultOrg) {
      const fetchInitialData = async () => {
        Promise.allSettled([fetchFormTypesForOrganization(currentUser.defaultOrg), fetchSourceSystems(MAIN_PARENT_CODE), fetchFilingTypes()]).then(
          (results) => {
            const errors = [];
            if (results[0].status === 'fulfilled') {
              setFormTypeList(results[0].value);
            } else {
              errors.push('Form Types list');
            }
            if (results[1].status === 'fulfilled') {
              setSourceSystemList(results[1].value);
            } else {
              errors.push('Source Systems list');
            }
            if (results[2].status === 'fulfilled') {
              setFilingTypeList(results[2].value);
            } else {
              errors.push('Filing Types list');
            }
            if (errors.length > 0) {
              const errorMessage = `There was an error retrieving: ${errors.join(', ')}`;
              toast.error(errorMessage, {
                position: 'top-center',
                transition: Flip,
                theme: 'dark',
              });
            }
          }
        );
      };

      fetchInitialData();
    }
  }, [currentUser?.defaultOrg]);

  const displayVawaLetterTypes = (vawaCheckboxValue, allLetterTypes) => {
    if (vawaCheckboxValue === true) {
      const vawaLetterTypesArray = allLetterTypes.filter(
        (item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
    } else {
      setLetterTypeDisplayList(allLetterTypes);
    }
  };

  const loadLetterTypes = async (formType, organizationId) => {
    try {
      const data = await fetchLetterTypesForCase(formType, organizationId);
      setAllLetterTypeList(data);
      displayVawaLetterTypes(isVawaChecked, data);
    } catch (error) {
      toast.error('There was an error retrieving the Letter Types list', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    }
  };

  const changeFormType = async (formTypeValues) => {
    const [selectedFormTypeCode, selectedFormTypeVawa] = formTypeValues.split('|');
    setFormTypeCode(selectedFormTypeCode);
    setFormTypeVawa(selectedFormTypeVawa);
    loadLetterTypes(selectedFormTypeCode, currentUser.defaultOrg);

    try {
      const data = await fetchClassPreferencesForCase(selectedFormTypeCode);
      setClassPreferenceList(data);
    } catch (error) {
      toast.error('There was an error retrieving the Class Preferences list', {
        position: 'top-center',
        transition: Flip,
        theme: 'dark',
      });
    }
  };

  useEffect(() => {
    if (formTypeVawa === VAWA_ONLY) {
      const vawaLetterTypesArray = allLetterTypesList.filter(
        (item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
      setIsVawaChecked(true);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', true);
    } else if (formTypeVawa === NON_VAWA_ONLY) {
      const vawaLetterTypesArray = allLetterTypesList.filter(
        (item) => item.vawaCategory?.name === NON_VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', false);
    } else {
      setLetterTypeDisplayList(allLetterTypesList);
      setIsVawaChecked(false);
      setIsVawaCheckboxDisabled(false);
    }
  }, [formTypeVawa, allLetterTypesList]);

  const getHeaderFromOrganization = (organization) => {
    if (organization.headerId) return organization.headerId;

    const xrefs = organization.organizationHeaderLetterTypeXrefs.find((xref) => xref.letterType.id === letterTypeId);
    if (xrefs) {
      return xrefs.header.id;
    }
    return null;
  };

  const onSubmit = async (data) => {
    const organization = await fetchOrganization(currentUser.defaultOrg);
    data.headerId = getHeaderFromOrganization(organization);
    data.header = await fetchHeader(data.headerId);

    const preppedFormData = {
      registrationAttributes: {
        id: null,
        receiptNumber: location.state.createLetterObj.registration.receiptNumber,
        formTypeName: formTypeCode,
      },
      id: null,
      headerId: data.headerId,
      header: data.header,
      letterTypeId: letterTypeIdSelected,
      organizationId: currentUser.defaultOrg,
      manualCreation: true,
      standardParagraphIds: data.includedStdParagraphsInput,
      vawa: data.vawa,
      sourceSystemId,
      filingTypeAttributes: {
        name: filingTypeName,
      },
    };

    try {
      const response = await createLetter(preppedFormData);
      toast.success('The draft letter was created successfully!', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastCreateLetter',
      });
      redirect(`/draft/${response.id}`);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
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
            {sourceSystemList.map((sourceSystem) => (
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
            {filingTypeList.map((filingType) => (
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
              changeFormType(e.target.value);
            }}
            aria-required="true">
            <option value="">--- Choose Form Type ---</option>
            {formTypeList.map((formtype) => (
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
            {letterTypeDisplayList.map((lettertype) => (
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
