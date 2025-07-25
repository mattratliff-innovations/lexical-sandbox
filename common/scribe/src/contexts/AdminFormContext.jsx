import React, { createContext, useContext, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const AdminFormContext = createContext();

export function useAdminFormContext() {
  return useContext(AdminFormContext);
}

export function AdminFormProvider({ children }) {
  const [adminFormSettings, setAdminFormSettings] = useState('');
  const [adminFormData, setAdminFormData] = useState({});
  const [adminErrorMessage, setAdminErrorMessage] = useState('');

  const adminFormValues = useMemo(
    () => ({
      adminFormSettings,
      setAdminFormSettings,
      adminFormData,
      setAdminFormData,
      adminErrorMessage,
      setAdminErrorMessage,
    }),
    [adminFormSettings, setAdminFormSettings, adminFormData, setAdminFormData, adminErrorMessage, setAdminErrorMessage]
  );

  return <AdminFormContext.Provider value={adminFormValues}>{children}</AdminFormContext.Provider>;
}

AdminFormProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
