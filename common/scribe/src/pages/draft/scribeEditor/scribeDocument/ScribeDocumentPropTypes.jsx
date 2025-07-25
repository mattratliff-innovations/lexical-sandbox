import PropTypes from 'prop-types';

const draftProptypes = PropTypes.shape({
  applicants: PropTypes.arrayOf({
    aNumber: PropTypes.string.isRequired,
    address: PropTypes.shape({
      aptSuiteFloor: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
      foreignAddress: PropTypes.bool.isRequired,
      postalCode: PropTypes.string.isRequired,
      preAddress: PropTypes.string.isRequired,
      province: PropTypes.string.isRequired,
      state: PropTypes.shape({
        id: PropTypes.string,
        code: PropTypes.string,
        name: PropTypes.string,
      }),
      street: PropTypes.string.isRequired,
      zipCode: PropTypes.string.isRequired,
    }).isRequired,
    dateOfBirth: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    letterRecipient: PropTypes.bool.isRequired,
  }),
  registration: PropTypes.shape({
    formTypeName: PropTypes.string.isRequired,
    receiptNumber: PropTypes.string.isRequired,
  }).isRequired,
  daysForward: PropTypes.number.isRequired,
  endsWith: PropTypes.string.isRequired,
  endsWithLocked: PropTypes.bool.isRequired,
  marginBottom: PropTypes.string.isRequired,
  marginLeft: PropTypes.string.isRequired,
  marginRight: PropTypes.string.isRequired,
  marginTop: PropTypes.string.isRequired,
  organizationSignature: PropTypes.shape({
    originalFilename: PropTypes.string.isRequired,
    signatoryName: PropTypes.string.isRequired,
    signatoryTitle: PropTypes.string.isRequired,
    signatureImageUrl: PropTypes.string.isRequired,
  }),
  row1Col1: PropTypes.string.isRequired,
  row1Col2: PropTypes.string.isRequired,
  row2Col1: PropTypes.string.isRequired,
  row2Col2: PropTypes.string.isRequired,
  row3Col1: PropTypes.string.isRequired,
  row3Col2: PropTypes.string.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      order: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  startsWith: PropTypes.string.isRequired,
  startsWithLocked: PropTypes.bool.isRequired,
});

export default draftProptypes;
