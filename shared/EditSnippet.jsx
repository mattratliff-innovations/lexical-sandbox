import React from 'react';

import 'react-toastify/dist/ReactToastify.css';

import SnippetForm from './SnippetForm';
import useGetSetData from './useGetSetData';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';

function EditSnippet() {
  useGetSetData('Edit');
  return <SnippetForm />;
}

export default function EditSnippetWrapper() {
  return (
    <AdminFormProvider>
      <EditSnippet />
    </AdminFormProvider>
  );
}
