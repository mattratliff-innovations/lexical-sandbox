import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import OrganizationForm from './OrganizationForm';
import * as Util from './OrganizationFormUtil';
import LoadingFallback from '../../../utils/LoadingFallback';

function EditOrganization() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const axios = createAuthenticatedAxios();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/organizations/${id}`)
      .then((orgRes) => {
        const params = { organization_id: id };
        axios
          .get(`${APP_API_ENDPOINT}/headers/available_headers_for_organization`, { params })
          .then((headerRes) => {
            axios
              .get(`${APP_API_ENDPOINT}/letter_types`)
              .then((response) => {
                const letterTypes = response.data.map((letterType) => ({
                  ...letterType,
                  label: letterType.name,
                  value: letterType.id,
                  selected: letterType.organizations.some((org) => org.id === id),
                }));

                const headers = headerRes.data.map((header) => ({
                  ...header,
                  label: header.name,
                  value: header.id,
                  selected: header.organizationHeaderXrefs?.length > 0,
                }));

                setAdminFormData({ ...orgRes.data, headers, letterTypes });
                setAdminFormSettings({ action: 'Edit', participle: 'edited' });
              })
              .catch(() => setAdminErrorMessage('Encountered an unknown error retrieving Letter Types.'));
          })
          .catch(() => {
            setAdminErrorMessage(Util.RETRIEVING_HEADERS_ERRORS);
          });
      })
      .catch(() => {
        toast.error('There was an error retrieving the organization.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, [setAdminFormData]);
  if (loading) return <LoadingFallback />;
  return <OrganizationForm />;
}

export default function EditOrganizationWrapper() {
  return (
    <AdminFormProvider>
      <EditOrganization />
    </AdminFormProvider>
  );
}
