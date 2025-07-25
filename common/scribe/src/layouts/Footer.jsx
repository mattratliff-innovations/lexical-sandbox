import React from 'react';
import { ChevronUp } from 'react-bootstrap-icons';
import DiditLogoFooter from '../assets/didit-logo-footer.png';
import ScribeLogo from '../assets/scribe-logo.png';

const APP_VERSION_BUILD = process.env.APP_VERSION_BUILD ?? '/skrīb/ a writer or author'; // Need ENV var

function Footer() {
  return (
    <div className="footer">
      <div className="row mx-0 bg-secondary text-end py-1 px-3">
        <div className="col-12 fs-6 fw-bold">
          <a href="#content-start" id="back-to-top-link" className="text-white text-decoration-none">
            <ChevronUp className="me-2" stroke="currentColor" strokeWidth="2" />
            Back to Top
          </a>
        </div>
      </div>
      <div className="row mx-0 bg-secondary bg-opacity-10 pt-4 pb-5 px-5 fs-6 app_link_footer">
        <div className="col-md-3">
          <div className="mb-2">
            <a href="/" className="text-white text-decoration-none">
              <img src={ScribeLogo} className="scribe_logo_footer" alt="Scribe Home" title="Scribe Home" />
            </a>
          </div>
          <div className="app_footer_description">{APP_VERSION_BUILD}</div>
        </div>

        {/* The class .app_link_footer links are blocks, so no need for <p> or <br> */}
        <div className="col-md-2">
          <a
            href="https://dhsuscis.servicenowservices.com/myIT/?id=sc_cat_item&sys_id=979e83d4dbad4b003c80f81d0f9619c1"
            target="_blank"
            rel="noreferrer">
            Report a Defect
          </a>

          <a href="/terms">Terms of Use</a>

          <a href="https://www.uscis.gov/website-policies/accessibility" target="_blank" rel="noreferrer">
            Accessibility
          </a>
        </div>

        <div className="col-md-3">
          <a href="https://www.dhs.gov/" target="_blank" rel="noreferrer">
            Department of Homeland Security
          </a>

          <a href="https://www.uscis.gov/" target="_blank" rel="noreferrer">
            U.S. Citizenship & Immigration Services
          </a>

          <a href="https://cisgov.sharepoint.com/sites/connect/org/MGMT/OIT/Pages/home.aspx" target="_blank" rel="noreferrer">
            USCIS Office of Information Technology
          </a>

          <a href="https://servicehub.uscis.dhs.gov/" target="_blank" rel="noreferrer">
            USCIS ServiceHub
          </a>
        </div>

        <div className="col-md-3">
          <a href="https://cisgov.sharepoint.com/sites/connect/org/MGMT/OIT/Pages/home.aspx" target="_blank" rel="noreferrer">
            OIT Connect
          </a>

          <a href="https://cisgov.sharepoint.com/sites/connect/Pages/default.aspx" target="_blank" rel="noreferrer">
            USCIS Connect
          </a>

          <a href="https://dhsconnect.dhs.gov/Pages/default.aspx" target="_blank" rel="noreferrer">
            DHS Connect
          </a>

          <a href="https://cisgov.sharepoint.com/sites/ECNoitsdd/Offices/oit/sdd/default.aspx" target="_blank" rel="noreferrer">
            Systems Delivery Division
          </a>

          <a href="https://dhsuscis.servicenowservices.com/myIT" target="_blank" rel="noreferrer">
            myIT
          </a>
        </div>

        <div className="col-md-1 text-end">
          <img
            src={DiditLogoFooter}
            className="didit_logo_footer"
            alt="DID(it) - Digital Innovation & Development Logo"
            title="DID(it) - Digital Innovation & Development Logo"
          />
        </div>
      </div>
    </div>
  );
}

export default Footer;
