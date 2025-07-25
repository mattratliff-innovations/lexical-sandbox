import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminQuickActions from '../../../layouts/AdminQuickActions';

export default function UserWrapper() {
  const [handleButtonClick, setHandleButtonClick] = useState(() => () => {});
  const quickActions = {
    listUrl: '/admin/users',
    listLabel: 'Users',
    saveLabel: 'Save User',
    saveButtonId: 'quickActionSaveButton',
  };

  return (
    <div className="row m-0">
      <div className="col-2" style={{ minHeight: '600px' }}>
        <AdminQuickActions quickActions={quickActions} handleButtonClick={handleButtonClick} />
      </div>

      <div className="col-10">
        <Outlet context={{ setHandleButtonClick }} />
      </div>
    </div>
  );
}
