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

function transformLetterTypes(letterTypeData, orgId) {
  return letterTypeData.map((letterType) => ({
    ...letterType,
    label: letterType.name,
    value: letterType.id,
    selected: letterType.organizations.some((org) => org.id === orgId),
  }));
}

function transformHeaders(headerData) {
  return headerData.map((header) => ({
    ...header,
    label: header.name,
    value: header.id,
  }));
}

function transformCustomAssociations(xrefs = []) {
  return xrefs.map((xref) => ({
    id: xref.id,
    letterTypeId: xref.letterType?.id,
    headerId: xref.header?.id,
    letterType: xref.letterType,
    header: xref.header,
  }));
}

function EditOrganization() {
  const { setAdminFormSettings, setAdminFormData, setAdminErrorMessage } = useAdminFormContext();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgData = await fetchOrganization(id);
        const headerData = await fetchHeaders();
        const letterTypeData = await fetchLetterTypes(true);

        const letterTypes = transformLetterTypes(letterTypeData, id);
        const headers = transformHeaders(headerData);
        const customLetterHeaderAssociations = transformCustomAssociations(orgData.organizationHeaderLetterTypeXrefs);

        setAdminFormData({
          ...orgData,
          headers,
          letterTypes,
          customLetterHeaderAssociations,
        });
        setAdminFormSettings({ action: 'Edit', participle: 'edited' });
      } catch (error) {
        if (error.message?.includes('Letter Types')) {
          setAdminErrorMessage('Encountered an unknown error retrieving Letter Types.');
        } else if (error.message?.includes('Headers')) {
          setAdminErrorMessage(RETRIEVING_HEADERS_ERRORS);
        } else {
          toast.error('There was an error retrieving the organization.', {
            position: 'top-center',
            transition: Flip,
            theme: 'dark',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, setAdminFormData, setAdminFormSettings, setAdminErrorMessage]);

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
