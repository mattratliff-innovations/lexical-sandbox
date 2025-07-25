import React, { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { clearSession } from '../../oidc/Authentication';
import UtilityModal from '../util/UtilityModal';

export default function Logout() {
  useEffect(() => {
    clearSession();
  }, []);
  useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname);
  return <UtilityModal isOpen type="logout" />;
}
