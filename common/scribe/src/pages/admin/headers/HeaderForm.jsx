import React, { useState, useEffect, useCallback, useMemo } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip, ToastContainer } from 'react-toastify';
import PropTypes from 'prop-types';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DrButton } from '@druid/druid';
import CustomError from '../../util/CustomError';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import useModalCheck from '../../util/customHooks/useModalCheck';
import UtilityModal from '../../util/UtilityModal';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { H1, H2 } from '../../../components/typography';
import {
  StyledHr,
  BtnContainer,
  StyledInput,
  StyledNote,
  LabelContainer,
  StyledLabel,
  StyledCheckbox,
  CheckBoxContainer,
} from '../../../components/designedComponents';
import Lexical4Admin from '../../draft/scribeEditor/scribeDocument/lexical/lexical4Admin/Lexical4Admin';
import useContextReady from '../../../hooks/useContextReady';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function HeaderForm({ formValues = {} }) {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const [curAlertType, setCurAlertType] = useState('info');

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitted, isSubmitting, isDirty },
    control,
  } = useForm({
    mode: 'onSubmit',
    defaultValues: useMemo(() => formValues, [formValues]),
  });
  useEffect(() => {
    reset(formValues);
  }, [formValues]);

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty);

  const onSubmit = async (data) => {
    const axios = createAuthenticatedAxios();
    const axiosAction = adminFormSettings.action === 'Create' ? axios.post : axios.put;
    try {
      await axiosAction(`${APP_API_ENDPOINT}/headers/${data.id}`, {
        header: { ...data },
      });
      toast.success(`Header ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastHeaderForm',
      });
      navigate('/admin/headers');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(() => {
    setCurAlertType(isValid ? 'info' : 'error');
    handleSubmit(onSubmit)();
  }, [isValid, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => {
    setHandleButtonClick(() => handleButtonClick);
  }, [handleButtonClick]);

  // Only flips to 'ready' once adminFormSettings.action is no longer undefined/null
  const contextReady = useContextReady(adminFormSettings.action);

  // Compose a single loading boolean based on context readiness
  const loading = !contextReady;

  if (loading) return <LoadingFallback />;

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Letter Header" />
      <ToastContainer />
      <form>
        <H1 data-testid="header">{`${adminFormSettings.action} Letter Header`}</H1>

        <div className="mb-3 col-sm-8">
          <CustomError errorType={curAlertType} />
        </div>

        <div className="row">
          <div className="col-sm-4">
            <StyledLabel className="required" htmlFor="header-name">
              Letter Header Name
            </StyledLabel>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4 d-flex flex-column">
            <StyledInput
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('name', {
                required: { value: true, message: 'A name is required!' },
                pattern: {
                  value: /^[a-z0-9]([\w\-\s?])+$/i,
                  message: 'Only alphanumeric characters, dashes, spaces, and underscores are allowed.',
                },
              })}
              label="Name"
              maxLength="100"
              id="header-name"
              placeholder="ex: TSC Header"
            />

            <div className="text-danger mt-1" aria-live="polite" role="alert">
              {' '}
              {isSubmitted && errors?.name?.message}
            </div>
          </div>

          <CheckBoxContainer className="col-sm-4">
            <StyledCheckbox
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('active')}
              type="checkbox"
              id="active"
            />

            <LabelContainer>
              <StyledLabel htmlFor="active">Header is Active</StyledLabel>

              <StyledNote>Uncheck to hide throughout the system</StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        <StyledHr className="col-sm-8" />

        <H2>Custom Header Content</H2>

        <p className="col-sm-8">
          The following variables are available for use: [[[RECIPIENT_ADDRESS]]], [[[ORGANIZATION_ADDRESS]]], [[[ORGANIZATION_NAME]]], [[[DHS_SEAL]]],
          [[[LETTER_DATE]]], [[[A_NUMBER_BARCODE]]], [[[RECEIPT_NUMBER_BARCODE]]], [[[RECEIPT_NUMBER]]], [[[A_NUMBER]]].
        </p>

        <div className="row">
          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR1C1"
              name="row1Col1"
              type="header"
              control={control}
              initialValue={formValues.row1Col1}
              ariaLabel="Header Box Top Left"
            />
          </div>

          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR1C2"
              name="row1Col2"
              type="header"
              control={control}
              initialValue={formValues.row1Col2}
              ariaLabel="Header Box Top Right"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR2C1"
              name="row2Col1"
              type="header"
              control={control}
              initialValue={formValues.row2Col1}
              ariaLabel="Header Box Middle Left"
            />
          </div>

          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR2C2"
              name="row2Col2"
              type="header"
              control={control}
              initialValue={formValues.row2Col2}
              ariaLabel="Header Box Middle Right"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR3C1"
              name="row3Col1"
              type="header"
              control={control}
              initialValue={formValues.row3Col1}
              ariaLabel="Header Box Bottom Left"
            />
          </div>

          <div className="col-sm-4">
            <Lexical4Admin
              id="contentR3C2"
              name="row3Col2"
              type="header"
              control={control}
              initialValue={formValues.row3Col2}
              ariaLabel="Header Box Bottom Right"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <BtnContainer>
          <DrButton className="btn-size" data-testid="createButton" id="create-button" onClick={handleButtonClick} isDisabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton className="btn-size" data-testid="cancelButton" variant="secondary" onClick={() => navigate('/admin/headers')}>
            Cancel
          </DrButton>
        </BtnContainer>
      </form>
    </>
  );
}

HeaderForm.propTypes = {
  formValues: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    row1Col1: PropTypes.string.isRequired,
    row1Col2: PropTypes.string.isRequired,
    row2Col1: PropTypes.string.isRequired,
    row2Col2: PropTypes.string.isRequired,
    row3Col1: PropTypes.string.isRequired,
    row3Col2: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
  }),
};
