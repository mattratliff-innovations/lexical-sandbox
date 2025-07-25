import React from 'react';
import useGetSetData from './useGetSetData';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';
import StandardParagraphForm from './StandardParagraphForm';

function EditStandardParagraph() {
  useGetSetData('Edit');
  return <StandardParagraphForm />;
}

export default function EditStandardParagraphWrapper() {
  return (
    <AdminFormProvider>
      <EditStandardParagraph />
    </AdminFormProvider>
  );
}
