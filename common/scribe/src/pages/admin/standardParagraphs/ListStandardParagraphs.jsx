import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { toast, Flip } from 'react-toastify';
import { DrTable, DrColumn, DrButton, DrIcon } from '@druid/druid';
import { PencilFill } from 'react-bootstrap-icons';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TableConfigs from '../../../components/tableConfigs';
import LoadingFallback from '../../../utils/LoadingFallback';

export default function ListStandardParagraphs() {
  const redirect = useNavigate();
  const axios = createAuthenticatedAxios();

  const [standardParagraphList, setStandardParagraphList] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'name', label: 'Paragraph Name' },
    { name: 'code', label: 'Code' },
    { name: 'description', label: 'Description' },
    { name: 'updatedAt', label: 'Last Modified' },
    { name: 'active', label: 'Active' },
    { name: 'locked', label: 'Locked' },
    { name: 'actions', label: 'Actions', noSort: true },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/standard_paragraphs`)
      .then((response) => {
        const responseData = response.data.map((rowdata) => ({
          locked: !!rowdata.locked,
          active: !!rowdata.active,
          description: rowdata.description,
          createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
          id: rowdata.id,
          code: rowdata.code,
          name: rowdata.name,
          updatedAt: rowdata.updatedAt,
        }));

        setStandardParagraphList(responseData);
      })
      .catch(() => {
        toast.error('There was an error retrieving the Standard Paragraphs list', {
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
      {standardParagraphList.length === 0 && (
        <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
          No data found.
        </div>
      )}

      {/* eslint-disable react/jsx-props-no-spreading */}
      <DrTable
        className="h1size"
        title="Standard Paragraphs"
        headers={headers}
        data={standardParagraphList}
        defaultSortCol="name"
        sortDirection="asc"
        {...TableConfigs}>
        {standardParagraphList.map((rowdata) => (
          <Fragment key={`standardParagraphRow-${rowdata.id}`}>
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
                onClick={() => redirect(`/admin/standardparagraphs/${rowdata.id}`)}>
                <PencilFill className="mx-1" />
              </DrButton>
            </DrColumn>

            <DrColumn name="name" uniqueId={rowdata.id}>
              <Link
                data-testid={`edit-${rowdata.name}`}
                aria-label={`edit ${rowdata.name}`}
                id={`edit-${rowdata.name}`}
                to={`/admin/standardparagraphs/${rowdata.id}`}
                title={rowdata.name}>
                {rowdata.name}
              </Link>
            </DrColumn>
          </Fragment>
        ))}
      </DrTable>

      <div className="row">
        <div className="col-2">
          <Link to="/admin/standardparagraphs/create" className="btn btn-primary w-100">
            Create Standard Paragraph
          </Link>
        </div>
      </div>
    </>
  );
}
