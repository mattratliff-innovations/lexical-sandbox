import React, { useEffect, useState } from 'react';
import LetterTypeForm from './LetterTypeForm';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import LoadingFallback from '../../../utils/LoadingFallback';

function CreateLetterType() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_letter_type`, {})
      .then((response) => {
        const formTypes = response.data.map((formType) => ({
          ...formType,
          label: formType.name,
          value: formType.id,
          selected: formType.formLetterTypeXrefs?.length > 0,
        }));

        const formValues = {
          id: '',
          signatureIncluded: false,
          headerIncluded: true,
          name: '',
          title: '',
          startsWith: '',
          endsWith: '',
          marginTop: '0.65',
          marginBottom: '1.00',
          marginLeft: '1.00',
          marginRight: '1.00',
          active: true,
          startsWithLocked: false,
          endsWithLocked: false,
          formTypes,
          vawa: false,
        };

        setAdminFormSettings({ action: 'Create', participle: 'created' });
        setAdminFormData(formValues);
      })
      .catch(() => setAdminErrorMessage('Encountered an unknown error retrieving Form Types.'))
      .finally(() => setLoading(false));
  }, [setAdminFormData]);
  if (loading) return <LoadingFallback />;
  return <LetterTypeForm />;
}

export default function CreateLetterTypeWrapper() {
  return (
    <AdminFormProvider>
      <CreateLetterType />
    </AdminFormProvider>
  );
}
