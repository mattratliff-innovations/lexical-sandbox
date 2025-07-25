import React, { createContext, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FeatureFlagsProvider } from './pages/admin/flag/FeatureFlagsProvider';

export const AppContext = createContext();

function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [draftOrganization, setDraftOrganization] = useState();
  const [userOrgsListEdit, setUserOrgsListEdit] = useState(false);
  const [draft, setDraft] = useState({});

  const currentUserValues = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      draftOrganization,
      setDraftOrganization,
      userOrgsListEdit,
      setUserOrgsListEdit,
      draft,
      setDraft,
    }),
    [currentUser, setCurrentUser, draftOrganization, setDraftOrganization, userOrgsListEdit, setUserOrgsListEdit, draft, setDraft]
  );

  return (
    <AppContext.Provider value={currentUserValues}>
      <FeatureFlagsProvider pollingInterval="60000">{children}</FeatureFlagsProvider>
    </AppContext.Provider>
  );
}
AppProvider.propTypes = { children: PropTypes.node.isRequired };
export default AppProvider;
