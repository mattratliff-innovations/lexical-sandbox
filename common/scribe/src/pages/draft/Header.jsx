import React from 'react';
import PropTypes from 'prop-types';
import { sanitizedCss, sanitizedHtml } from '../util/displaySanitizedHtml';
import dynamicLetterCss from './styles/dynamicLetterCss';
import LetterEditorPropTypes from './scribeEditor/scribeDocument/ScribeDocumentPropTypes';
import { hydrateVariablesHeadlessly } from './scribeEditor/scribeDocument/lexical/letterEditor/plugins/VariablePlugin';
import { convertInchesToPixels } from './LetterUtil';

// All constants are in inches unless noted otherwise
export const US_LETTER = 'usLetter';
export const CENTRAL_US_LETTER_TOP = 2.123125; // 2 197/1600
export const CENTRAL_US_LETTER_LEFT = 1.09375; // 1   3/32
export const LOCAL_US_LETTER_TOP = 2.375; // 2   3/8
export const LOCAL_US_LETTER_LEFT = 0.875; //     7/8

export const SIX_BY_NINE = 'sixByNine';
export const CENTRAL_SIX_BY_NINE_TOP = 1.77; // 1 77/100
export const CENTRAL_SIX_BY_NINE_LEFT = 1.07; // 1  7/100
export const LOCAL_SIX_BY_NINE_TOP = 2.875; // 2  7/8
export const LOCAL_SIX_BY_NINE_LEFT = 0.875; //    7/8

export const FLAT = 'flat';
export const CENTRAL_FLAT_TOP = 2.123125; // 2 197/1600
export const CENTRAL_FLAT_LEFT = 1.09375; // 1   3/32
export const LOCAL_FLAT_TOP = 2.375; // 2   3/8
export const LOCAL_FLAT_LEFT = 0.875; //     7/8

export const offsetLookup = {
  central: {
    [US_LETTER]: [CENTRAL_US_LETTER_TOP, CENTRAL_US_LETTER_LEFT],
    [SIX_BY_NINE]: [CENTRAL_SIX_BY_NINE_TOP, CENTRAL_SIX_BY_NINE_LEFT],
    [FLAT]: [CENTRAL_US_LETTER_TOP, CENTRAL_US_LETTER_LEFT],
  },
  local: {
    [US_LETTER]: [LOCAL_US_LETTER_TOP, LOCAL_US_LETTER_LEFT],
    [SIX_BY_NINE]: [LOCAL_SIX_BY_NINE_TOP, LOCAL_SIX_BY_NINE_LEFT],
    [FLAT]: [LOCAL_FLAT_TOP, LOCAL_FLAT_LEFT],
  },
};

export function getEnvelopeType(pages) {
  let envelopeType = 'usLetter';

  switch (true) {
    case pages > 0 && pages <= 3:
      envelopeType = US_LETTER;
      break;
    case pages >= 4 && pages < 8:
      envelopeType = SIX_BY_NINE;
      break;
    case pages >= 8:
      envelopeType = FLAT;
      break;
    default:
      envelopeType = US_LETTER;
      break;
  }

  return envelopeType;
}

// Determine which envelope to use based on page count / print type
export function getCustomCss(pages, margins, printType, draft = '') {
  const envelopeType = getEnvelopeType(pages);
  return dynamicLetterCss(margins, ...(offsetLookup[printType]?.[envelopeType] ?? offsetLookup.local[US_LETTER]), draft.locatorCode);
}

export default function Header({ totalPageCount = 0, printType = 'local', draft, options = {} }) {
  const getMargins = () => ({
    marginTop: convertInchesToPixels(draft.marginTop),
    marginLeft: convertInchesToPixels(draft.marginLeft),
  });

  const headerCssContent = getCustomCss(totalPageCount, getMargins(), printType, draft);

  return (
    <div className="letterheader-root">
      <span>{sanitizedCss(headerCssContent)}</span>
      <div className="letterheader-container">
        <div className="letterheader-left-column" data-testid="letterheader-left-column">
          <div className="row1Col1" data-testid="row1Col1" title="Top left header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row1Col1, draft, options))}
          </div>
          <div className="row2Col1" data-testid="row2Col1" title="Middle left header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row2Col1, draft, options))}
          </div>
          <div className="row3Col1" title="Bottom left header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row3Col1, draft, options))}
          </div>
        </div>
        <div className="letterheader-right-column">
          <div className="row1Col2" title="Top right header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row1Col2, draft, options))}
          </div>
          <div className="row2Col2" title="Middle right header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row2Col2, draft, options))}
          </div>
          <div className="row3Col2" title="Bottom right header field">
            {sanitizedHtml(hydrateVariablesHeadlessly(draft?.header?.row3Col2, draft, options))}
          </div>
        </div>
      </div>
    </div>
  );
}

Header.propTypes = {
  draft: LetterEditorPropTypes.isRequired,
  options: PropTypes.shape({}),
  totalPageCount: PropTypes.number,
  printType: PropTypes.string,
};
