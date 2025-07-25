/* eslint-disable require-loading-check-for-axios */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedAxios, FLIPPER_API_ENDPOINT } from '../../../http/authenticatedAxios';

const FeatureFlagsContext = createContext();

// Create a custom hook for using the feature flags
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

// eslint-disable-next-line react/prop-types
export function FeatureFlagsProvider({ children, pollingInterval = 60000 }) {
  const [featureFlags, setFeatureFlags] = useState([]);
  const [lastUpdatedDate, setLastUpdatedDate] = useState(null);

  const axios = createAuthenticatedAxios();

  const fetchData = async () => {
    axios
      .get(`${FLIPPER_API_ENDPOINT}/features`)
      .then((response) => {
        setLastUpdatedDate(new Date().toString());
        const nextflagList = response.data.features.map((rowdata) => ({
          id: rowdata.key,
          name: rowdata.key,
          description: rowdata.description,
          state: rowdata.state === 'on',
        }));
        console.log('updating flags');
        setFeatureFlags(nextflagList);
      })
      .catch((error) => {
        console.error(`There was an error retrieving the Feature Flag list: ${error}`);
      });
  };

  // Initialize feature flags on mount
  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval]);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = {
    featureFlags,
    lastUpdatedDate,
    refreshFlags: fetchData,
  };

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}
