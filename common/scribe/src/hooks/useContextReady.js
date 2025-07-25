import { useState, useEffect } from 'react';

/**
 * Waits until a context or prop value is "ready" (i.e. not undefined or null).
 *
 * @param {*} value - Any value you want to wait on (e.g., context data)
 * @param {Function} [validator] - Optional function: (value) => boolean,
 *                                 returns true when "ready".
 * @returns {boolean} ready - True when validator(value) returns true or value !== undefined.
 *
 * Usage:
 *   const ready = useContextReady(adminFormData);
 *   const isReady = useContextReady(user, v => v != null && v.loaded);
 */
export default function useContextReady(value, validator) {
  const check = validator || ((v) => v !== undefined && v !== null);
  const [ready, setReady] = useState(check(value));

  useEffect(() => {
    if (check(value) && !ready) {
      setReady(true);
    }
  }, [value, ready, check]);

  return ready;
}
