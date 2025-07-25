import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import {
  StyledInput,
  StyledCheckbox,
  CheckBoxContainer,
  LabelContainer,
  StyledLabel,
  BtnContainer,
  InputContainer,
  StyledNote,
} from '../../../components/designedComponents';
import { H1 } from '../../../components/typography';
import Lexical4Admin from '../../draft/scribeEditor/scribeDocument/lexical/lexical4Admin/Lexical4Admin';
import CustomError from '../../util/CustomError';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

export default function SnippetModal({ snippetToEdit = null, showModal, setShowModal, onSubmit }) {
  const { setAdminErrorMessage } = useAdminFormContext();
  const [alertMessageType, setAlertMessageType] = useState('info');

  const defaultValues = {
    name: snippetToEdit?.name || '',
    content: snippetToEdit?.content || '',
    code: snippetToEdit?.code || '',
    active: snippetToEdit?.active || true,
  };

  const preAction = snippetToEdit.id ? 'Save' : 'Add';
  const curAction = snippetToEdit.id ? 'Saving...' : 'Adding...';

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: 'onSubmit', defaultValues });

  useEffect(() => {
    if (!showModal) {
      setAdminErrorMessage('');
      setAlertMessageType('info');
    }

    reset(defaultValues);
    trigger();
  }, [showModal]);

  const handleSave = () => {
    trigger();
    setAlertMessageType(isValid ? 'info' : 'error');
    handleSubmit(onSubmit)();
  };

  return (
    <ScribeModal showModal={showModal} name="addSnippetModal">
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="snippetModalHeaderContainer">
          {`${snippetToEdit.id ? 'Edit' : 'Add'} Snippet here`}
        </H1>
        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <CustomError errorType={alertMessageType} />

      <Body data-testid="snippetModalBody" className="mb-4">
        <form>
          <div className="row mb-4">
            <div className="col-lg-4">
              <CheckBoxContainer style={{ alignItems: 'center' }}>
                <StyledCheckbox
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('active')}
                  type="checkbox"
                  aria-label="Address is Active"
                />

                <LabelContainer>
                  <StyledLabel>Snippet is Active</StyledLabel>
                  <StyledNote>Uncheck to hide throughout the system</StyledNote>
                </LabelContainer>
              </CheckBoxContainer>
            </div>
          </div>

          <div className="row ">
            <div className="col-lg-4">
              <InputContainer>
                <StyledLabel htmlFor="name" className="required mb-1">
                  Snippet Name
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('name', {
                    required: { value: true, message: 'Name is required!' },
                  })}
                  label="Snippet Name"
                  maxLength="100"
                  id="name"
                  data-testid="name"
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.name?.message}
                </div>
              </InputContainer>
            </div>

            <div className="col-lg-4">
              <InputContainer>
                <StyledLabel htmlFor="code" className="required mb-1">
                  Snippet Code
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('code', {
                    required: { value: true, message: 'code is required!' },
                  })}
                  label="Snippet Code"
                  maxLength="100"
                  id="code"
                  data-testid="code"
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.code?.message}
                </div>
              </InputContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-8">
              <LabelContainer>
                <StyledLabel className="required">Snippet Content</StyledLabel>
              </LabelContainer>

              <Lexical4Admin
                id="content"
                name="content"
                type="snippet"
                control={control}
                ariaLabel="Paragraph Content"
                initialValue={defaultValues.content}
                isRequired
              />
            </div>
          </div>
        </form>

        <BtnContainer>
          <DrButton variant="primary" data-testid="saveSnippetModalButton" onClick={handleSave} isDisabled={isSubmitting} className="btn-size">
            {isSubmitting ? curAction : preAction}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelSnippetModalButton" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

SnippetModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  snippetToEdit: PropTypes.shape({ id: PropTypes.string }),
};
