import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';

const useModalCheck = (params) => {
  const [isBlocked, setIsBlocked] = useState(false);
  // eslint-disable-next-line arrow-body-style
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return currentLocation.pathname !== nextLocation.pathname && nextLocation.pathname !== '/logout' && params;
  });

  useEffect(() => {
    if (blocker.state === 'blocked') setIsBlocked(true);
  }, [blocker.state]);
  return { isBlocked, setIsBlocked, blocker };
};
export default useModalCheck;
