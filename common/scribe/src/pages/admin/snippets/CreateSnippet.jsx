import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import SnippetForm from './SnippetForm';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';
import useGetSetData from './useGetSetData';

function CreateSnippet() {
  useGetSetData('Create');
  return <SnippetForm />;
}

export default function CreateSnippetWrapper() {
  return (
    <AdminFormProvider>
      <CreateSnippet />
    </AdminFormProvider>
  );
}
