import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import HeaderForm from './HeaderForm';
import { substituteNullForUndefined } from '../../util/util';
import LoadingFallback from '../../../utils/LoadingFallback';

function EditHeader() {
  const { setAdminFormSettings } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    row1Col1: '',
    row1Col2: '',
    row2Col1: '',
    row2Col2: '',
    row3Col1: '',
    row3Col2: '',
    content: '',
    active: true,
  });

  useEffect(() => {
    setAdminFormSettings({ action: 'Edit', participle: 'edited' });
    axios
      .get(`${APP_API_ENDPOINT}/headers/${id}`)
      .then((response) => {
        const sanitizedInputs = substituteNullForUndefined(response.data);
        setFormData(sanitizedInputs);
      })
      .catch(() => {
        toast.error('There was an error retrieving the header.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingFallback />;
  return <HeaderForm formValues={formData} />;
}

export default function EditHeaderWrapper() {
  return (
    <AdminFormProvider>
      <EditHeader />
    </AdminFormProvider>
  );
}
