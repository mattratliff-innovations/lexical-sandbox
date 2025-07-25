import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TableConfigs from '../../../components/tableConfigs';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListClassPreferences() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  const [classPreferenceList, setClassPreferenceList] = useState([]);

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'code', label: 'Class Code' },
    { name: 'updatedAt', label: 'Last Modified' },
    { name: 'active', label: 'Active?' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/class_preferences`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          active: !!rowdata.active,
          createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
          id: rowdata.id,
          name: rowdata.name,
          updatedAt: rowdata.updatedAt,
          code: rowdata.code,
        }));

        setClassPreferenceList(responseData);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Class Preferences list', {
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
      {classPreferenceList.length === 0 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        className="h1size"
        title="Class Preferences"
        headers={headers}
        data={classPreferenceList}
        defaultSortCol="name"
        sortDirection="asc"
        {...TableConfigs}>
        {classPreferenceList.map((rowdata) => (
          <Fragment key={`classPreferenceRow-${rowdata.id}`}>
            <DrColumn name="updatedAt" uniqueId={rowdata.id}>
              {DateTime.fromISO(rowdata.updatedAt).toLocaleString(DateTime.DATETIME_SHORT)}
            </DrColumn>

            <DrColumn name="active" uniqueId={rowdata.id}>
              {rowdata.active && <DrIcon iconName="check" size="small" />}
            </DrColumn>

            <DrColumn name="actions" uniqueId={rowdata.id}>
              <DrButton
                className="px-0"
                ariaLabel={`edit ${rowdata.name}`}
                data-testid={`edit-${rowdata.id}`}
                id={`edit-${rowdata.id}`}
                onClick={() => redirect(`/admin/classPreferences/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>

            <DrColumn name="name" uniqueId={rowdata.id}>
              <Link
                data-testid={`edit-${rowdata.name}`}
                aria-label={`edit ${rowdata.name}`}
                id={`edit-${rowdata.name}`}
                to={`/admin/classPreferences/${rowdata.id}`}
                title={rowdata.name}>
                {rowdata.name}
              </Link>
            </DrColumn>
            <DrColumn name="code" uniqueId={rowdata.id}>
              {rowdata.code}
            </DrColumn>
          </Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/classPreferences/create" className="btn btn-primary w-100">
            Create Preference
          </Link>
        </div>
      </div>
    </>
  );
}
