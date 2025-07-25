import React, { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import HeaderForm from './HeaderForm';

function CreateHeader() {
  const { setAdminFormSettings } = useAdminFormContext();
  const { setAdminFormData } = useAdminFormContext();

  useEffect(() => {
    setAdminFormSettings({ action: 'Create', participle: 'created' });
  }, [setAdminFormData]);
  return (
    <HeaderForm
      formValues={{
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
      }}
    />
  );
}

export default function CreateHeaderWrapper() {
  return (
    <AdminFormProvider>
      <CreateHeader />
    </AdminFormProvider>
  );
}
