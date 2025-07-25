import React from 'react';
import PropTypes from 'prop-types';

export const USCIS_WEB_ADDRESS = 'www.uscis.gov';
export const OCC_MESSAGE =
  'USCIS encourages you to sign up for a USCIS online account. To learn more about creating an account and the benefits, go to https://www.uscis.gov/file-online';

export default function PrintedFooter({ draft = {} }) {
  return (
    <html lang="en">
      <title>&nbsp;</title>
      <div id="printedFooter">
        {draft?.organization?.occ === true && <p id="occMessage">{OCC_MESSAGE}</p>}
        <div className="footer-container">
          <div id="locatorCode">{draft?.locatorCode}</div>
          <div id="pageCounter" />
          <div id="uscisUrl">{USCIS_WEB_ADDRESS}</div>
        </div>
      </div>
    </html>
  );
}

PrintedFooter.propTypes = {
  draft: PropTypes.shape({
    locatorCode: PropTypes.string.isRequired,
    organization: PropTypes.shape({
      occ: PropTypes.bool.isRequired,
    }),
  }),
};
