import React, { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { toast, Flip } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import _ from 'lodash';
import { PencilFill } from 'react-bootstrap-icons';
import useModalCheck from '../../util/customHooks/useModalCheck';
import CustomError from '../../util/CustomError';
import UtilityModal from '../../util/UtilityModal';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
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
import TableConfigs from '../../../components/tableConfigs';
import SnippetModal from './SnippetModal';
import AddSnippetToGroupModal from './AddSnippetToGroupModal';
import useContextReady from '../../../hooks/useContextReady';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function SnippetForm() {
  const [showAddSnippetToGroupModal, setShowAddSnippetToGroupModal] = useState(false);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetGroupToEdit, setSnippetGroupToEdit] = useState({});
  const [snippetToEdit, setSnippetToEdit] = useState({});
  const [curAlertType, setCurAlertType] = useState('info');

  const { setHandleButtonClick } = useOutletContext();

  const { setAdminErrorMessage, adminFormSettings, adminFormData } = useAdminFormContext();

  const navigate = useNavigate();

  const isUpdating = () => adminFormSettings && adminFormSettings.action === 'Edit';

  const isCreating = () => adminFormSettings && adminFormSettings.action === 'Create';

  const defaultValues = useMemo(() => adminFormData, [adminFormData, adminFormData?.formsAndLetters]);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    formState: { errors, isSubmitted, isSubmitting, isDirty },
  } = useForm({ mode: 'onSubmit', defaultValues });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty && !showAddSnippetToGroupModal);

  useEffect(() => {
    trigger();
    reset(adminFormData);
  }, [adminFormData]);

  const buildApiData = (data) => {
    const formsAndLetters = data?.formsAndLetters?.selected?.map((item) => ({
      id: item?.id,
      form_type_id: item?.form?.id,
      letter_type_id: item?.letter?.id,
    }));

    return {
      snippet_group: {
        name: data.name,
        active: data.active,
        multiple: data.multiple,
        snippet_group_form_letter_xrefs_attributes: formsAndLetters,
      },
    };
  };

  const onSubmitCreateSnippetGroup = async (data) => {
    const axios = createAuthenticatedAxios();

    try {
      const response = await axios.post(`${APP_API_ENDPOINT}/snippet_groups`, buildApiData(data));

      setSnippetGroupToEdit(response.data);
      setShowAddSnippetToGroupModal(true);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitUpdateSnippetGroup = async (data) => {
    const axios = createAuthenticatedAxios();

    try {
      await axios.put(`${APP_API_ENDPOINT}/snippet_groups/${adminFormData.id}`, buildApiData(data));
      toast.success(`Snippet Group ${adminFormSettings.participle} successfully!`, {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastSnippetForm',
      });

      navigate('/admin/snippets');
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitCreateSnippet = async (data) => {
    const axios = createAuthenticatedAxios();
    const endPoint = `${APP_API_ENDPOINT}/snippets/`;

    try {
      const response = await axios.post(endPoint, {
        snippet: {
          id: snippetToEdit?.id,
          snippet_group_id: adminFormData.id,
          active: data.active,
          name: data.name,
          code: data.code,
          content: data.content,
        },
      });

      toast.success('The snippet was created successfully!', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastContact',
      });

      setShowSnippetModal(false);
      setSnippetToEdit({});

      adminFormData?.snippets.push(response.data);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitUpdateSnippet = async (data) => {
    const axios = createAuthenticatedAxios();
    const endPoint = `${APP_API_ENDPOINT}/snippets/${snippetToEdit?.id}`;

    try {
      const response = await axios.put(endPoint, {
        snippet: {
          id: snippetToEdit?.id,
          snippet_group_id: adminFormData.id,
          active: data.active,
          name: data.name,
          code: data.code,
          content: data.content,
        },
      });

      toast.success('The snippet was updated successfully!', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastContact',
      });

      setShowSnippetModal(false);
      setAdminErrorMessage('');

      const foundIdx = adminFormData.snippets.findIndex((snippet) => snippet.id === response.data.id);
      if (foundIdx !== -1) adminFormData.snippets[foundIdx] = response.data;

      setSnippetToEdit({});
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(() => {
    setCurAlertType(_.isEmpty(errors) ? 'info' : 'error');
    if (isCreating()) handleSubmit(onSubmitCreateSnippetGroup)();
    else handleSubmit(onSubmitUpdateSnippetGroup)();
  }, [errors, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => setHandleButtonClick(() => handleButtonClick), [handleButtonClick]);

  const headers = [
    { name: 'order', label: 'Order' },
    { name: 'name', label: 'Name' },
    { name: 'code', label: 'Code' },
    { name: 'active', label: 'Active' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  // Only flips to 'ready' once adminFormData is no longer undefined/null
  const contextReady = useContextReady(adminFormData);

  // Compose a single loading boolean based on context readiness
  const loading = !contextReady;

  if (loading) return <LoadingFallback />;

  return (
    <>
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Snippets" />

      <H1 data-testid="snippetFormHeading">{`${adminFormSettings.action} Standard Placeholder Snippet`}</H1>

      <div className="col-sm-8">
        <CustomError errorType={curAlertType} />
      </div>

      <form className="mt-4">
        <div className="row">
          <div className="col-md-3">
            <StyledLabel className="required" htmlFor="snippet-name">
              Placeholder Snippet Group Name
            </StyledLabel>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4 ">
            <InputContainer>
              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('name', {
                  required: { value: true, message: 'A name is required.' },
                })}
                maxLength="100"
                id="snippet-name"
                data-testid="snippet-name"
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
              <StyledLabel htmlFor="active">Standard Placeholder Snippet is Active</StyledLabel>
              <StyledNote>Uncheck to hide throughout the system</StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        <div className="row">
          <div className="col-sm-4" />

          <CheckBoxContainer className="col-sm-6">
            <StyledCheckbox
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...register('multiple')}
              type="checkbox"
              id="locked"
              data-testid="multiple"
            />

            <LabelContainer>
              <StyledLabel htmlFor="locked">Select Multiple Snippets at Once</StyledLabel>

              <StyledNote>
                <div>Check if multiple snippets from this group can be added at once</div>

                <div>(inserts variable instead of content)</div>
              </StyledNote>
            </LabelContainer>
          </CheckBoxContainer>
        </div>

        {isUpdating() && (
          <>
            <div className="row">
              <div className="col-sm-8">
                <StyledHr />
              </div>
            </div>

            {Object.keys(adminFormData).length === 0 || adminFormData?.snippets?.length === 0 ? (
              <div className="adminListCreateButtonDiv mb-4" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
                No data found.
              </div>
            ) : (
              <div className="row">
                <div className="col-sm-8">
                  {/* eslint-disable react/jsx-props-no-spreading */}
                  <DrTable
                    title="Placeholder Snippets"
                    headers={headers}
                    data={adminFormData?.snippets}
                    defaultSortCol="name"
                    sortDirection="asc"
                    {...TableConfigs}>
                    {adminFormData?.snippets?.map((rowdata, index) => (
                      <Fragment key={`snippetGroupRow-${rowdata.id}`}>
                        <DrColumn name="order" uniqueId={rowdata.id}>
                          {index + 1}
                        </DrColumn>

                        <DrColumn name="name" uniqueId={rowdata.id}>
                          {rowdata.name}
                        </DrColumn>

                        <DrColumn name="code" uniqueId={rowdata.id}>
                          {rowdata.code}
                        </DrColumn>

                        <DrColumn name="active" uniqueId={rowdata.id}>
                          {rowdata.active && <DrIcon iconName="check" size="small" />}
                        </DrColumn>

                        <DrColumn name="actions" uniqueId={rowdata.id}>
                          <DrButton
                            className="px-0"
                            ariaLabel={`edit-${rowdata.name}`}
                            data-testid={`edit-${rowdata.id}`}
                            id={`edit-${rowdata.id}`}
                            onClick={() => {
                              setSnippetToEdit(rowdata);
                              setShowSnippetModal(true);
                            }}>
                            <PencilFill className="mx-1" />
                          </DrButton>
                        </DrColumn>
                      </Fragment>
                    ))}
                  </DrTable>
                </div>
              </div>
            )}

            <div className="d-flex align-items-center">
              <DrButton
                data-testid="addSnippetButton"
                styles={{
                  button: { borderColor: 'black', marginRight: '8px' },
                }}
                variant="secondary"
                size="small"
                id="add-button"
                ariaLabel="Add Snippet"
                onClick={() => {
                  setSnippetToEdit({});
                  setShowSnippetModal(true);
                }}>
                <DrIcon iconName="plus" color="black" />
              </DrButton>
              <StyledLabel>Add Snippet</StyledLabel>
            </div>
          </>
        )}

        <div className="row">
          <div className="col-sm-8">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <H2>Associated Letter Types</H2>
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

          <DrButton className="btn-size" data-testid="cancelButton" onClick={() => navigate('/admin/snippets')} variant="secondary">
            Cancel
          </DrButton>
        </BtnContainer>
      </form>

      <AddSnippetToGroupModal
        showModal={showAddSnippetToGroupModal}
        setShowModal={setShowAddSnippetToGroupModal}
        snippetGroupToEdit={snippetGroupToEdit}
      />

      <SnippetModal
        showModal={showSnippetModal}
        setShowModal={setShowSnippetModal}
        onSubmit={Object.keys(snippetToEdit).length === 0 ? onSubmitCreateSnippet : onSubmitUpdateSnippet}
        snippetToEdit={snippetToEdit}
      />
    </>
  );
}
