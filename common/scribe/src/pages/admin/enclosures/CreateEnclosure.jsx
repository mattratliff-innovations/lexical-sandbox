import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import useGetSetData from './useGetSetData';
import EnclosureForm from './EnclosureForm';
import { AdminFormProvider } from '../../../contexts/AdminFormContext';

function CreateEnclosure() {
  useGetSetData('Create');
  return <EnclosureForm />;
}

export default function CreateEnclosureWrapper() {
  return (
    <AdminFormProvider>
      <CreateEnclosure />
    </AdminFormProvider>
  );
}
