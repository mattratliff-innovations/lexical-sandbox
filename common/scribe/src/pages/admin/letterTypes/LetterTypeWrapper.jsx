import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminQuickActions from '../../../layouts/AdminQuickActions';

export default function LetterTypeWrapper() {
  const [handleButtonClick, setHandleButtonClick] = useState(() => () => {});
  const quickActions = {
    listUrl: '/admin/lettertypes',
    listLabel: 'Letter Types',
    createUrl: '/admin/lettertypes/create',
    createLabel: 'Create Letter Type',
    saveLabel: 'Save Letter Type',
    saveButtonId: 'quickActionSaveButton',
  };

  return (
    <div className="row m-0 py-0 align-items-top">
      <div className="col-2 m-0 p-0 pt-3 pb-5 align-top" style={{ minHeight: '600px' }}>
        <AdminQuickActions quickActions={quickActions} handleButtonClick={handleButtonClick} />
      </div>

      <div className="col-10 m-0 pt-3 pb-5 align-top">
        <Outlet context={{ setHandleButtonClick }} />
      </div>
    </div>
  );
}
