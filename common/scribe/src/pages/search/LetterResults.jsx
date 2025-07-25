import React, { useState, useEffect, Fragment } from 'react';
import './RecentDrafts.css';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { DrTable, DrColumn } from '@druid/druid';
import PropTypes from 'prop-types';
import TableConfigs from '../../components/tableConfigs';
import { BodyRegular } from '../../components/typography';
import { addBusinessDays, federalHolidays } from '../../components/dateHelpers';

export default function LetterResults(props) {
  const { filteredLetters } = props;
  const [letterList, setLetterList] = useState([]);

  const formatLetterDate = (draft) => {
    if (draft.letterDateOverride) {
      return DateTime.fromISO(draft.createdAt).toLocaleString(DateTime.DATETIME_SHORT);
    }

    const theDate = new Date();
    const daysForward = draft?.daysForward || 0;
    const newDate = addBusinessDays(theDate, daysForward, federalHolidays(theDate));
    return DateTime.fromJSDate(newDate).toLocaleString(DateTime.DATETIME_SHORT);
  };

  const headers = [
    { name: 'receiptNumber', label: 'Receipt Number' },
    { name: 'formType', label: 'Form Type' },
    { name: 'letterType', label: 'Letter Type' },
    { name: 'vawa', label: 'VAWA?' },
    { name: 'status', label: 'Status' },
    { name: 'letterDate', label: 'Letter Date' },
    { name: 'createdAt', label: 'Date Created' },
    { name: 'organizationName', label: 'Organization' },
    { name: 'createdBy', label: 'Letter Creator' },
    { name: 'aNumber', label: 'A-Number' },
  ];

  useEffect(() => {
    if (filteredLetters?.length) {
      const responseData = filteredLetters.map((rowdata) => ({
        id: rowdata.id,
        receiptNumber: rowdata.receiptNumber,
        formType: rowdata.formTypeName,
        letterType: rowdata.letterTypeName,
        vawa: rowdata.vawa,
        status: rowdata.statusId,
        letterDate: formatLetterDate(rowdata),
        createdAt: rowdata.createdAt,
        organizationName: rowdata.organizationName,
        createdBy: rowdata.createdBy,
        aNumber: rowdata.aNumber,
      }));

      setLetterList(responseData);
    } else setLetterList([]);
  }, [filteredLetters]);

  return (
    <div className="row">
      <div className="col-sm-1" />
      <div className="col-sm-10 table-horizontal-scroll">
        {letterList.length < 1 ? (
          <BodyRegular data-testid="displayCountDiv" aria-live="polite" role="status">
            No Results Found.
          </BodyRegular>
        ) : (
          <DrTable
            data-testid="drAccessibleTable"
            headers={headers}
            data={letterList}
            defaultSortCol="createdAt"
            sortDirection="asc"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...TableConfigs}>
            {letterList.map((rowdata) => (
              <Fragment key={`letterListRow-${rowdata.id}`}>
                <DrColumn name="receiptNumber" uniqueId={rowdata.id}>
                  <Link
                    data-testid={`edit-${rowdata.id}`}
                    id={`edit-${rowdata.id}`}
                    to={`/letter/preview/${rowdata.id}`}
                    title={`${rowdata.receiptNumber} Letter date: ${rowdata.letterDate}`}>
                    {rowdata.receiptNumber}
                  </Link>
                </DrColumn>

                <DrColumn name="vawa" className="vawa" uniqueId={rowdata.id}>
                  {rowdata.vawa === true ? 'Yes' : 'No'}
                </DrColumn>

                <DrColumn name="status" className="recent-drafts-status" uniqueId={rowdata.id}>
                  {rowdata.status}
                </DrColumn>

                <DrColumn name="createdAt" uniqueId={rowdata.id}>
                  {DateTime.fromISO(rowdata.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}
                </DrColumn>
              </Fragment>
            ))}
          </DrTable>
        )}
      </div>
    </div>
  );
}
LetterResults.propTypes = {
  filteredLetters: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};
