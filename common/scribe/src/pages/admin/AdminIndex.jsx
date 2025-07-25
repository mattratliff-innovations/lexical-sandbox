import React from 'react';
import { DrAlert } from '@druid/druid';
import AdminFormLetterMgt from './AdminFormLetterMgt';
import { H1 } from '../../components/typography';

export default function IndexMain() {
  const SYSTEM_MESSAGE = 'Changes made on the System Administration subpages are system-wide changes that take effect immediately.';
  return (
    <div className="row m-0 py-0 align-items-top">
      <div className="col-sm-1" />
      <div className="col-sm-10 m-0 pt-3 align-top">
        <H1>System Administration</H1>
        <DrAlert type="warn" noCloseBtn alert={SYSTEM_MESSAGE} />
        <AdminFormLetterMgt />
      </div>
    </div>
  );
}
