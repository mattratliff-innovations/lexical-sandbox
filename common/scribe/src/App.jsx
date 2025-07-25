import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { processOidcSession, startIdTokenRefreshTimer } from './oidc/Authentication';
import upsertUser from './oidc/SaveUserToken';

import generateRouter from './AppRoutes';

function ShowLoading() {
  return (
    <div className="d-flex flex-column min-vh-100 min-vw-100" data-testid="loadingIndicator">
      <div className="d-flex flex-grow-1 justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const interval = startIdTokenRefreshTimer();
    return () => clearInterval(interval);
  }, []);

  const oidcProcessResult = processOidcSession();
  if (oidcProcessResult.showLoading) return <ShowLoading />;
  upsertUser();

  return <RouterProvider router={generateRouter()} />;
}

export default App;
