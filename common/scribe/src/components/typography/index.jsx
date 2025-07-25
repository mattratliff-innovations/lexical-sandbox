import React from 'react';
import PropTypes from 'prop-types';
import { DrTypography } from '@druid/druid';

// eslint-disable-next-line react/jsx-props-no-spreading
export function BodySmall({ children, ...rest }) {
  return (
    <DrTypography variant="bodySmall" {...rest}>
      {children}
    </DrTypography>
  );
}

// eslint-disable-next-line react/jsx-props-no-spreading
export function BodyRegular({ children, ...rest }) {
  return (
    <DrTypography variant="bodyRegular" {...rest}>
      {children}
    </DrTypography>
  );
}

// eslint-disable-next-line react/jsx-props-no-spreading
export function BodyLarge({ children, ...rest }) {
  return (
    <DrTypography variant="bodyLarge" {...rest}>
      {children}
    </DrTypography>
  );
}

// eslint-disable-next-line react/jsx-props-no-spreading
export function H1({ children, ...rest }) {
  return (
    <DrTypography variant="h1" {...rest}>
      {children}
    </DrTypography>
  );
}

// eslint-disable-next-line react/jsx-props-no-spreading
export function H2({ children, ...rest }) {
  return (
    <DrTypography variant="h2" {...rest}>
      {children}
    </DrTypography>
  );
}

// eslint-disable-next-line react/jsx-props-no-spreading
export function H3({ children, ...rest }) {
  return (
    <DrTypography variant="h3" {...rest}>
      {children}
    </DrTypography>
  );
}

BodySmall.propTypes = { children: PropTypes.node.isRequired };
BodyRegular.propTypes = { children: PropTypes.node.isRequired };
BodyLarge.propTypes = { children: PropTypes.node.isRequired };
H1.propTypes = { children: PropTypes.node.isRequired };
H2.propTypes = { children: PropTypes.node.isRequired };
H3.propTypes = { children: PropTypes.node.isRequired };
