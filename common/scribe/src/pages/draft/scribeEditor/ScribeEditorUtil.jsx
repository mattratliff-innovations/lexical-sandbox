import React from 'react';
import PropTypes from 'prop-types';

export const SPELLING_ERROR_CLASS = 'spelling-error';
export const GRAMMAR_ERROR_CLASS = 'grammar-error';
export const LINGUISTIC_ERROR_CLASS = 'linguistic-error';
export const LETTER_CLOSING = 'Sincerely,';
const SIGNATURE_CLASS = 'dhs-signature-preview-image';

export const convertInchesToPixels = (inches) => inches / 0.01041666666; // Google said this is the number of inches in a pixel.

export const findOrganizationSignature = (draft) => {
  if (!draft.letterType?.signatureIncluded) return null;
  if (draft.organizationSignatureId) {
    return draft.organization.organizationSignatures.find((signature) => signature.id === draft.organizationSignatureId);
  }
  return draft.organization.organizationSignatures.find((signature) => signature.default);
};

export const generateSignatureContent = (defaultSignature) => {
  // There are two ways to show images on a PDF. Embed the massive base64 encoded dataset or link to the image.
  // The advantage to the former is that the imagine does not require internet connection, but the latter does, when view through
  // a webpage. We DO NOT have a problem since PDFReactor auto-inject the image into the PDF. At this point the latter is a better
  // solution since it is simplier, more robust, and has a much smaller footprint. In contrast the former is unstable due to the
  // nature of changing architecture; thus why the signature broke. The base64DataUrl method is commented out below in case there
  // is a future need for it.
  // const base64DataUrl = `data:image/png;base64,${defaultSignature?.encodedSignature}`;
  const imageUrl = defaultSignature?.signatureImageUrl;

  return (
    <div data-testid="signature">
      <br />
      {LETTER_CLOSING}
      <br />
      {defaultSignature?.signatoryName}
      <br />

      <img src={imageUrl} alt="Signature" style={{ objectFit: 'scale-down', width: '150px' }} className={SIGNATURE_CLASS} />

      <br />
      {defaultSignature?.signatoryTitle}
    </div>
  );
};

export function GeneratePdfObject({ pdfData = '', inlinePdfScale = '' }) {
  return (
    <object
      aria-label="pdf"
      data={`${pdfData}#toolbar=0&zoom=${inlinePdfScale}`}
      data-testid="inline-pdf"
      type="application/pdf"
      className="inlinePdf"
    />
  );
}
GeneratePdfObject.propTypes = {
  pdfData: PropTypes.string,
  inlinePdfScale: PropTypes.string,
};
