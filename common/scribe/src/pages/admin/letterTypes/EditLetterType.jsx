import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import LetterTypeForm from './LetterTypeForm';
import { substituteNullForUndefined } from '../../util/util';
import useMultiRequestLoading from '../../../hooks/useMultiRequestLoading';
import LoadingFallback from '../../../utils/LoadingFallback';

export const FORM_TYPE_RETRIEVAL_ERROR = 'Encountered an unknown error retrieving Form Types.';

function EditLetterType() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const { loading, markFinished } = useMultiRequestLoading(2);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letter_types/${id}`)
      .then((response) => {
        const params = { letter_type_id: id };
        axios
          .get(`${APP_API_ENDPOINT}/form_types/available_form_types_for_letter_type`, { params })
          .then((res) => {
            const formTypes = res.data.map((formType) => ({
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

            const newObj = { ...formValues, ...response.data };
            const sanitizedData = substituteNullForUndefined(newObj);

            setAdminFormData(sanitizedData);
            setAdminFormSettings({ action: 'Edit', participle: 'edited' });
          })
          .catch(() => setAdminErrorMessage(FORM_TYPE_RETRIEVAL_ERROR))
          .finally(() => markFinished());
      })
      .catch(() =>
        toast.error('There was an error retrieving the letter type.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => markFinished());
  }, []);
  if (loading) return <LoadingFallback />;
  return <LetterTypeForm />;
}

export default function EditLetterTypeWrapper() {
  return (
    <AdminFormProvider>
      <EditLetterType />
    </AdminFormProvider>
  );
}
