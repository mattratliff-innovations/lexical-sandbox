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
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import { AdminFormProvider, useAdminFormContext } from '../../contexts/AdminFormContext';
import useMultiRequestLoading from '../../hooks/useMultiRequestLoading';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../http/authenticatedAxios';
import fetchClassPreferencesForCase from '../../http/class_preferences';
import fetchFormTypeByCode from '../../http/form_types';
import { fetchHeader } from '../../http/headers';
import { fetchLetterTypesForForm } from '../../http/letter_types';
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
  const [letterCategoryHacIds, setLetterCaetgeoryHacIds] = useState([]);
  const [classPreferenceList, setClassPreferenceList] = useState([]);
  const [classPreferenceId, setClassPreferenceId] = useState('');
  const [isClassPreferenceDisabled, setIsClassPreferenceDisabled] = useState(true);
  const [isLetterCategoryHacDisabled, setIsLetterCategoryHacDisabled] = useState(true);
  const [isVawaChecked, setIsVawaChecked] = useState(false);
  const [isVawaCheckboxDisabled, setIsVawaCheckboxDisabled] = useState(false);
  const axios = createAuthenticatedAxios();
  const { loading, markFinished } = useMultiRequestLoading(2);

  useEffect(() => {
    if (!location.state) {
      redirect('/search');
      return;
    }

    const fetchInitialData = async () => {
      Promise.all([
        fetchLetterTypesForForm(currentUser.defaultOrg, location.state.createLetterObj?.registration?.formTypeName),
        fetchClassPreferencesForCase(location.state.createLetterObj?.registration?.formTypeName),
        fetchFormTypeByCode(location.state.createLetterObj?.registration?.formTypeName),
      ])
        .then((results) => {
          const errors = [];
          if (results[0].status === 'fulfilled') {
            console.log('SETTING THE LETTER TYPES = ', results[0].value);
            setLetterTypeDisplayList(results[0].value);
            setAllLetterTypeList(results[0].value);
          } else {
            errors.push('Letter Type list');
          }
          if (results[1].status === 'fulfilled') {
            setClassPreferenceList(results[1].value);
          } else {
            errors.push('Class Preferences list');
          }
          if (results[2].status === 'fulfilled') {
            setFormTypeByCode(results[2].value);
          } else {
            errors.push('Form Type');
          }
          if (errors.length > 0) {
            const errorMessage = `There was an error retrieving: ${errors.join(', ')}`;
            toast.error(errorMessage, {
              position: 'top-center',
              transition: Flip,
              theme: 'dark',
            });
          }
        })
        .finally(() => markFinished());
    };

    fetchInitialData();
  }, [currentUser.defaultOrg, location.state, redirect]);

  useEffect(() => {
    if (formTypeByCode?.vawaCategory?.name === VAWA_ONLY) {
      const vawaLetterTypesArray = allLetterTypesList.filter(
        (item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
      setIsVawaChecked(true);
      setIsVawaCheckboxDisabled(true);
      setValue('vawa', true);
    } else if (formTypeByCode?.vawaCategory?.name === NON_VAWA_ONLY) {
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
  }, [allLetterTypesList, formTypeByCode]);

  const handleVawaCheckboxChange = (event) => {
    if (event.target.checked === true) {
      const vawaLetterTypesArray = allLetterTypesList.filter(
        (item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA
      );
      setLetterTypeDisplayList(vawaLetterTypesArray);
    } else {
      setLetterTypeDisplayList(allLetterTypesList);
    }
    setIsVawaChecked(event.target.checked);
  };

  const handleLetterTypeChange = (event) => {
    const selectedLetterTypeId = event.target.value;

    // Only when formType is VAWA_NON_VAWA
    if (formTypeByCode?.vawaCategory?.name === VAWA_NON_VAWA) {
      const selectedLetterTypeObj = allLetterTypesList.filter((item) => item?.id === selectedLetterTypeId);
      if (selectedLetterTypeObj[0]?.vawaCategory?.name === VAWA_ONLY) {
        setValue('vawa', true);
      } else if (selectedLetterTypeObj[0]?.vawaCategory?.name === NON_VAWA_ONLY) {
        setValue('vawa', false);
      } else if (selectedLetterTypeObj[0]?.vawaCategory?.name === VAWA_NON_VAWA && isVawaChecked) {
        setValue('vawa', true);
      } else if (selectedLetterTypeObj[0]?.vawaCategory?.name === VAWA_NON_VAWA) {
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
      setLetterCaetgeoryHacIds(selectedLetterType.letterCategory.letterCategoryHacs);
      setIsLetterCategoryHacDisabled(false);
    } else {
      setLetterCaetgeoryHacIds([]);
      setIsLetterCategoryHacDisabled(true);
      setValue('letterCategoryHacId', '');
    }

    setClassPreferenceId('');
    setValue('classPreferenceId', '');
    setIsClassPreferenceDisabled(selectedLetterTypeId === '');
    setLetterTypeId(selectedLetterTypeId);
  };

  const handleClassPreference = (event) => {
    setClassPreferenceId(event.target.value);
  };

  const getHeaderFromOrganization = (organization) => {
    if (organization.headerId) return organization.headerId;

    const xrefs = organization.organizationHeaderLetterTypeXrefs.find((xref) => xref.letterType.id === letterTypeId);
    if (xrefs) {
      return xrefs.header.id;
    }
    return null;
  };

  // Makes address into addressAttributes, etc
  const prepFormData = async (data, organization) => {
    const draft = JSON.parse(JSON.stringify(location.state.createLetterObj));

    // assign the header based on the header used in the organization
    if (draft.headerId === null) draft.headerId = getHeaderFromOrganization(organization);

    draft.header = await fetchHeader(draft.headerId);
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
      filingTypeAttributes: draft.filingType,
      ...draft,
    };

    ['registration', 'applicantTypes', 'petitionerType', 'representativeType', 'filingType'].forEach((prop) => {
      delete apiFriendlyHash[prop];
    });

    apiFriendlyHash.letterTypeId = data.letterTypeId;
    apiFriendlyHash.organizationId = currentUser.defaultOrg;
    apiFriendlyHash.vawa = data.vawa;
    apiFriendlyHash.letterCategoryHacId = data.letterCategoryHacId;

    return apiFriendlyHash;
  };

  const onSubmit = async (data) => {
    const organization = await fetchOrganization(currentUser.defaultOrg);
    const preppedFormData = await prepFormData(data, organization);
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

          <input
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('vawa')}
            type="hidden"
            id="vawa"
            data-testid="vawa"
            value={isVawaChecked ? 'true' : 'false'}
          />
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
            {letterTypeDisplayList?.map((lettertype) => (
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
              {classPreferenceList?.length === 0 ? '--- No Available Class Preferences ---' : '--- Select Class Preference ---'}
            </option>
            {classPreferenceList?.map((cp) => (
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
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...register('letterCategoryHacId', { required: { value: !isLetterCategoryHacDisabled } })}
            id="letterCategoryHacId"
            aria-required="true"
            data-testid="letterCategoryHacId"
            className="form-select form-select-lg"
            disabled={isLetterCategoryHacDisabled || letterCategoryHacIds.length === 0}>
            <option value="" data-testid="letterCategoryHacId_default">
              --- Select HAC ---
            </option>
            {letterCategoryHacIds.map((lch) => (
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
