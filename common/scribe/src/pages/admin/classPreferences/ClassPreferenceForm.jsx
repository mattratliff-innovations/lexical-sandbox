/* eslint-disable react/jsx-curly-brace-presence */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { useForm } from 'react-hook-form';
import { DrButton } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import PropTypes from 'prop-types';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CustomError from '../../util/CustomError';
import useModalCheck from '../../util/customHooks/useModalCheck';
import UtilityModal from '../../util/UtilityModal';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import {
  StyledCheckbox,
  StyledLabel,
  StyledNote,
  StyledHr,
  LabelContainer,
  CheckBoxContainer,
  StyledInput,
  InputContainer,
  BtnContainer,
} from '../../../components/designedComponents';
import { H1, H2 } from '../../../components/typography';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';

export default function ClassPreferenceForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();
  const axios = createAuthenticatedAxios();

  const [curAlertType, setCurAlertType] = useState('info');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: useMemo(() => adminFormData, [adminFormData]),
  });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty);

  const isCreating = () => adminFormSettings.action === 'Create';

  useEffect(() => reset(adminFormData), [adminFormSettings, adminFormData]);

  const onSubmit = async (data) => {
    const axiosAction = isCreating() ? axios.post : axios.put;

    try {
      await axiosAction(`${APP_API_ENDPOINT}/class_preferences/${adminFormData.id}`, {
        class_preference: Object.assign(data, {
          form_type_id_list: data.formTypes.filter((formType) => formType.selected).map((selected) => selected.id),
        }),
      });
      toast.success(`Class Preference ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastclassPreferenceForm',
      });
      navigate('/admin/classPreferences');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(() => {
    setCurAlertType(isValid ? 'info' : 'error');
    handleSubmit(onSubmit)();
  }, [isValid, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Class Preference" />

      <H1 data-testid="header">{`${adminFormSettings.action} Class Preference`}</H1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-sm-8">
            <CustomError errorType={curAlertType} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="d-flex flex-column">
              <StyledLabel htmlFor="name" className="required">
                Class Preference Name
              </StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: {
                      value: true,
                      message: 'Class Preference Name is required.',
                    },
                  })}
                  type="text"
                  id="name"
                  aria-required="true"
                />

                {errors?.name?.message && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {errors?.name?.message}
                  </div>
                )}
              </InputContainer>
            </div>

            <div className="d-flex flex-column">
              <StyledLabel htmlFor="code" className="required">
                Class Preference Code
              </StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('code', {
                    required: {
                      value: true,
                      message: 'Class Preference Code is required.',
                    },
                  })}
                  type="text"
                  id="code"
                  aria-required="true"
                />

                {errors?.code?.message && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {errors?.code?.message}
                  </div>
                )}
              </InputContainer>
            </div>
          </div>

          <div className="col-sm-6 pt-4">
            <CheckBoxContainer className="mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('active')}
                type="checkbox"
                id="active"
              />
              <LabelContainer>
                <StyledLabel htmlFor="active">Class Preference is Active</StyledLabel>
                <StyledNote>Uncheck to hide throughout the system</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Form Types</H2>
            <ControlledComboBox typeaheadId="classPreferenceFormType" typeaheadLabel="Form Type(s)" control={control} name="formTypes" />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <BtnContainer>
            <DrButton className="btn-size" id="classPreferenceSubmit" data-testid="saveButton" onClick={handleButtonClick} isDisabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </DrButton>

            <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/classPreferences')} variant="secondary">
              Cancel
            </DrButton>
          </BtnContainer>
        </div>
      </form>
    </>
  );
}

ClassPreferenceForm.propTypes = {
  adminFormData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
  }),
};
