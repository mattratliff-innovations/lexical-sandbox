import React, { useState, useEffect, Fragment } from 'react';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import TableConfigs from '../../../components/tableConfigs';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { getRoleNameFromPermission } from '../../../oidc/Authentication';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function Users() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email', noSort: true },
    { name: 'role', label: 'Role', noSort: true },
    { name: 'organizations', label: 'Organization(s)', noSort: true },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  const middleInitial = (rowdata) => (rowdata.middleInitial ? ` ${rowdata.middleInitial.substring(0, 1)}` : '');

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/users`)
      .then((response) => {
        const nextUserList = response.data.map((rowdata) => ({
          id: rowdata.id,
          name: `${rowdata.lastName}, ${rowdata.firstName}${middleInitial(rowdata)}`,
          email: rowdata.email,
          role: getRoleNameFromPermission(rowdata.roleName),
          organizations: rowdata.organizations.map((org) => org.name).join(', '),
        }));

        setUserList(nextUserList);
      })
      .catch(() =>
        toast.error('There was an error retrieving the User list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingFallback />;

  return (
    <div className="row m-0 py-0 align-items-top">
      <div className="col-10 m-0 pt-3 pb-5 align-top">
        {userList.length < 1 && (
          <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
            No data found.
          </div>
        )}

        {/* eslint-disable react/jsx-props-no-spreading */}
        <DrTable
          className="h1size"
          title="Users"
          headers={headers}
          data={userList}
          data-testid="users-table"
          defaultSortCol="name"
          sortDirection="asc"
          {...TableConfigs}>
          {userList.map((rowdata) => (
            <Fragment key={`userRow-${rowdata.id}`}>
              <DrColumn name="actions" uniqueId={rowdata.id}>
                <DrButton
                  className="px-0"
                  ariaLabel={`edit ${rowdata.name}`}
                  data-testid={`edit-${rowdata.id}`}
                  id={`edit-${rowdata.id}`}
                  onClick={() => redirect(`/admin/users/${rowdata.id}`)}>
                  <PencilFill className="mx-1" />
                </DrButton>
              </DrColumn>
            </Fragment>
          ))}
        </DrTable>
      </div>
    </div>
  );
}
