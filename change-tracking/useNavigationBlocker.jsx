import { useEffect, useContext } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 * Works with React Router v6
 * 
 * @param {boolean} shouldBlock - Whether to block navigation
 * @param {function} checkForChanges - Function to check for structure changes
 */
export function useNavigationBlocker(shouldBlock, checkForChanges) {
  const navigator = useContext(NavigationContext).navigator;

  useEffect(() => {
    if (!shouldBlock) return;

    const originalPush = navigator.push;
    const originalReplace = navigator.replace;

    // Override push and replace to check for unsaved changes
    navigator.push = (...args) => {
      // Check for structure changes before navigation
      if (checkForChanges) {
        checkForChanges();
      }

      if (shouldBlock) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Do you want to leave without saving?'
        );
        if (!confirmLeave) {
          return; // Block navigation
        }
      }

      originalPush.apply(navigator, args);
    };

    navigator.replace = (...args) => {
      // Check for structure changes before navigation
      if (checkForChanges) {
        checkForChanges();
      }

      if (shouldBlock) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Do you want to leave without saving?'
        );
        if (!confirmLeave) {
          return; // Block navigation
        }
      }

      originalReplace.apply(navigator, args);
    };

    // Cleanup: restore original methods
    return () => {
      navigator.push = originalPush;
      navigator.replace = originalReplace;
    };
  }, [shouldBlock, checkForChanges, navigator]);
}
