import React from 'react';
import PropTypes from 'prop-types';

function ContactCardErrorMessage(props) {
  const { contact } = props;

  return (
    contact?.errors?.print && (
      <div className="text-danger" role="alert" aria-live="polite">
        {' '}
        <strong>{contact.errors.print}</strong>
      </div>
    )
  );
}

ContactCardErrorMessage.propTypes = {
  contact: PropTypes.shape({
    errors: PropTypes.shape({
      print: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};

export default ContactCardErrorMessage;
