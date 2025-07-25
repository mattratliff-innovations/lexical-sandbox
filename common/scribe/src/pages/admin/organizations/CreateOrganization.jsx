import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import OrganizationForm from './OrganizationForm';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import * as Util from './OrganizationFormUtil';
import LoadingFallback from '../../../utils/LoadingFallback';

function CreateOrganization() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/headers/available_headers_for_organization`, {})
      .then((res) => {
        axios
          .get(`${APP_API_ENDPOINT}/letter_types`)
          .then((response) => {
            const headers = res.data.map((header) => ({
              ...header,
              label: header.name,
              value: header.id,
              selected: header.organizationHeaderXrefs?.length > 0,
            }));

            const letterTypes = response.data.map((letterType) => ({
              ...letterType,
              label: letterType.name,
              value: letterType.id,
              selected: letterType.organizations.some((org) => org.id === ''),
            }));

            const initialValues = {
              id: '',
              name: '',
              code: '',
              active: true,
              daysForward: 0,
              headers,
              letterTypes,
              occ: false,
            };

            setAdminFormSettings({ action: 'Create', participle: 'created' });
            setAdminFormData(initialValues);
          })
          .catch(() => setAdminErrorMessage('Encountered an unknown error retrieving Letter Types.'));
      })
      .catch(() => {
        setAdminErrorMessage(Util.RETRIEVING_HEADERS_ERRORS);
      })
      .finally(() => setLoading(false));
  }, [setAdminFormData]);
  if (loading) return <LoadingFallback />;
  return <OrganizationForm />;
}

export default function CreateOrganizationWrapper() {
  return (
    <AdminFormProvider>
      <CreateOrganization />
    </AdminFormProvider>
  );
}
