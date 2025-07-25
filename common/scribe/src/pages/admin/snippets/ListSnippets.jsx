import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TableConfigs from '../../../components/tableConfigs';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListSnippets() {
  const [snippetList, setSnippetList] = useState([]);
  const axios = createAuthenticatedAxios();
  const redirect = useNavigate();
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'snippetGroup', label: 'Placeholder Snippet Group' },
    { name: 'activeSnippets', label: 'Active Snippets' },
    { name: 'active', label: 'Active?' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/snippet_groups`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          active: !!rowdata.active,
          id: rowdata.id,
          snippetGroup: rowdata.name,
          activeSnippets: rowdata.snippets.filter((snippet) => snippet.active).length,
        }));

        setSnippetList(responseData);
      })
      .catch(() =>
        toast.error('There was an error retrieving the Snippets list', {
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
      {snippetList.length < 1 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        data-testid="snippetListTable"
        className="h1size"
        title="Standard Placeholder Snippets"
        headers={headers}
        data={snippetList}
        defaultSortCol="snippetGroup"
        sortDirection="asc"
        {...TableConfigs}>
        {snippetList.map((rowdata) => (
          <Fragment key={`snippetGroupRow-${rowdata.id}`}>
            <DrColumn name="snippetGroup" uniqueId={rowdata.id}>
              {rowdata.snippetGroup}
            </DrColumn>

            <DrColumn name="activeSnippets" uniqueId={rowdata.id}>{`${rowdata.activeSnippets} Active Snippets`}</DrColumn>

            <DrColumn name="active" uniqueId={rowdata.id}>
              {rowdata.active && <DrIcon iconName="check" size="small" />}
            </DrColumn>

            <DrColumn name="actions" uniqueId={rowdata.id}>
              <DrButton
                className="px-0"
                ariaLabel={`edit ${rowdata.snippetGroup}`}
                data-testid={`edit-${rowdata.id}`}
                id={`edit-${rowdata.id}`}
                onClick={() => redirect(`/admin/snippets/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>
          </Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/snippets/create" className="btn btn-primary w-100">
            Create Placeholder Snippet
          </Link>
        </div>
      </div>
    </>
  );
}
