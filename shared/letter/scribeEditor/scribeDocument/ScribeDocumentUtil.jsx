import React from 'react';

import { renderToStaticMarkup } from 'react-dom/server';

import { sanitizedCss } from '../../../util/displaySanitizedHtml';
import Header from '../../Header';
import { getEnclosuresHtml } from '../../LetterUtil';
import { findOrganizationSignature, generateSignatureContent } from '../ScribeEditorUtil';
import { hydrateVariablesHeadlessly } from './lexical/letterEditor/plugins/VariablePlugin';

export const draftToPdfHtml = (draft, options) => {
  const { totalPageCountForHeader = 0 } = options;
  const hydratedLetterHeader = renderToStaticMarkup(<Header draft={draft} totalPageCount={totalPageCountForHeader} options={options} useLexical />);
  const startsWithHtml = hydrateVariablesHeadlessly(draft.startsWith, draft, options);
  const sectionsHtml = draft.sections
    .toSorted((a, b) => a.order - b.order)
    .map((section) => hydrateVariablesHeadlessly(section.text, draft, options))
    .join('\n');
  const endsWithHtml = hydrateVariablesHeadlessly(draft.endsWith, draft, options);
  const organizationSignature = findOrganizationSignature(draft);
  const signature = organizationSignature ? renderToStaticMarkup(generateSignatureContent(organizationSignature)) : '';
  const enclosuresHtml = renderToStaticMarkup(getEnclosuresHtml(draft.enclosures || []));

  return `${hydratedLetterHeader}
    <div data-testid="startsWithHtml">${startsWithHtml}</div>
    <div data-testid="sectionsHtml">${sectionsHtml}</div>
    <div data-testid="endsWithHtml">${endsWithHtml}</div>
    <div data-testid="signature">${signature}</div>
    <div data-testid="enclosure">${enclosuresHtml}</div>`;
};

export const supportingDocumentToPdfHtml = (supportingDocument) => {
  const sections = supportingDocument.supportingDocumentSections;
  const sectionsArray = Array.isArray(sections) ? sections : [];

  const sectionsHtml = sectionsArray
    .toSorted((a, b) => a.order - b.order)
    .map((section) => hydrateVariablesHeadlessly(section.text, supportingDocument))
    .join('\n');

  /// Remove extra top margin for the first p tag /
  const hydratedDocumentCss = renderToStaticMarkup(sanitizedCss(`p:first-of-type { margin-top: 0; }`));

  return `${hydratedDocumentCss}<div data-testid="supportingDocumentSectionsHtml">${sectionsHtml}</div>`;
};

export default draftToPdfHtml;
