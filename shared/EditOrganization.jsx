import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';
import { Flip, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import OrganizationForm from './OrganizationForm';
import { RETRIEVING_HEADERS_ERRORS } from './OrganizationFormUtil';
import { AdminFormProvider, useAdminFormContext } from '../../../contexts/AdminFormContext';
import fetchHeaders from '../../../http/headers';
import fetchLetterTypes from '../../../http/letter_types';
import { fetchOrganization } from '../../../http/organizations';
import LoadingFallback from '../../../utils/LoadingFallback';

function EditOrganization() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  const mapHeaderLetterTypes = (xrefs) =>
    xrefs?.map((xref) => ({
      organizationLetterTypeHeaderXrefId: xref.id,
      letterType: {
        id: xref.letterType.id,
        name: xref.letterType.name,
        label: xref.letterType.name,
      },
      header: {
        id: xref.header.id,
        name: xref.header.name,
        label: xref.header.name,
      },
    }));

  useEffect(() => {
    fetchOrganization(id)
      .then((orgRes) => {
        fetchHeaders()
          .then((headerRes) => {
            fetchLetterTypes(true)
              .then((response) => {
                // all letter types
                const letterTypes = response.map((letterType) => ({
                  ...letterType,
                  label: letterType.name,
                  value: letterType.id,
                  selected: letterType.organizations.some((org) => org.id === id),
                }));

                // all headers
                const headers = headerRes.map((header) => ({
                  ...header,
                  label: header.name,
                  value: header.id,
                }));

                const transformedHeaderLetterTypes = {
                  selected: mapHeaderLetterTypes(orgRes.organizationHeaderLetterTypeXrefs),
                };

                setAdminFormData({ ...orgRes, headers, letterTypes, headerLetterTypeXrefs: transformedHeaderLetterTypes });
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
