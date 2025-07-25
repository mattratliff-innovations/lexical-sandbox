import React, { useState } from 'react';
import { DrTable, DrColumn } from '@druid/druid';
import { Switch, FormControlLabel } from '@mui/material';
import TableConfigs from '../../../components/tableConfigs';
import { createAuthenticatedAxios, FLIPPER_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { useFeatureFlags } from './FeatureFlagsProvider';

function ControlledSwitch(data) {
  const { refreshFlags } = useFeatureFlags();
  const [checked, setChecked] = useState(data?.isChecked);
  const axios = createAuthenticatedAxios();

  const handleChange = (event) => {
    setChecked(event.target.checked);
    const axiosAction = event.target.checked ? axios.post : axios.delete;
    axiosAction(`${FLIPPER_API_ENDPOINT}/features/${data?.id}/boolean`).then((response) => {
      console.log(response);
      refreshFlags();
    });
  };

  return <FormControlLabel control={<Switch checked={checked} onChange={handleChange} name="controlled-switch" />} />;
}

export default function Flags() {
  const { featureFlags, lastUpdatedDate } = useFeatureFlags();

  const headers = [
    { name: 'name', label: 'Name' },
    { name: 'description', label: 'Description', noSort: true },
    { name: 'state', label: 'Enabled' },
  ];

  return (
    <div className="row m-0 py-0 align-items-top">
      <div className="col-10 m-0 pt-3 pb-5 align-top">
        {featureFlags.length < 1 && (
          <div className="adminListCreateButtonDiv" data-testid="adminListCreateButtonDiv" aria-live="polite" role="status">
            No data found.
          </div>
        )}

        <div className="row">Last Updated: {lastUpdatedDate}</div>
        <br />
        {/* eslint-disable react/jsx-props-no-spreading */}
        <DrTable
          className="h1size"
          title="Feature Flags"
          headers={headers}
          data={featureFlags}
          data-testid="feature-flags-table"
          defaultSortCol="name"
          sortDirection="asc"
          {...TableConfigs}>
          {featureFlags.map((rowdata) => (
            <React.Fragment key={`userRow-${rowdata.id}`}>
              <DrColumn name="name" uniqueId={rowdata.id}>
                {rowdata.name}
              </DrColumn>

              <DrColumn name="state" uniqueId={rowdata.id}>
                <ControlledSwitch id={rowdata.id} isChecked={rowdata.state} />
              </DrColumn>

              <DrColumn name="description" uniqueId={rowdata.id}>
                {rowdata.description}
              </DrColumn>
            </React.Fragment>
          ))}
        </DrTable>
      </div>
    </div>
  );
}
