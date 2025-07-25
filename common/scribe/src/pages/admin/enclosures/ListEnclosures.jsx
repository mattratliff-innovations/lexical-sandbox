import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TableConfigs from '../../../components/tableConfigs';

import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListEnclosures() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();

  const [enclosureList, setEnclosureList] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'updatedAt', label: 'Last Modified' },
    { name: 'active', label: 'Active?' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/enclosures`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          active: !!rowdata.active,
          createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
          id: rowdata.id,
          name: rowdata.name,
          updatedAt: rowdata.updatedAt,
        }));

        setEnclosureList(responseData);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Enclosures list', {
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
      {enclosureList.length === 0 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        className="h1size"
        title="Enclosures"
        headers={headers}
        data={enclosureList}
        defaultSortCol="name"
        sortDirection="asc"
        {...TableConfigs}>
        {enclosureList.map((rowdata) => (
          <Fragment key={`enclosureRow-${rowdata.id}`}>
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
                onClick={() => redirect(`/admin/enclosures/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>

            <DrColumn name="name" uniqueId={rowdata.id}>
              <Link
                data-testid={`edit-${rowdata.name}`}
                aria-label={`edit ${rowdata.name}`}
                id={`edit-${rowdata.name}`}
                to={`/admin/enclosures/${rowdata.id}`}
                title={rowdata.name}>
                {rowdata.name}
              </Link>
            </DrColumn>
          </Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/enclosures/create" className="btn btn-primary w-100">
            Create Enclosure
          </Link>
        </div>
      </div>
    </>
  );
}
