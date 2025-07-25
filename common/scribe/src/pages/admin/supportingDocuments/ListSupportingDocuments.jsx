import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TableConfigs from '../../../components/tableConfigs';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListSupportingDocuments() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();

  const [supportingDocumentList, setSupportingDocumentList] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'updatedAt', label: 'Last Modified' },
    { name: 'active', label: 'Active?' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/supporting_documents`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          active: !!rowdata.active,
          createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
          id: rowdata.id,
          name: rowdata.name,
          updatedAt: rowdata.updatedAt,
        }));

        setSupportingDocumentList(responseData);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Supporting Documents list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingFallback />;

  return (
    <>
      {supportingDocumentList.length === 0 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        className="h1size"
        title="Supporting Documents"
        headers={headers}
        data={supportingDocumentList}
        defaultSortCol="name"
        sortDirection="asc"
        {...TableConfigs}>
        {supportingDocumentList.map((rowdata) => (
          <Fragment key={`supportingDocumentRow-${rowdata.id}`}>
            <DrColumn name="updatedAt" uniqueId={rowdata.id}>
              {DateTime.fromISO(rowdata.updatedAt).toLocaleString(DateTime.DATETIME_SHORT)}
            </DrColumn>

            <DrColumn name="active" uniqueId={rowdata.id}>
              {rowdata.active && <DrIcon iconName="check" size="small" />}
            </DrColumn>

            <DrColumn name="locked" uniqueId={rowdata.id}>
              {rowdata.locked && <DrIcon iconName="check" size="small" />}
            </DrColumn>

            <DrColumn name="actions" uniqueId={rowdata.id}>
              <DrButton
                className="px-0"
                ariaLabel={`edit ${rowdata.name}`}
                data-testid={`edit-${rowdata.id}`}
                id={`edit-${rowdata.id}`}
                onClick={() => redirect(`/admin/supportingdocuments/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>

            <DrColumn name="name" uniqueId={rowdata.id}>
              <Link
                data-testid={`edit-${rowdata.name}`}
                aria-label={`edit ${rowdata.name}`}
                id={`edit-${rowdata.name}`}
                to={`/admin/supportingdocuments/${rowdata.id}`}
                title={rowdata.name}>
                {rowdata.name}
              </Link>
            </DrColumn>
          </Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/supportingdocuments/create" className="btn btn-primary w-100">
            Create Supporting Document
          </Link>
        </div>
      </div>
    </>
  );
}
