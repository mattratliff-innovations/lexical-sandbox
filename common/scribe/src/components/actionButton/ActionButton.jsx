import React, { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

import './ActionButton.css';

export default function ActionButton({ icon, navLinkURL = '', text = '', ...otherProps }) {
  return !navLinkURL ? (
    <Button className="action-button__btn" {...otherProps}>
      <span className="action-button__icon-wrap">{icon && createElement(icon, { className: 'action-button__icon' })}</span>
      <span className="action-button__text">{text}</span>
    </Button>
  ) : (
    <NavLink to={navLinkURL} className={({ isActive }) => (isActive ? 'action-button__link active' : 'action-button__link')} {...otherProps} end>
      <span className="action-button__icon-wrap">{icon && createElement(icon, { className: 'action-button__icon' })}</span>
      <span className="action-button__text">{text}</span>
    </NavLink>
  );
}

ActionButton.propTypes = {
  icon: PropTypes.element.isRequired,
  navLinkURL: PropTypes.string,
  text: PropTypes.string,
};
