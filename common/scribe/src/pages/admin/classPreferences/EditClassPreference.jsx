import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import ClassPreferenceForm from './ClassPreferenceForm';
import { substituteNullForUndefined } from '../../util/util';

import LoadingFallback from '../../../utils/LoadingFallback';
import useMultiRequestLoading from '../../../hooks/useMultiRequestLoading';

function EditClassPreference() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const { loading, markFinished } = useMultiRequestLoading(2);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/class_preferences/${id}`)
      .then((response) => {
        const params = { class_preference_id: id };
        axios
          .get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_class_preference`, { params })
          .then((res) => {
            const formTypes = res.data.map((formType) => ({
              ...formType,
              label: formType.name,
              value: formType.id,
              selected: formType.classPreferenceFormXrefs?.length > 0,
            }));

            const formValues = {
              id: '',
              name: '',
              title: '',
              code: '',
              active: true,
              formTypes,
            };

            const newObj = { ...formValues, ...response.data };
            const sanitizedData = substituteNullForUndefined(newObj);

            setAdminFormData(sanitizedData);
            setAdminFormSettings({ action: 'Edit', participle: 'edited' });
          })
          .catch(() => setAdminErrorMessage('Encountered an unknown error retrieving Form Types.'))
          .finally(() => markFinished());
      })
      .catch(() =>
        toast.error('There was an error retrieving the Class Preference.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => markFinished());
  }, []);
  if (loading) return <LoadingFallback />;
  return <ClassPreferenceForm />;
}

export default function EditClassPreferenceWrapper() {
  return (
    <AdminFormProvider>
      <EditClassPreference />
    </AdminFormProvider>
  );
}
