import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';
import { Flip, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import OrganizationForm from './OrganizationForm';
import { RETRIEVING_HEADERS_ERRORS } from './OrganizationFormUtil';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../../http/authenticatedAxios';
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
              .get(`${APP_API_ENDPOINT}/letter_types`, { params: { include_organization: true } })
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
            setAdminErrorMessage(RETRIEVING_HEADERS_ERRORS);
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
