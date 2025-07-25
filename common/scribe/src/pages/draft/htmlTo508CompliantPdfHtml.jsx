import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { sanitizedHtml } from '../util/displaySanitizedHtml';

const renderPdfHtml = (content, draft) =>
  renderToStaticMarkup(
    <html lang="en">
      <head>
        <title>USCIS Correspondence</title>
        {/* PDF-Reactor is subtly picky. The 3 attributes for @page are needed here not in dynamicLetterCss.js to cover all
        scenarios. @page supports a limited number of attributes (does not support fontFamily). The body styling for this section
        is not working thus in the body tag below. */}
        <style>
          {`
            @page {
              size: 8.5in 11in;
              margin: 0;
              padding: 0;
            }
          `}
        </style>
      </head>

      {/* PDF-Reactor obeys only the styling of the first body. Supporting documents have their own margins. Need a way to support
      this without overwriting the margins of the following documents; therefore, margin styles are in a div not body. */}
      <body
        style={{
          fontFamily: 'Times New Roman, Times, serif',
          fontSize: '12pt',
          lineHeight: '1.2',
        }}>
        <div
          style={{
            marginTop: `${draft.marginTop}in`,
            marginBottom: `${draft.marginBottom}in`,
            marginLeft: `${draft.marginLeft}in`,
            marginRight: `${draft.marginRight}in`,
            overflowWrap: 'break-word',
          }}>
          {sanitizedHtml(content)}
        </div>
      </body>
    </html>
  );

export default renderPdfHtml;
