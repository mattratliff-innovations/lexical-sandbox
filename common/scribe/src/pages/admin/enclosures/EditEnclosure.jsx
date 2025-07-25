import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import useGetSetData from './useGetSetData';
import EnclosureForm from './EnclosureForm';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';

function EditEnclosure() {
  useGetSetData('Edit');
  return <EnclosureForm />;
}

export default function EditEnclosureWrapper() {
  return (
    <AdminFormProvider>
      <EditEnclosure />
    </AdminFormProvider>
  );
}
