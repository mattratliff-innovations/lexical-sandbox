/* eslint-disable require-loading-check-for-axios */
import { useState, useEffect } from 'react';
import { createAuthenticatedAxios, FLIPPER_API_ENDPOINT } from '../../../http/authenticatedAxios';

// Custom hook for polling
export default function useFeatureFlagPolling(interval = 60000) {
  const [lastUpdatedDate, setLastUpdatedDate] = useState(null);
  const [flagList, setflagList] = useState([]);

  const axios = createAuthenticatedAxios();

  useEffect(() => {
    let intervalId = 0;

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
          console.log('updating');
          setflagList(nextflagList);
        })
        .catch(() => {
          // eslint-disable-next-line no-restricted-globals
          location.reload();
          // console.error(`There was an error retrieving the Feature Flag list: ${error}`)
        });
    };

    // Fetch immediately on mount
    fetchData();

    // Set up polling at the specified interval
    intervalId = setInterval(fetchData, interval);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [interval]); // Re-run effect if URL or interval changes

  return { flagList, lastUpdatedDate };
}
