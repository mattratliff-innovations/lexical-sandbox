import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import useGetSetData from './useGetSetData';
import SupportingDocumentForm from './SupportingDocumentForm';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';

function CreateSupportingDocument() {
  useGetSetData('Create');
  return <SupportingDocumentForm />;
}

export default function CreateSupportingDocumentWrapper() {
  return (
    <AdminFormProvider>
      <CreateSupportingDocument />
    </AdminFormProvider>
  );
}
