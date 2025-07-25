import React from 'react';
import { DrAlert } from '@druid/druid';
import PropTypes from 'prop-types';
import { useAdminFormContext } from '../../contexts/AdminFormContext';

const warnDefault = 'All fields marked with a red asterisk (*) are required.';
const errorDefault = `Some required fields need to be updated. ${warnDefault}`;

export default function CustomError({ errorType = 'info' }) {
  const { adminErrorMessage } = useAdminFormContext();

  return (
    <div data-testid="druid-alert-container">
      <DrAlert
        type={adminErrorMessage ? 'error' : errorType}
        noCloseBtn
        variant="standard"
        alert={errorType === 'error' || adminErrorMessage ? errorDefault : warnDefault}
        styles={{ rootContainer: { marginBottom: '1rem' } }}>
        <div data-testid="post-error">{adminErrorMessage}</div>
      </DrAlert>
    </div>
  );
}

CustomError.propTypes = { errorType: PropTypes.string };
