import React, { useState, useEffect, Fragment } from 'react';
import './RecentDrafts.css';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { toast, Flip } from 'react-toastify';
import { DrColumn, DrTable } from '@druid/druid';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import TableConfigs from '../../components/tableConfigs';
import { BodyRegular } from '../../components/typography';
import LoadingGuard from '../../guards/LoadingGuard';

export default function RecentDrafts() {
  const axios = createAuthenticatedAxios();

  const [draftList, setDraftList] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = [
    { name: 'receiptNumber', label: 'Receipt Number' },
    { name: 'formType', label: 'Form Type' },
    { name: 'letterType', label: 'Letter Type' },
    { name: 'organization', label: 'Organization' },
    { name: 'status', label: 'Status' },
    { name: 'lastModified', label: 'Last Modified' },
  ];

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/letters`)
      .then((response) => {
        if (response.data && response.data.length) {
          const responseData = response.data.map((rowdata) => ({
            createdAt: DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT),
            formType: rowdata.formTypeName,
            letterType: rowdata.letterTypeName,
            id: rowdata.id,
            organization: rowdata.organizationName,
            status: rowdata.statusId,
            receiptNumber: rowdata.receiptNumber,
            lastModified: rowdata.updatedAt,
          }));

          setDraftList(responseData);
          setDataLoaded(true);
        }
      })
      .catch(() =>
        toast.error('There was an error retrieving the Recent Drafts list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="row">
      <div className="col-sm-2" />
      <div className="col-sm-8">
        <LoadingGuard loading={loading}>
          {draftList?.length === 0 && dataLoaded && (
            <BodyRegular data-testid="displayCountDiv" aria-live="polite" role="status">
              No data found.
            </BodyRegular>
          )}

          <DrTable
            title="My Recent Drafts"
            headers={headers}
            data={draftList}
            defaultSortCol="lastModified"
            sortDirection="desc"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...TableConfigs}>
            {draftList.map((rowdata) => (
              <Fragment key={`draftListRow-${rowdata.id}`}>
                <DrColumn name="receiptNumber" uniqueId={rowdata.id}>
                  <Link data-testid={`edit-${rowdata.id}`} id={`edit-${rowdata.id}`} to={`/draft/${rowdata.id}`}>
                    {rowdata.receiptNumber}
                  </Link>
                </DrColumn>

                <DrColumn name="status" className="recent-drafts-status" uniqueId={rowdata.id}>
                  {rowdata.status}
                </DrColumn>

                <DrColumn name="lastModified" uniqueId={rowdata.id}>
                  {DateTime.fromISO(rowdata.lastModified).toLocaleString(DateTime.DATETIME_SHORT)}
                </DrColumn>
              </Fragment>
            ))}
          </DrTable>
        </LoadingGuard>
      </div>
    </div>
  );
}
