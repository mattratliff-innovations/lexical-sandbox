import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

export const SPELLING_ERROR_CLASS = 'spelling-error';
export const GRAMMAR_ERROR_CLASS = 'grammar-error';
export const LINGUISTIC_ERROR_CLASS = 'linguistic-error';
export const LETTER_CLOSING = 'Sincerely,';
const SIGNATURE_CLASS = 'dhs-signature-preview-image';

const EndNotesContainer = styled.ul`
    list-style-type: none;
    padding: 0;
    margin: 0;
    margin-left:8px;
`;

export const convertInchesToPixels = (inches) => inches / 0.01041666666; // Google said this is the number of inches in a pixel.

export const findOrganizationSignature = (draft) => {
  if (!draft.letterType?.signatureIncluded) return null;
  if (draft.organizationSignatureId) {
    return draft.organization.organizationSignatures.find((signature) => signature.id === draft.organizationSignatureId);
  }
  return draft.organization.organizationSignatures.find((signature) => signature.default);
};

export const generateSignatureContent = (defaultSignature) => {
  const base64DataUrl = `data:image/png;base64,${defaultSignature?.encodedSignature}`;

  return (
    <div data-testid="signature">
      <br />
      {LETTER_CLOSING}
      <br />
      {defaultSignature?.signatoryName}
      <br />

      <img src={base64DataUrl} alt="Signature" style={{ objectFit: 'scale-down', width: '150px' }} className={SIGNATURE_CLASS} />

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

// param enclosures is the array of draft.enclosures
export function getEnclosuresHtml(enclosures) {
  if (!Array.isArray(enclosures) || enclosures.length === 0) return '';

  return (
    <div>
      <p>
        <strong>Enclosures:</strong>
      </p>
      <ul>
        {enclosures.map((enclosure) => (
          <li key={`on-the-doc-${enclosure.id}`}>{enclosure.name}</li>
        ))}
      </ul>
    </div>
  );
}

export function getEndNotesHtml(endnotes) {
  if (!Array.isArray(endnotes) || endnotes.length === 0) return '';

  return (
    <>
    <strong>Endnotes:</strong>
    <EndNotesContainer>
        <p>{endnotes.map((endnote) => (
          <li>
            <div id={`endnote-${endnote.index}`}>
              <span>
                <a href={`#endnote-ref-${endnote.index}`}>[{endnote.index}]</a>
              </span>&nbsp;
              <span>{endnote.value}</span>
            </div>
          </li>
        ))}
        </p>
    </EndNotesContainer>
    </>
  );
}

GeneratePdfObject.propTypes = {
  pdfData: PropTypes.string,
  inlinePdfScale: PropTypes.string,
};
