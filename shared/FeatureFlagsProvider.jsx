/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import PropTypes from 'prop-types';

import { createAuthenticatedAxios, FLIPPER_API_ENDPOINT } from '../../../http/authenticatedAxios';

const FeatureFlagsContext = createContext();

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  return (
    context || {
      featureFlags: [],
      lastUpdatedDate: null,
      refreshFlags: () => {},
    }
  );
};

export const hasFlag = (featureFlags = [], featureFlag = '') => {
  if (!featureFlags) return false;
  return featureFlags?.find((flag) => flag.id === featureFlag)?.state === true;
};

export function FeatureFlagsProvider({ children = null }) {
  const [featureFlags, setFeatureFlags] = useState([]);
  const [lastUpdatedDate, setLastUpdatedDate] = useState(null);

  const axiosRef = useRef(createAuthenticatedAxios());
  const axios = axiosRef.current;

  const fetchData = useCallback(async () => {
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
        setFeatureFlags(nextflagList);
      })
      .catch((error) => {
        console.error(`There was an error retrieving the Feature Flag list: ${error}`);
      });
  }, [axios]);

  const value = useMemo(
    () => ({
      featureFlags,
      hasFlag,
      lastUpdatedDate,
      refreshFlags: fetchData,
    }),
    [featureFlags, lastUpdatedDate, fetchData]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

FeatureFlagsProvider.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
};
