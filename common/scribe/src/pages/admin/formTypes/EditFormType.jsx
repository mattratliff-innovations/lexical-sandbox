import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import { FormTypeForm } from './FormTypeForm';
import LoadingFallback from '../../../utils/LoadingFallback';

const RETRIEVING_LETTER_TYPES_ERRORS = 'Encountered an unknown error retrieving Letter Types.';

function EditFormType() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();

  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/form_types/${id}`)
      .then((response) => {
        const params = { form_type_id: id };

        axios
          .get(`${APP_API_ENDPOINT}/letter_types/available_letter_types_for_form_type`, { params })
          .then((res) => {
            const letterTypes = res.data.map((letterType) => ({
              ...letterType,
              label: letterType.name,
              value: letterType.id,
              selected: letterType.formLetterTypeXrefs?.length > 0,
            }));

            setAdminFormData({ ...response.data, letterTypes });
            setAdminFormSettings({ action: 'Edit', participle: 'edited' });
          })
          .catch(() => setAdminErrorMessage(RETRIEVING_LETTER_TYPES_ERRORS));
      })
      .catch(() => {
        toast.error('There was an error retrieving the form type.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, [setAdminFormData]);

  if (loading) return <LoadingFallback />;
  return <FormTypeForm />;
}

export default function EditFormTypeWrapper() {
  return (
    <AdminFormProvider>
      <EditFormType />
    </AdminFormProvider>
  );
}
