import PropTypes from 'prop-types';
import SkeletonPage from '../components/SkeletonPage';

/**
 * LoadingFallback
 *
 * Returns the loading fallback content based on the provided options:
 * - If `fallback` is provided, returns it (custom fallback).
 * - Else if `blank` is true, returns a visually hidden div with aria-hidden for accessibility.
 * - Else returns the default <SkeletonPage /> component.
 *
 * This function can be used:
 * - In page-level conditionals for early return: if (loading) return LoadingFallback(...)
 * - Inside LoadingGuard or other wrappers to keep fallback consistent.
 *
 * @param {object} options
 * @param {React.ReactNode} [options.fallback] Optional custom fallback UI.
 * @param {boolean} [options.blank=false] Whether to render a blank (hidden) fallback.
 * @returns {React.ReactNode} The fallback component to render during loading.
 */
export default function LoadingFallback({ fallback, blank = false } = {}) {
  if (fallback) {
    return fallback;
  }

  if (blank) {
    // Blank fallback: hidden div to preserve layout/accessibility,
    // but visually hidden and ignored by assistive tech.
    return <div style={{ display: 'none' }} aria-hidden="true" data-testid="loading-blank" />;
  }

  // Default fallback: SkeletonPage UI component.
  return <SkeletonPage />;
}

LoadingFallback.propTypes = {
  fallback: PropTypes.node,
  blank: PropTypes.bool,
};
