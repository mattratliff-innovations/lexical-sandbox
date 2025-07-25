import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

export default function PageTitle({ title, children }) {
  // eslint-disable-next-line no-console
  if (!title) console.error('No title is set for this page.');
  const location = useLocation();
  useEffect(() => {
    document.title = title;
  }, [location, title]);
  return children;
}

PageTitle.propTypes = { title: PropTypes.string };
