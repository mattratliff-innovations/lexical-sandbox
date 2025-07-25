import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';
import SnippetForm from './SnippetForm';
import useGetSetData from './useGetSetData';

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
