import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DrButton, DrIcon } from '@druid/druid';
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
  StyledLabel2,
} from '../../../components/designedComponents';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { H1, H2 } from '../../../components/typography';
import AddContentToDocumentModal from './AddContentToDocumentModal';
import { GeneratePdfObject } from '../../draft/LetterUtil';
import * as PreviewUtil from '../../draft/preview/PreviewUtils';
import useContextReady from '../../../hooks/useContextReady';
import LoadingFallback from '../../../utils/LoadingFallback';

export const PAGE_BREAK = '<div style="break-after: page;"></div>';

export default function SupportingDocumentForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();
  const navigate = useNavigate();

  const [curAlertType, setCurAlertType] = useState('info');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [supportingDocumentToEdit, setSupportingDocumentToEdit] = useState({});
  const [pdfData, setPdfData] = useState(null);
  const [inlinePdfScale, setInlinePdfScale] = useState(null);
  // Get the root CSS variable for inlinePDF scaling at different resolution breakpoints
  useEffect(() => {
    setInlinePdfScale(PreviewUtil.pdfScale());
  }, []);

  const axios = createAuthenticatedAxios();

  const defaultValues = useMemo(() => adminFormData, [adminFormData, adminFormData?.formsAndLetters]);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    formState: { errors, isSubmitted, isSubmitting, isDirty },
  } = useForm({ mode: 'onSubmit', defaultValues });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty && !showAddContentModal);

  const isCreating = () => adminFormSettings && adminFormSettings.action === 'Create';

  const isUpdating = () => adminFormSettings && adminFormSettings.action === 'Edit';

  const isContentExist = Array.isArray(adminFormData.supportingDocumentSections) && adminFormData.supportingDocumentSections.length > 0;

  useEffect(() => {
    reset(adminFormData);
  }, [adminFormData]);

  const buildApiData = (data) => {
    const formsAndLetters = data?.formsAndLetters?.selected?.map((item) => ({
      id: item?.id,
      form_type_id: item?.form?.id,
      letter_type_id: item?.letter?.id,
    }));

    return {
      supporting_document: {
        id: data.id,
        name: data.name,
        margin_top: data.marginTop,
        margin_bottom: data.marginBottom,
        margin_left: data.marginLeft,
        margin_right: data.marginRight,
        supporting_document_form_letter_xrefs_attributes: formsAndLetters,
        active: data.active,
        prepend: data.prepend,
        courtesy: data.courtesy,
      },
    };
  };

  const onSubmitCreate = async (data) => {
    try {
      const response = await axios.post(`${APP_API_ENDPOINT}/supporting_documents/`, buildApiData(data));

      setSupportingDocumentToEdit(response.data);
      setShowAddContentModal(true);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitEdit = async (data) => {
    try {
      await axios.put(`${APP_API_ENDPOINT}/supporting_documents/${adminFormData.id}`, buildApiData(data));
      toast.success(`Supporting Document ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastSupportingDocumentForm',
      });
      navigate('/admin/supportingdocuments');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(async () => {
    await trigger();
    setCurAlertType(_.isEmpty(errors) ? 'info' : 'error');

    if (isCreating()) handleSubmit(onSubmitCreate)();
    else handleSubmit(onSubmitEdit)();
  }, [errors, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  // PDF generation
  const generatePdf = () => {
    const supportingDocuments = [adminFormData];

    const { prependSupportingDocuments, appendSupportingDocuments } = PreviewUtil.splitSupportingDocuments(supportingDocuments, { mainCopy: true });

    const htmlDocumentFinalPageBreak = [...prependSupportingDocuments, ...appendSupportingDocuments].join(PAGE_BREAK);

    PreviewUtil.pdfGenerationCall(htmlDocumentFinalPageBreak).then((response) => {
      if (response && response.data) {
        if (pdfData) URL.revokeObjectURL(pdfData);

        const urlPdf = URL.createObjectURL(response.data);
        setPdfData(urlPdf);
      }
    });
  };

  useEffect(() => {
    if (!isContentExist) return;
    if (!adminFormData) return;

    generatePdf();
  }, [isContentExist, adminFormData]);

  // Only flips to 'ready' once adminFormData is no longer undefined/null
  const contextReady = useContextReady(adminFormData);

  // Compose a single loading boolean based on context readiness
  const loading = !contextReady;

  if (loading) return <LoadingFallback />;

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Supporting Documents" />

      <H1 data-testid="supportingDocumentFormHeading">{`${adminFormSettings.action} Supporting Document`}</H1>

      <form>
        <div className="row">
          <div className="col-sm-8">
            <CustomError errorType={curAlertType} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="d-flex flex-column">
              <StyledLabel className="required" htmlFor="supporting-document-name">
                Supporting Document Name
              </StyledLabel>

              <InputContainer>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: { value: true, message: 'A name is required.' },
                  })}
                  maxLength="100"
                  id="supporting-document-name"
                  data-testid="supporting-document-name"
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
                <StyledLabel htmlFor="active">Supporting Document is Active</StyledLabel>
                <StyledNote>Uncheck to hide throughout the system</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>

            <CheckBoxContainer className="mt-3 mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('prepend')}
                type="checkbox"
                id="prepend"
              />
              <LabelContainer>
                <StyledLabel htmlFor="prepend">Place Before Letter</StyledLabel>
                <StyledNote>Check to prepend to the letter</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>

            <CheckBoxContainer className="mt-3 mb-3">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('courtesy')}
                type="checkbox"
                id="courtesy"
              />
              <LabelContainer>
                <StyledLabel htmlFor="courtesy">Include with Courtesy Copy</StyledLabel>
                <StyledNote>Check to include with courtesy copies</StyledNote>
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

        <div className="row">
          <div className="d-flex flex-row">
            <div className="flex-column me-5">
              <StyledLabel htmlFor="marginTop" className="required">
                Margin Top
              </StyledLabel>

              <div className="d-flex flex-row align-items-center">
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('marginTop', {
                    required: {
                      value: true,
                      message: 'Margin Top is required!',
                    },
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
                      message: 'Margin Bottom is required!',
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
                      message: 'Margin Left is required!',
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
                      message: 'Margin Right is required!',
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
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Letter Type(s)</H2>
            <ControlledComboBox typeaheadId="formsAndLetters" typeaheadLabel="Letter Type(s)" control={control} name="formsAndLetters" multiMode />
          </div>
        </div>

        {isUpdating() && (
          <>
            <div className="row">
              <div className="col-sm-5">
                <StyledHr />
              </div>
            </div>
            {isContentExist && (
              <div className="row">
                <div className="col-sm-8 ">
                  <div className="mb-4">
                    <DrButton
                      data-testid="editContentButton"
                      styles={{
                        button: { borderColor: 'black', marginRight: '8px' },
                      }}
                      variant="secondary"
                      size="small"
                      id="edit-button"
                      ariaLabel="Edit Content"
                      onClick={() => {
                        navigate(`/admin/supportingdocuments/content/${adminFormData.id}`);
                      }}>
                      <DrIcon iconName="pen-to-square" color="black" />
                    </DrButton>
                    <StyledLabel2>Edit Supporting Document Content</StyledLabel2>
                  </div>
                </div>
                <div className="col-sm-8 portraitUsLetterObject p-0 m-0 ms-3">
                  {pdfData && <GeneratePdfObject pdfData={pdfData} inlinePdfScale={inlinePdfScale} />}
                </div>
              </div>
            )}
            {!isContentExist && (
              <>
                <div className="row">
                  <div className="col-sm-8 ">
                    <div className="mb-4">
                      <H2>Edit Supporting Document Content</H2>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-8">
                    <div className="d-flex align-items-center">
                      <DrButton
                        data-testid="addContentButton"
                        styles={{
                          button: { borderColor: 'black', marginRight: '8px' },
                        }}
                        variant="secondary"
                        size="small"
                        id="add-button"
                        ariaLabel="Add Content"
                        onClick={() => {
                          navigate(`/admin/supportingdocuments/content/${adminFormData.id}`);
                        }}>
                        <DrIcon iconName="plus" color="black" />
                      </DrButton>
                      <StyledLabel>Create Document Content</StyledLabel>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <BtnContainer>
          <DrButton className="btn-size" data-testid="saveButton" id="create-button" onClick={handleButtonClick} isDisabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/supportingdocuments')} variant="secondary">
            Cancel
          </DrButton>
        </BtnContainer>
      </form>

      <AddContentToDocumentModal
        showModal={showAddContentModal}
        setShowModal={setShowAddContentModal}
        supportingDocumentToEdit={supportingDocumentToEdit}
      />
    </>
  );
}
