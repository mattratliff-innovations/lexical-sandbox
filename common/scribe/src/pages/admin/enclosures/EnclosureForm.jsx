import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DrButton } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import _ from 'lodash';
import UtilityModal from '../../util/UtilityModal';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import useModalCheck from '../../util/customHooks/useModalCheck';
import CustomError from '../../util/CustomError';
import {
  StyledCheckbox,
  CheckBoxContainer,
  LabelContainer,
  StyledLabel,
  StyledNote,
  StyledHr,
  BtnContainer,
  InputContainer,
  StyledInput,
} from '../../../components/designedComponents';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { H1, H2 } from '../../../components/typography';

export default function EnclosureForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();

  const [curAlertType, setCurAlertType] = useState('info');

  const defaultValues = useMemo(() => adminFormData, [adminFormData, adminFormData?.formsAndLetters]);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    formState: { errors, isSubmitted, isSubmitting, isDirty },
  } = useForm({ mode: 'onSubmit', defaultValues });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty);

  const isCreating = () => adminFormSettings.action === 'Create';

  useEffect(() => {
    reset(adminFormData);
  }, [adminFormData]);

  const onSubmit = async (data) => {
    const formsAndLetters = data?.formsAndLetters?.selected?.map((item) => ({
      id: item?.id,
      form_type_id: item?.form?.id,
      letter_type_id: item?.letter?.id,
    }));

    const axios = createAuthenticatedAxios();
    const axiosAction = isCreating() ? axios.post : axios.put;
    try {
      await axiosAction(`${APP_API_ENDPOINT}/enclosures/${adminFormData.id}`, {
        enclosure: {
          id: data.id,
          name: data.name,
          enclosure_form_letter_xrefs_attributes: formsAndLetters,
          active: data.active,
        },
      });
      toast.success(`Enclosure ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastEnclosureForm',
      });
      navigate('/admin/enclosures');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(async () => {
    await trigger();
    setCurAlertType(_.isEmpty(errors) ? 'info' : 'error');
    handleSubmit(onSubmit)();
  }, [errors, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Enclosures" />

      <H1 data-testid="enclosureFormHeading">{`${adminFormSettings.action} Enclosure`}</H1>

      <form>
        <div className="row">
          <div className="col-sm-8">
            <CustomError errorType={curAlertType} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="d-flex flex-column">
              <StyledLabel className="required" htmlFor="enclosure-name">
                Enclosure Name
              </StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: { value: true, message: 'A name is required.' },
                  })}
                  maxLength="100"
                  id="enclosure-name"
                  data-testid="enclosure-name"
                />

                <div className="text-danger" aria-live="polite" role="alert">
                  {' '}
                  {isSubmitted && errors?.name?.message}
                </div>
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
                <StyledLabel htmlFor="active">Enclosure is Active</StyledLabel>
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
            <H2>Associated Form Type Letter Types</H2>
            <ControlledComboBox typeaheadId="formsAndLetters" typeaheadLabel="Letter Type(s)" control={control} name="formsAndLetters" multiMode />
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

          <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/enclosures')} variant="secondary">
            Cancel
          </DrButton>
        </BtnContainer>
      </form>
    </>
  );
}
