import { useState, useRef } from 'react';

/**
 * Custom hook to track loading state for multiple async requests.
 *
 * @param {number} totalRequests - Total number of requests you want to track.
 * @returns {object} - { loading: boolean, markFinished: function }
 *
 * Usage:
 * const { loading, markFinished } = useMultiRequestLoading(3);
 *
 * // call markFinished() in each request's finally to decrement loading counter
 *
 */
export default function useMultiRequestLoading(totalRequests) {
  // true while any requests are still pending
  const [loading, setLoading] = useState(true);

  // mutable ref to track how many requests have completed without triggering rerenders
  const completedRef = useRef(0);

  /**
   * Call this function in the finally block of each request.
   * When all requests finish, loading will be set to false.
   */
  const markFinished = () => {
    completedRef.current += 1;

    if (completedRef.current >= totalRequests) {
      setLoading(false);
    }
  };

  return { loading, markFinished };
}
