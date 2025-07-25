import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { FormTypeForm } from './FormTypeForm';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import LoadingFallback from '../../../utils/LoadingFallback';

const RETRIEVING_LETTER_TYPES_ERRORS = 'Encountered an unknown error retrieving Letter Types.';

function CreateFormType() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letter_types/available_letter_types_for_form_type`, {})
      .then((response) => {
        const letterTypes = response.data.map((letterType) => ({
          ...letterType,
          label: letterType.name,
          value: letterType.id,
          selected: letterType.formLetterTypeXrefs?.length > 0,
        }));

        const initialValues = {
          id: '',
          name: '',
          code: '',
          description: '',
          active: true,
          letterTypes,
        };

        setAdminFormSettings({ action: 'Create', participle: 'created' });
        setAdminFormData(initialValues);
      })
      .catch(() => setAdminErrorMessage(RETRIEVING_LETTER_TYPES_ERRORS))
      .finally(() => setLoading(false));
  }, [setAdminFormData]);
  if (loading) return <LoadingFallback />;
  return <FormTypeForm />;
}

export default function CreateFormTypeWrapper() {
  return (
    <AdminFormProvider>
      <CreateFormType />
    </AdminFormProvider>
  );
}
