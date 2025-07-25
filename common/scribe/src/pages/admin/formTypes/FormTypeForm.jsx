import React, { useEffect, useState, useCallback, useMemo } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { DrButton } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import _ from 'lodash';
import useModalCheck from '../../util/customHooks/useModalCheck';
import CustomError from '../../util/CustomError';
import UtilityModal from '../../util/UtilityModal';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import {
  StyledComment,
  StyledCheckbox,
  CheckBoxContainer,
  LabelContainer,
  StyledLabel,
  StyledNote,
  StyledHr,
  BtnContainer,
  InputContainer,
  StyledInputUpperCase,
} from '../../../components/designedComponents';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import { H1, H2 } from '../../../components/typography';

const RETRIEVING_LETTER_TYPES_ERRORS = 'Encountered an unknown error retrieving Letter Types.';

function FormTypeForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();

  const [curAlertType, setCurAlertType] = useState('info');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    reset,
    formState: { errors, isSubmitted, isSubmitting, isDirty },
  } = useForm({
    mode: 'all',
    defaultValues: useMemo(() => adminFormData, [adminFormData]),
  });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty);

  const isCreating = () => adminFormSettings.action === 'Create';

  useEffect(() => {
    trigger();
    reset(adminFormData);
  }, [adminFormSettings, adminFormData]);

  const onSubmit = async (data) => {
    const axios = createAuthenticatedAxios();
    const axiosAction = isCreating() ? axios.post : axios.put;
    try {
      await axiosAction(`${APP_API_ENDPOINT}/form_types/${adminFormData.id}`, {
        form_type: {
          name: data.name,
          code: data.code,
          description: data.description,
          active: data.active,
          letter_type_id_list: data.letterTypes.filter((letterType) => letterType.selected).map((selected) => selected.id),
        },
      });
      toast.success(`Form Type ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastFormTypeForm',
      });
      navigate('/admin/formtypes');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(() => {
    setCurAlertType(_.isEmpty(errors) ? 'info' : 'error');
    handleSubmit(onSubmit)();
  }, [errors, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Form Types" />

      <H1 data-testid="formTypeFormHeading">{`${adminFormSettings.action} Form Type`}</H1>

      <div className="col-sm-8">
        <CustomError errorType={curAlertType} />
      </div>

      <form className="mt-4">
        <div className="row">
          <div className="col-md-3">
            <StyledLabel className="required" htmlFor="form-type-name">
              Form Type Name
            </StyledLabel>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <InputContainer>
              <StyledInputUpperCase
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('name', {
                  required: { value: true, message: 'A name is required.' },
                  pattern: {
                    value: /^[A-Za-z]*-[0-9]*[A-Za-z\s]*[A-Za-z0-9]$/,
                    message: "Formats: 'G-845' or 'I-129F' or 'EOIR-29' or 'G-845 SUPPLEMENT'",
                  },
                  onChange: (e) => {
                    const alphaNumericValueUcase = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    setValue('code', alphaNumericValueUcase, {
                      shouldValidate: true,
                    });
                  },
                })}
                maxLength="35"
                id="form-type-name"
                data-testid="form-type-name"
              />

              <div className="text-danger" aria-live="polite" role="alert">
                {' '}
                {isSubmitted && errors?.name?.message}
              </div>
            </InputContainer>
          </div>

          <CheckBoxContainer className="col-sm-6">
            <StyledCheckbox
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('active')}
              type="checkbox"
              id="active"
            />

            <LabelContainer>
              <StyledLabel htmlFor="active">Form Type is Active</StyledLabel>
              <StyledNote>Uncheck to hide throughout the system</StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <InputContainer>
              <StyledLabel className="required" htmlFor="form-type-code">
                System Code
              </StyledLabel>

              <StyledInputUpperCase
                // The scheme set here must match the API side within letter_types_for_case method.
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('code', {
                  required: {
                    value: true,
                    message: 'A system code is required.',
                  },
                })}
                maxLength="35"
                id="form-type-code"
                onKeyDown={(e) => {
                  if (!/^[A-Za-z0-9]*$/.test(e.key)) e.preventDefault();
                }}
              />

              <div className="text-danger" aria-live="polite" role="alert">
                {' '}
                {isSubmitted && errors?.code?.message}
              </div>
            </InputContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <InputContainer>
              <StyledLabel htmlFor="form-type-description">Form Type Description</StyledLabel>

              <StyledComment
                as="textarea"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('description')}
                id="form-type-description"
              />
            </InputContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Letter Type(s)</H2>
            <ControlledComboBox typeaheadId="letterTypeFormType" typeaheadLabel="Letter Type(s)" control={control} name="letterTypes" />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <BtnContainer>
          <DrButton className="btn-size" data-testid="saveButton" id="create-button" onClick={handleButtonClick} isDisabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/formtypes')} variant="secondary">
            Cancel
          </DrButton>
        </BtnContainer>
      </form>
    </>
  );
}
export { FormTypeForm, RETRIEVING_LETTER_TYPES_ERRORS };
