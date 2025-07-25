/* eslint-disable react/jsx-curly-brace-presence, require-loading-check-for-axios */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  StyledSelect,
  StyledOption,
} from '../../../components/designedComponents';
import { H1, H2 } from '../../../components/typography';
import Lexical4Admin from '../../draft/scribeEditor/scribeDocument/lexical/lexical4Admin/Lexical4Admin';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';

export default function LetterTypeForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();
  const axios = createAuthenticatedAxios();

  const [curAlertType, setCurAlertType] = useState('info');
  const [letterCategoriesList, setLetterCategoriesList] = useState([]);

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

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letter_categories`)
      .then((response) => {
        setLetterCategoriesList(response.data);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Letter Categories list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, []);

  const onSubmit = async (data) => {
    const axiosAction = isCreating() ? axios.post : axios.put;

    try {
      await axiosAction(`${APP_API_ENDPOINT}/letter_types/${adminFormData.id}`, {
        letter_type: Object.assign(data, {
          form_type_id_list: data.formTypes.filter((formType) => formType.selected).map((selected) => selected.id),
        }),
      });
      toast.success(`Letter Type ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastLetterTypeForm',
      });
      navigate('/admin/lettertypes');
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
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Letter Type" />

      <H1 data-testid="header">{`${adminFormSettings.action} Letter Type`}</H1>

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
                Letter Type Name
              </StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: {
                      value: true,
                      message: 'Letter Type Name is required.',
                    },
                  })}
                  type="text"
                  className="required"
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
              <StyledLabel htmlFor="letterCategoryId" className="required">
                Letter Category
              </StyledLabel>

              <InputContainer>
                <StyledSelect
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('letterCategoryId', {
                    required: {
                      value: true,
                      message: 'Letter Category is required.',
                    },
                  })}
                  id="letterCategoryId"
                  aria-required="true"
                  data-testid="letterCategoryId">
                  <StyledOption value="" />
                  {letterCategoriesList.map((letterCategory) => (
                    <StyledOption key={letterCategory.id} value={letterCategory.id} data-testid={`letterCategoryId_${letterCategory.id}`}>
                      {letterCategory.name}
                    </StyledOption>
                  ))}
                </StyledSelect>

                {errors?.letterCategoryId?.message && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {errors?.letterCategoryId?.message}
                  </div>
                )}
              </InputContainer>
            </div>

            <div className="d-flex flex-column">
              <StyledLabel htmlFor="title">Letter Type Title</StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('title')}
                  type="text"
                  id="title"
                />
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
                <StyledLabel htmlFor="active">Letter Type is Active</StyledLabel>
                <StyledNote>Uncheck to hide throughout the system</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>

            <CheckBoxContainer className="mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('signatureIncluded')}
                type="checkbox"
                id="signatureIncluded"
                data-testid="signatureIncluded"
              />
              <LabelContainer>
                <StyledLabel htmlFor="signatureIncluded" className="form-check-label">
                  Signature Included
                </StyledLabel>
                <StyledNote> Check to include a signature on the draft</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>

            <CheckBoxContainer className="mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('headerIncluded')}
                type="checkbox"
                id="headerIncluded"
                data-testid="headerIncluded"
              />
              <LabelContainer>
                <StyledLabel htmlFor="headerIncluded" className="form-check-label">
                  Header Included
                </StyledLabel>
                <StyledNote> Check to include a header on the draft</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>

            <CheckBoxContainer className="mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('vawa')}
                type="checkbox"
                id="vawa"
                data-testid="vawa"
              />
              <LabelContainer>
                <StyledLabel htmlFor="vawa">is VAWA</StyledLabel>
                <StyledNote>Check if this is a VAWA (Violence Against Women Act) letter type</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
            <H2>Margins</H2>
          </div>
        </div>

        <div className="d-flex flex-row">
          <div className="flex-column me-5">
            <StyledLabel htmlFor="marginTop" className="required">
              Margin Top
            </StyledLabel>

            <div className="d-flex flex-row align-items-center">
              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('marginTop', {
                  required: { value: true, message: 'Margin Top is required.' },
                })}
                id="marginTop"
                type="number"
                min="0"
                max="10"
                step="0.01"
                aria-required="true"
              />
              <span id="marginTopHelp" className="form-text ps-2">
                inches
              </span>
            </div>

            {errors?.marginTop?.message && (
              <div className="text-danger mt-1" aria-live="polite" role="alert">
                {errors?.marginTop?.message}
              </div>
            )}
          </div>

          <div className="flex-column me-5">
            <StyledLabel htmlFor="marginBottom" className="required">
              Margin Bottom
            </StyledLabel>

            <div className="d-flex flex-row align-items-center">
              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('marginBottom', {
                  required: {
                    value: true,
                    message: 'Margin Bottom is required.',
                  },
                })}
                id="marginBottom"
                type="number"
                min="0"
                max="10"
                step="0.01"
                aria-required="true"
              />
              <span id="marginBottomHelp" className="form-text ps-2">
                inches
              </span>
            </div>

            {errors?.marginBottom?.message && (
              <div className="text-danger mt-1" aria-live="polite" role="alert">
                {errors?.marginBottom?.message}
              </div>
            )}
          </div>

          <div className="flex-column me-5 ">
            <StyledLabel htmlFor="marginLeft" className="required">
              Margin Left
            </StyledLabel>
            <div className="d-flex flex-row align-items-center">
              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('marginLeft', {
                  required: {
                    value: true,
                    message: 'Margin Left is required.',
                  },
                })}
                id="marginLeft"
                type="number"
                min="0"
                max="10"
                step="0.01"
                aria-required="true"
              />
              <span id="marginLeftHelp" className="form-text ps-2">
                inches
              </span>
            </div>

            {errors?.marginLeft?.message && (
              <div className="text-danger mt-1" aria-live="polite" role="alert">
                {errors?.marginLeft?.message}
              </div>
            )}
          </div>

          <div className="flex-column me-5 ">
            <StyledLabel htmlFor="marginRight" className="required">
              Margin Right
            </StyledLabel>

            <div className="d-flex flex-row align-items-center">
              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('marginRight', {
                  required: {
                    value: true,
                    message: 'Margin Right is required.',
                  },
                })}
                id="marginRight"
                type="number"
                min="0"
                max="10"
                step="0.01"
                aria-required="true"
              />
              <span id="marginRightHelp" className="form-text ps-2">
                inches
              </span>
            </div>

            {errors?.marginRight?.message && (
              <div className="text-danger mt-1" aria-live="polite" role="alert">
                {errors?.marginRight?.message}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
            <H2>Letter Always Begins With</H2>
          </div>
        </div>

        <div className="row">
          <CheckBoxContainer className="col-sm-8">
            <StyledCheckbox
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('startsWithLocked')}
              type="checkbox"
              id="startsWithLocked"
              data-testid="startsWithLocked"
            />

            <LabelContainer>
              <StyledLabel htmlFor="startsWithLocked">Content Locked</StyledLabel>
              <StyledNote>Check to prevent users from editing this content on draft canvas</StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <Lexical4Admin id="startsWith" name="startsWith" type="letter" control={control} initialValue={adminFormData.startsWith} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
            <H2>Letter Always Ends With</H2>
          </div>
        </div>

        <div className="row">
          <CheckBoxContainer className="col-sm-8">
            <StyledCheckbox
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('endsWithLocked')}
              type="checkbox"
              id="endsWithLocked"
              data-testid="endsWithLocked"
            />

            <LabelContainer>
              <StyledLabel htmlFor="endsWithLocked">Content Locked</StyledLabel>
              <StyledNote>Check to prevent users from editing this content on draft canvas</StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <Lexical4Admin id="endsWith" name="endsWith" type="letter" control={control} initialValue={adminFormData.endsWith} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Form Type(s)</H2>
            <ControlledComboBox typeaheadId="letterTypeFormType" typeaheadLabel="Form Type(s)" control={control} name="formTypes" />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <BtnContainer>
            <DrButton className="btn-size" id="letterTypeSubmit" data-testid="saveButton" onClick={handleButtonClick} isDisabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </DrButton>

            <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/lettertypes')} variant="secondary">
              Cancel
            </DrButton>
          </BtnContainer>
        </div>
      </form>
    </>
  );
}

LetterTypeForm.propTypes = {
  adminFormData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    signatureIncluded: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    startsWith: PropTypes.string.isRequired,
    endsWith: PropTypes.string.isRequired,
    marginTop: PropTypes.string.isRequired,
    marginBottom: PropTypes.string.isRequired,
    marginLeft: PropTypes.string.isRequired,
    marginRight: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    startsWithLocked: PropTypes.bool.isRequired,
    endsWithLocked: PropTypes.bool.isRequired,
    letterCategoryId: PropTypes.string.isRequired,
    vawa: PropTypes.bool.isRequired,
  }),
};
