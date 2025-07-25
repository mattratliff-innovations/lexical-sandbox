import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import useGetSetData from './useGetSetData';
import StandardParagraphForm from './StandardParagraphForm';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';

export const FORM_TYPE_RETRIEVAL_ERROR = 'Encountered an unknown error retrieving Form Types.';

function CreateStandardParagraph() {
  useGetSetData('Create');
  return <StandardParagraphForm />;
}

export default function CreateStandardParagraphWrapper() {
  return (
    <AdminFormProvider>
      <CreateStandardParagraph />
    </AdminFormProvider>
  );
}
