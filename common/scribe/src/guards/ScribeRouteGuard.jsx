import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import PageTitle from '../components/PageTitle';
import NoPermissions from './NoPermissions';
import { idTokenHasAdminPrivileges, idTokenHasIsoPrivileges } from '../oidc/Authentication';
import { AppContext } from '../AppProvider';

const NO_ORGANIZATIONS_JSX = (
  <>
    You are not assigned to any organizations.
    <br />
    Please contact your supervisor to add you to your correct organizations.
  </>
);

const NO_PERMISSIONS_JSX = (
  <>
    We&apos;re sorry, but it appears that you don&apos;t have access to this page.
    <br />
    Please contact your administrator if you believe that this is in error.
  </>
);

const hasOrganizations = () => {
  const { currentUser } = useContext(AppContext);
  return currentUser?.organizations?.length > 0;
};

const renderNoPermissions = () => {
  const messageJsx = hasOrganizations() ? NO_PERMISSIONS_JSX : NO_ORGANIZATIONS_JSX;
  return <NoPermissions messageJsx={messageJsx} />;
};

function IsoRouteGuard({ children }) {
  const { currentUser } = useContext(AppContext);
  if (idTokenHasIsoPrivileges() && hasOrganizations()) {
    return children;
  }
  if (!currentUser || !currentUser.organizations) {
    return null;
  }

  return renderNoPermissions();
}

function AdminRouteGuard({ children }) {
  if (idTokenHasAdminPrivileges() && (hasOrganizations() || window.location.pathname.indexOf('/admin') === 0)) {
    return children;
  }
  return renderNoPermissions();
}

const adminProtected = (Component, options) => (
  <AdminRouteGuard>
    <PageTitle title={options?.title} />
    <Component />
  </AdminRouteGuard>
);

const isoProtected = (Component, options) => (
  <IsoRouteGuard>
    <PageTitle title={options?.title} />
    <Component />
  </IsoRouteGuard>
);

IsoRouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
};

AdminRouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
};

export { adminProtected, isoProtected };
