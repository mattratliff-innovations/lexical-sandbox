import React, { useEffect, useState, useCallback, useMemo } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { DrButton } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import _ from 'lodash';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { H1, H2 } from '../../../components/typography';
import Lexical4Admin from '../../draft/scribeEditor/scribeDocument/lexical/lexical4Admin/Lexical4Admin';

export default function StandardParagraphForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();

  const [curAlertType, setCurAlertType] = useState('info');

  const defaultValues = useMemo(() => adminFormData, [adminFormData, adminFormData?.formsAndLetters, adminFormData?.formsAndClassPreferences]);

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
    trigger();
    reset(adminFormData);
  }, [adminFormData]);

  const onSubmit = async (data) => {
    const formsAndLetters = data?.formsAndLetters?.selected?.map((item) => ({
      id: item?.id,
      form_type_id: item?.form?.id,
      letter_type_id: item?.letter?.id,
    }));

    const formsAndClassPreferences = data?.formsAndClassPreferences?.selected?.map((item) => ({
      id: item?.id,
      form_type_id: item?.form?.id,
      class_preference_id: item?.classPreference?.id,
    }));

    const axios = createAuthenticatedAxios();
    const axiosAction = isCreating() ? axios.post : axios.put;
    try {
      await axiosAction(`${APP_API_ENDPOINT}/standard_paragraphs/${adminFormData.id}`, {
        standard_paragraph: {
          id: data.id,
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description,
          content: data.content,
          standard_paragraph_form_letter_xrefs_attributes: formsAndLetters,
          standard_paragraph_form_class_preference_xrefs_attributes: formsAndClassPreferences,
          active: data.active,
          locked: data.locked,
        },
      });
      toast.success(`Standard Paragraph ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastStandardParagraphForm',
      });
      navigate('/admin/standardparagraphs');
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
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Standard Paragraphs" />

      <H1 data-testid="standardParagraphFormHeading">{`${adminFormSettings.action} Standard Paragraph`}</H1>

      <form>
        <div className="row">
          <div className="col-sm-8">
            <CustomError errorType={curAlertType} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="d-flex flex-column">
              <StyledLabel className="required" htmlFor="standard-paragraph-name">
                Paragraph Name
              </StyledLabel>

              <InputContainer>
                <StyledInputUpperCase
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: { value: true, message: 'A name is required.' },
                  })}
                  maxLength="100"
                  id="standard-paragraph-name"
                  data-testid="standard-paragraph-name"
                  onKeyDown={(e) => {
                    if (!/^[A-Za-z0-9]*$/.test(e.key)) e.preventDefault();
                  }}
                />

                <div className="text-danger" aria-live="polite" role="alert">
                  {' '}
                  {isSubmitted && errors?.name?.message}
                </div>
              </InputContainer>
            </div>

            <div className="d-flex flex-column">
              <StyledLabel className="required" htmlFor="standard-paragraph-code">
                Paragraph Code
              </StyledLabel>

              <InputContainer>
                <StyledInputUpperCase
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('code', {
                    required: { value: true, message: 'A code is required.' },
                  })}
                  maxLength="100"
                  id="standard-paragraph-code"
                  data-testid="standard-paragraph-code"
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

            <div className="d-flex flex-column">
              <StyledLabel className="required" htmlFor="standard-paragraph-description">
                Paragraph Description
              </StyledLabel>

              <InputContainer>
                <StyledComment
                  as="textarea"
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('description', {
                    required: {
                      value: true,
                      message: 'A description is required.',
                    },
                  })}
                  id="standard-paragraph-description"
                  data-testid="standard-paragraph-description"
                />

                <div className="text-danger" aria-live="polite" role="alert">
                  {' '}
                  {isSubmitted && errors?.description?.message}
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
                <StyledLabel htmlFor="active">Paragraph is Active</StyledLabel>
                <StyledNote>Uncheck to hide throughout the system</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
            <CheckBoxContainer className="mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('locked')}
                type="checkbox"
                id="locked"
                data-testid="locked"
              />
              <LabelContainer>
                <StyledLabel htmlFor="locked">Paragraph is Locked</StyledLabel>
                <StyledNote>
                  <div>Check to make this paragraph uneditable in letters</div>
                  <div>(inserts variable instead of content)</div>
                </StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
            <H2>Paragraph Content</H2>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-8">
            <Lexical4Admin
              id="content"
              name="content"
              control={control}
              type="letter"
              initialValue={adminFormData.content}
              ariaLabel="Paragraph Content"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Letter Types</H2>
            <ControlledComboBox typeaheadId="formsAndLetters" typeaheadLabel="Letter Type(s)" control={control} name="formsAndLetters" multiMode />
          </div>

          <div className="col-sm-5">
            <H2>Associated Class Preferences</H2>
            <ControlledComboBox
              typeaheadId="formsAndClassPreferences"
              typeaheadLabel="Class Preference(s)"
              control={control}
              name="formsAndClassPreferences"
              multiMode
            />
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

          <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/standardparagraphs')} variant="secondary">
            Cancel
          </DrButton>
        </BtnContainer>
      </form>
    </>
  );
}
