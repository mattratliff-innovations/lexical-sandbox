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
  margin-left: 8px;
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

// Helper function to extract endnotes from HTML content
export const extractEndnotesFromHtml = (htmlContent) => {
  if (!htmlContent) {
    console.log('No HTML content provided to extractEndnotesFromHtml');
    return [];
  }

  console.log('Extracting endnotes from HTML:', htmlContent);

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const endnotes = [];

  // Look for spans with footnote class and extract endnote data
  const allSpans = tempDiv.querySelectorAll('span');
  console.log(`Found ${allSpans.length} span elements`);

  allSpans.forEach((element, idx) => {
    console.log(`Span ${idx}:`, element.outerHTML);

    // Check if this is an endnote element by looking for the sup element with bracket notation
    const supElement = element.querySelector('sup');
    if (supElement && supElement.textContent.match(/\[(\d+)\]/)) {
      const match = supElement.textContent.match(/\[(\d+)\]/);
      const id = match[1];
      const text = element.childNodes[0]?.textContent || element.textContent.replace(supElement.textContent, '').trim();

      console.log(`Found endnote: ID=${id}, text="${text}"`);

      // Try to get the endnote value from data attributes or default to empty
      let value = element.getAttribute('data-endnote-value') || '';
      console.log(`Endnote value from data attribute: "${value}"`);

      // If we can't find it in attributes, check if it's stored in the global endnote data
      if (!value && window.lexicalEditor) {
        try {
          window.lexicalEditor.getEditorState().read(() => {
            const root = window.lexicalEditor.getEditorState()._nodeMap;
            for (const [key, node] of root) {
              if (node.__type === 'footnote' && node.__footnoteId === id) {
                value = node.__endnoteValue || '';
                console.log(`Found endnote value from global editor: "${value}"`);
                break;
              }
            }
          });
        } catch (e) {
          // Fallback if we can't access the editor state
          console.warn('Could not access endnote value from editor state:', e);
        }
      }

      if (id && !endnotes.find((note) => note.index === id)) {
        const endnote = {
          index: id,
          value: value,
          text: text,
        };
        console.log('Adding endnote:', endnote);
        endnotes.push(endnote);
      }
    } else {
      console.log(`Span ${idx} is not an endnote`);
    }
  });

  console.log('Final extracted endnotes:', endnotes);

  // Sort by index
  return endnotes.sort((a, b) => parseInt(a.index) - parseInt(b.index));
};

export function getEndNotesHtml(endnotes) {
  // Handle both array format and HTML extraction
  let notesToRender = [];

  if (Array.isArray(endnotes)) {
    notesToRender = endnotes;
  } else if (typeof endnotes === 'string') {
    notesToRender = extractEndnotesFromHtml(endnotes);
  }

  if (notesToRender.length === 0) return '';

  return (
    <>
      <strong>Endnotes:</strong>
      <EndNotesContainer>
        {notesToRender.map((endnote) => (
          <li key={`endnote-${endnote.index}`}>
            <div id={`endnote-${endnote.index}`}>
              <span>
                <a href={`#endnote-ref-${endnote.index}`}>[{endnote.index}]</a>
              </span>
              &nbsp;
              <span>{endnote.value}</span>
            </div>
          </li>
        ))}
      </EndNotesContainer>
    </>
  );
}

GeneratePdfObject.propTypes = {
  pdfData: PropTypes.string,
  inlinePdfScale: PropTypes.string,
};
