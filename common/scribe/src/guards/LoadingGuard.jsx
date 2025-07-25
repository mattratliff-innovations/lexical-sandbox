import PropTypes from 'prop-types';
import LoadingFallback from '../utils/LoadingFallback';

export default function LoadingGuard({ loading, blank = false, fallback = null, children }) {
  if (loading) return <LoadingFallback fallback={fallback} blank={blank} />;
  return children;
}

LoadingGuard.propTypes = {
  loading: PropTypes.bool.isRequired,
  blank: PropTypes.bool,
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};
