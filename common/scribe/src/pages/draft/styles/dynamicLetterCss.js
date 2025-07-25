/* The exact positioning of the letterheader's elements are very important. Small changes may throw elements off. */
const dynamicLetterCss = (margins, topStart, leftStart) => `
  @page {
    @bottom-center {
      content: element(printedFooter);
    }
  }

  #printedFooter {
    position: running(printedFooter);
    font-size: 0.5rem;
    text-align: center;
  }

  .footer-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  #pageCounter::before {
    content: "Page " counter(page) " of " counter(pages);
  }

  #pageCounter {
    flex: 1;
    text-align: center;
  }

  #locatorCode {
    flex: 1;
    text-align: left;
    white-space: nowrap;
  }

  #uscisUrl {
    flex: 1;
    text-align: right;
  }

  #occMessage {
    font-style: italic;
  }

  /* END COUNTERS */

  .letterheader-root {
    display: flex;
    --letterheader-column-div-flex-basis: 0.875in;
  }

  .letterheader-container {
    display: flex;
    margin-top: calc(calc(${topStart}in - ${margins.marginTop}px) - var(--letterheader-column-div-flex-basis));
  }

  .letterheader-container p {
    margin: 0;
    line-height: 1.2;
  }

  .letterheader-container .organization_address {
    font-size: 7pt;
  }

  /* Left Column */
  .letterheader-left-column {
    display: flex;
    flex-direction: column;
  }

  .row1Col1 {
    flex: 0 0 var(--letterheader-column-div-flex-basis);
    margin-bottom: 0;
  }

  .row2Col1 {
    /* For the address envelope window: */
    flex: 0 0 var(--letterheader-column-div-flex-basis);
    margin-left: calc(${leftStart}in - ${margins.marginLeft}px); /* This just needs to subtract the left margin */
    width: 3.5in;
  }

  .row3Col1 {
    flex: 0 0; /* Don't let this one grow so the address window lines up */
    margin-top: 8px;
    margin-bottom: 0;
    height: calc(50% - 1.1875in);
  }

  /* Right Column */
  .letterheader-right-column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 310px; /* best as a static width since the margins can alter its size and movement */
  }

  .row1Col2, .row2Col2, .row3Col2 {
    margin: 0 0 2px 64px;
  }

  .row1Col2 img.img-receipt-number_barcode,
  .row1Col2 img.img-a-number_barcode,
  .row2Col2 img.img-receipt-number_barcode,
  .row2Col2 img.img-a-number_barcode,
  .row3Col2 img.img-receipt-number_barcode,
  .row3Col2 img.img-a-number_barcode {
    margin: 0 0 5px -4px;
    width: 100%;
    height: 70px;
  }

  .row1Col2 img.img-dhs-seal,
  .row2Col2 img.img-dhs-seal,
  .row3Col2 img.img-dhs-seal {
    margin: 0 0 0 -64px;
    width: 184px;
  }
  `;
export default dynamicLetterCss;
