import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DrButton, DrAlert } from '@druid/druid';
import { useForm, FormProvider } from 'react-hook-form';
import FileInput from '../../../components/fileInput/FileInput';
import SignaturePreview from './SignaturePreview';
import './SignatoryModal.css';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import {
  StyledInput,
  StyledCheckbox,
  CheckBoxContainer,
  StyledLabel,
  BtnContainer,
  InputContainer,
  StyledNote,
} from '../../../components/designedComponents';
import { H1 } from '../../../components/typography';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

const SIGNATORY_NAME = 'signatoryName';
const SIGNATORY_TITLE = 'signatoryTitle';
export const SIGNATORY_IMAGES = 'signatoryImages';
const alertMessageDefault = 'All fields marked with a red asterisk (*) are required.';

export default function SignatoryModal({ signatureToEdit = null, showModal, setShowModal, onSubmit }) {
  const { adminFormData } = useAdminFormContext();

  const [alertMessage, setAlertMessage] = useState(alertMessageDefault);
  const [alertMessageType, setAlertMessageType] = useState('info');
  const [previewableImageData, setPreviewableImageData] = useState(null);
  const [signatoryName, setSignatoryName] = useState(null);
  const [signatoryTitle, setSignatoryTitle] = useState(null);

  const [activeMsg, setActiveMsg] = useState('Uncheck to hide within the system');
  const [isActDisabled, setIsActDisabled] = useState(false);

  const methods = useForm({ mode: 'onSubmit' });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = methods;

  const handleCloseModal = () => {
    setPreviewableImageData(null);
    setSignatoryName(null);
    setSignatoryTitle(null);
    setShowModal(false);
  };

  const setPreviewFile = (value) => {
    if (previewableImageData) URL.revokeObjectURL(previewableImageData);
    setPreviewableImageData(URL.createObjectURL(value));
  };

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name === SIGNATORY_NAME) setSignatoryName(values[SIGNATORY_NAME]);
      if (name === SIGNATORY_TITLE) setSignatoryTitle(values[SIGNATORY_TITLE]);
      if (name === SIGNATORY_IMAGES) {
        if (Array.isArray(values[SIGNATORY_IMAGES])) setPreviewFile(values[SIGNATORY_IMAGES][0]);
        else setPreviewableImageData(values[SIGNATORY_IMAGES]);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (!showModal) {
      reset();
      setAlertMessageType('info');
      setAlertMessage(alertMessageDefault);
      setIsActDisabled(false);
      setActiveMsg('Uncheck to hide within the system');
    } else {
      if (signatureToEdit?.default) {
        setIsActDisabled(true);
        setActiveMsg('Default signatory must remain active');
      }

      if (adminFormData?.organizationSignatures?.length < 1) {
        setIsActDisabled(true);
        setActiveMsg('First signatory is active and default');
      }

      setValue(SIGNATORY_NAME, signatureToEdit?.signatoryName);
      setValue(SIGNATORY_TITLE, signatureToEdit?.signatoryTitle);
      setValue(SIGNATORY_IMAGES, signatureToEdit?.signatureImageUrl);
      setValue('active', signatureToEdit?.active ? signatureToEdit?.active : true);
    }
  }, [showModal]);

  const validate = () => {
    trigger();
    if (isValid) {
      setAlertMessageType('info');
      setAlertMessage(alertMessageDefault);
      handleSubmit(onSubmit)();
    } else {
      setAlertMessageType('error');
      setAlertMessage(`Some required fields need to be updated. ${alertMessageDefault}`);
    }
  };

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer className="noMarginHeader" data-testid="signatoryModalHeader">
        <H1 className="noMarginHeader">{`${signatureToEdit?.id ? 'Edit' : 'Add'} Signatory here`}</H1>

        <XCloseBtn handleClose={handleCloseModal} />
      </HeaderContainer>

      <DrAlert type={alertMessageType} noCloseBtn alert={alertMessage} variant="slim" />

      <Body className="mb-4">
        <FormProvider
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 mb-1">
            <div className="row">
              <div className="col-lg-4">
                <InputContainer>
                  <StyledLabel htmlFor="signatoryName" className="required">
                    Signatory&apos;s Name
                  </StyledLabel>

                  <StyledNote className="mb-1">Exactly as it should appear on correspondence</StyledNote>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register(SIGNATORY_NAME, {
                      required: {
                        value: true,
                        message: 'Signatory name is required!',
                      },
                    })}
                    label="Signatory Name"
                    maxLength="100"
                    id={SIGNATORY_NAME}
                    data-testid={SIGNATORY_NAME}
                  />
                </InputContainer>

                {errors[SIGNATORY_NAME]?.message && (
                  <div className="text-danger mt-1" role="alert">
                    {errors[SIGNATORY_NAME]?.message}
                  </div>
                )}
              </div>

              <div className="col-3">
                <InputContainer>
                  <StyledLabel htmlFor={SIGNATORY_TITLE} className="required">
                    Signatory&apos;s Title
                  </StyledLabel>

                  <StyledNote className="mb-1" style={{ textWrap: 'nowrap' }}>
                    Exactly as it should appear on correspondence
                  </StyledNote>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register(SIGNATORY_TITLE, {
                      required: {
                        value: true,
                        message: 'Signatory title is required!',
                      },
                    })}
                    label="Signatory Title"
                    maxLength="100"
                    id={SIGNATORY_TITLE}
                    data-testid={SIGNATORY_TITLE}
                  />

                  {errors[SIGNATORY_TITLE]?.message && (
                    <div className="text-danger mt-1" role="alert">
                      {errors[SIGNATORY_TITLE]?.message}
                    </div>
                  )}
                </InputContainer>
              </div>

              <div className="col-4 ms-1" style={{ paddingTop: '38px' }}>
                <CheckBoxContainer style={{ alignItems: 'center' }}>
                  <StyledCheckbox
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('active')}
                    type="checkbox"
                    aria-label="Signatory is Active"
                    disabled={isActDisabled}
                  />

                  <InputContainer style={{ marginBottom: '0px' }}>
                    <StyledLabel>Signatory is Active</StyledLabel>
                    <StyledNote>{activeMsg}</StyledNote>
                  </InputContainer>
                </CheckBoxContainer>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-4">
                <InputContainer className="mb-2">
                  <StyledLabel htmlFor="signatureImage" className="required">
                    Signature Image
                  </StyledLabel>
                  <StyledNote>Please use a PNG or JPEG file</StyledNote>
                </InputContainer>

                <FileInput
                  accept={{ 'image/jpeg': [], 'image/png': [] }}
                  multiple={false}
                  required={!signatureToEdit?.id}
                  requiredErrorMessage="Signature image is required!"
                  name={SIGNATORY_IMAGES}
                  id={SIGNATORY_IMAGES}
                />

                {errors[SIGNATORY_IMAGES]?.message && (
                  <div className="text-danger mt-1" role="alert">
                    {errors[SIGNATORY_IMAGES]?.message}
                  </div>
                )}
              </div>
            </div>
          </form>
        </FormProvider>

        <div className="row mb-4">
          <div className="col-lg-4">
            <StyledLabel htmlFor="signaturePreview" className="col-form-label-lg">
              Preview Signature
            </StyledLabel>
            <div id="signaturePreview" data-testid="signaturePreview">
              <SignaturePreview
                id="signature-preview-image"
                signatureImageUrl={previewableImageData}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
              />
            </div>
          </div>
        </div>

        <BtnContainer>
          <DrButton
            variant="primary"
            data-testid="saveSignatoryButton"
            onClick={() => {
              validate();
            }}
            isDisabled={isSubmitting}
            className="btn-size">
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelSignatoryModalButton" onClick={handleCloseModal} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

SignatoryModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  signatureToEdit: PropTypes.shape({
    default: PropTypes.bool,
    active: PropTypes.bool,
    id: PropTypes.string,
    signatoryName: PropTypes.string,
    signatoryTitle: PropTypes.string,
    signatoryImages: PropTypes.string,
  }),
};
