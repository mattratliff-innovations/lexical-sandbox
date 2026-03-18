/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import React from 'react';

// import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Spinner from '../../components/spinner/Spinner';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../http/authenticatedAxios';
import { showToastError } from '../../utils/toastHelpers';
import { hydrateVariablesHeadlessly } from './scribeEditor/scribeDocument/lexical/letterEditor/plugins/VariablePlugin';

export const SPELLING_ERROR_CLASS = 'spelling-error';
export const GRAMMAR_ERROR_CLASS = 'grammar-error';
export const LINGUISTIC_ERROR_CLASS = 'linguistic-error';
export const LETTER_CLOSING = 'Sincerely,';
const SIGNATURE_CLASS = 'dhs-signature-preview-image';

// const EndNotesContainer = styled.ul`
//   list-style-type: none;
//   padding: 0;
//   margin: 0;
//   margin-left: 8px;
// `;

/**
 * Sets the letter rowcol data used for variable validation
 * @param {Letter} letter
 * @param {boolean} clearData Y/N clear the rowcol data
 * @param {boolean} hydrate  Y/N apply hydration
 * @returns
 */
export function setHeaderData(letter, clearData = false, hydrate = false) {
  if (!letter.header) return letter;

  Object.keys(letter.header).forEach((key) => {
    if (key.startsWith('row')) {
      letter[key] = clearData ? '' : hydrate ? hydrateVariablesHeadlessly(letter.header[key], letter) : letter.header[key];
    }
  });
  return letter;
}

export const HEADER_ROW_COL_LIST = ['row1Col1', 'row1Col2', 'row2Col1', 'row2Col2', 'row3Col1', 'row3Col2'];

export function sortSectionsByOrder(letter) {
  if (!letter?.sections) return letter;

  return {
    ...letter,
    sections: [...letter.sections].sort((a, b) => a.order - b.order),
  };
}

export function hasValidationErrors(draft) {
  const errors =
    draft.errors?.print ||
    draft.contacts?.some((contact) => contact.errors?.print) ||
    draft.contacts?.some((contact) => contact.address?.errors?.print);
  if (errors === undefined) return false;
  return errors;
}

export const hydrateHeaders = (draft) => {
  const hydratedHeaders = HEADER_ROW_COL_LIST.reduce(
    (resultMap, rowCol) => ({
      ...resultMap,
      [rowCol]: hydrateVariablesHeadlessly(draft[rowCol], draft),
    }),
    {}
  );
  return hydratedHeaders;
};

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

export const updateDraft = async (setDraft, setInitialDraft, letterEditorRef, defaultSignature, draft, markAllClean) => {
  const axios = createAuthenticatedAxios();
  const draftData = {
    ...letterEditorRef.current.letterDraftData(),
    organizationSignatureId: defaultSignature?.id,
  };
  return axios
    .put(`${APP_API_ENDPOINT}/letters/${draft.id}`, { letter: draftData })
    .then((response) => {
      setDraft((prev) => ({
        ...prev,
        sections: response.data.sections,
        updatedAt: response.data.updatedAt,
      }));

      // Used by the letter change tracker to track new/deleted/reordered sections
      setInitialDraft(sortSectionsByOrder(response.data));

      // Mark all changes as clean in the tracker
      if (markAllClean !== null) {
        markAllClean();
      }
      return response.data;
    })
    .catch((err) => {
      showToastError('Letter could not be updated');
    });
};

export function GeneratePdfObject({ pdfData = '', inlinePdfScale = '' }) {
  return (
    <Spinner isVisible={!pdfData}>
      <object
        aria-label="pdf"
        data={`${pdfData}#toolbar=0&zoom=${inlinePdfScale}`}
        data-testid="inline-pdf"
        type="application/pdf"
        className="inlinePdf"
      />
    </Spinner>
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

// ENDNOTES is not active at the momenent. TBD
// Helper function to extract endnotes from HTML content
export const extractEndnotesFromHtml = (htmlContent) =>
  // if (!htmlContent) {
  [];
// }

// // Create a temporary DOM element to parse the HTML
// const tempDiv = document.createElement('div');
// tempDiv.innerHTML = htmlContent;

// const endnotes = [];

// // Look for spans with footnote class and extract endnote data
// const allSpans = tempDiv.querySelectorAll('span');

// allSpans.forEach((element) => {
//   // Check if this is an endnote element by looking for the sup element with bracket notation
//   const supElement = element.querySelector('sup');
//   if (supElement && supElement.textContent.match(/\[(\d+)\]/)) {
//     const match = supElement.textContent.match(/\[(\d+)\]/);
//     const id = match[1];
//     const text = element.childNodes[0]?.textContent || element.textContent.replace(supElement.textContent, '').trim();

//     // Try to get the endnote value from data attributes or default to empty
//     let value = element.getAttribute('data-endnote-value') || '';

//     // If we can't find it in attributes, check if it's stored in the global endnote data
//     if (!value && window.lexicalEditor) {
//       try {
//         window.lexicalEditor.getEditorState().read(() => {
//           const root = window.lexicalEditor.getEditorState()._nodeMap;
//           for (const [, node] of root) {
//             if (node.__type === 'footnote' && node.__footnoteId === id) {
//               value = node.__endnoteValue || '';
//               break;
//             }
//           }
//         });
//       } catch (e) {
//         // Fallback if we can't access the editor state
//         console.warn('Could not access endnote value from editor state:', e);
//       }
//     }

//     if (id && !endnotes.find((note) => note.index === id)) {
//       const endnote = {
//         index: id,
//         value,
//         text,
//       };
//       endnotes.push(endnote);
//     }
//   }
// });

// // Sort by index
// return endnotes.sort((a, b) => parseInt(a.index) - parseInt(b.index));

// ENDNOTES is not active at the momenent. TBD
export function getEndNotesHtml(endnotes) {
  // Handle both array format and HTML extraction
  // let notesToRender = [];
  // if (Array.isArray(endnotes)) {
  //   notesToRender = endnotes;
  // } else if (typeof endnotes === 'string') {
  //   notesToRender = extractEndnotesFromHtml(endnotes);
  // }
  // if (notesToRender.length === 0) return '';
  // return (
  //   <>
  //     <strong>Endnotes:</strong>
  //     <EndNotesContainer>
  //       {notesToRender.map((endnote) => (
  //         <li key={`endnote-${endnote.index}`}>
  //           <div id={`endnote-${endnote.index}`}>
  //             <span>
  //               <a href={`#endnote-ref-${endnote.index}`}>[{endnote.index}]</a>
  //             </span>
  //             &nbsp;
  //             <span>{endnote.value}</span>
  //           </div>
  //         </li>
  //       ))}
  //     </EndNotesContainer>
  //   </>
  // );
}

GeneratePdfObject.propTypes = {
  pdfData: PropTypes.string,
  inlinePdfScale: PropTypes.string,
};
