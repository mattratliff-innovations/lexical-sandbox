import React, { useEffect, useState } from 'react';
import ClassPreferenceForm from './ClassPreferenceForm';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import LoadingFallback from '../../../utils/LoadingFallback';

function CreateClassPreference() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_class_preference`)
      .then((response) => {
        const formTypes = response.data.map((formType) => ({
          ...formType,
          label: formType.name,
          value: formType.id,
        }));

        const formValues = {
          id: '',
          name: '',
          code: '',
          active: true,
          formTypes,
        };

        setAdminFormSettings({ action: 'Create', participle: 'created' });
        setAdminFormData(formValues);
      })
      .catch(() => setAdminErrorMessage('Encountered an unknown error retrieving Form Types.'))
      .finally(() => setLoading(false));
  }, [setAdminFormData]);
  if (loading) return <LoadingFallback />;
  return <ClassPreferenceForm />;
}

export default function CreateClassPrefrenceWrapper() {
  return (
    <AdminFormProvider>
      <CreateClassPreference />
    </AdminFormProvider>
  );
}
