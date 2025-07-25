import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import TableConfigs from '../../../components/tableConfigs';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListLetterTypes() {
  const [letterTypeList, setLetterTypeList] = useState([]);

  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'updatedAt', label: 'Last Modified' },
    { name: 'active', label: 'Active' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letter_types`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          active: !!rowdata.active,
          content: rowdata.content,
          createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
          id: rowdata.id,
          name: rowdata.name,
          updatedAt: rowdata.updatedAt,
        }));

        setLetterTypeList(responseData);
      })
      .catch(() =>
        toast.error('There was an error retrieving the Letter Types list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingFallback />;

  return (
    <>
      {letterTypeList.length < 1 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        className="h1size"
        title="Letter Types"
        headers={headers}
        data={letterTypeList}
        defaultSortCol="name"
        sortDirection="asc"
        {...TableConfigs}>
        {letterTypeList.map((rowdata) => (
          <React.Fragment key={rowdata.id}>
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
                onClick={() => redirect(`/admin/lettertypes/edit/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>
          </React.Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/lettertypes/create" className="btn btn-primary w-100">
            Create Letter Type
          </Link>
        </div>
      </div>
    </>
  );
}
