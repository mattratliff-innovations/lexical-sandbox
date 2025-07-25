import React from 'react';
import useGetSetData from './useGetSetData';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';
import SupportingDocumentForm from './SupportingDocumentForm';

function EditSupportingDocument() {
  useGetSetData('Edit');
  return <SupportingDocumentForm />;
}

export default function EditSupportingDocumentWrapper() {
  return (
    <AdminFormProvider>
      <EditSupportingDocument />
    </AdminFormProvider>
  );
}
