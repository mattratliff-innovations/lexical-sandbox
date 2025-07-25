import React from 'react';
import { NavLink } from 'react-router-dom';
import UscisSeal from '../assets/uscis-seal.svg';
import DiditLogoHeader from '../assets/didit-logo-header.png';
import ScribeLogo from '../assets/scribe-logo.png';
import HeaderCurrentUser from './HeaderCurrentUser';
import { idTokenHasAdminPrivileges } from '../oidc/Authentication';

function Header() {
  return (
    <>
      {/* Main Header */}
      <div className="row my-2 ms-5 me-3 align-items-center">
        <div className="col-xxl-5 my-1 hide_on_xlarge">
          <div className="d-flex align-items-center">
            <a href="#content-start" id="skip-nav" data-testid="skip-nav">
              Skip to main content
            </a>
            <div className="flex me-5">
              <a
                href="https://cisgov.sharepoint.com/sites/connect/Pages/default.aspx"
                className="text-white text-decoration-none"
                target="_blank"
                rel="noreferrer">
                <img
                  src={UscisSeal}
                  className="uscis_seal_header"
                  alt="US Department of Homeland Security Seal, US Citizenship and Immigration Services"
                />
              </a>
            </div>
            <div className="flex me-5 align-items-center">
              <span className="header_vbar" />
            </div>
            <div className="flex-grow-1">
              <img src={DiditLogoHeader} className="didit_logo_header" alt="DID(it) - Digital Innovation & Development Logo" />
            </div>
          </div>
        </div>
        <div className="col-md-2 d-flex scribe_logo_div">
          <div>
            <a href="/" className="text-white text-decoration-none">
              <img src={ScribeLogo} className="scribe_logo_footer" alt="Scribe Home" title="Scribe Home" />
            </a>
          </div>
        </div>
        <div className="col-md-10 col-xxl-5 d-flex justify-content-end">
          <HeaderCurrentUser />
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="container-fluid bg-secondary bg-opacity-10">
        <div className="row ps-5 pe-3">
          <div className="col-12">
            <nav className="navbar navbar-expand-md nav-underline mb-0">
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="navigation menu">
                <span className="navbar-toggler-icon" />
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                  <li className="nav-item me-5">
                    <NavLink className="scribe-text-primary nav-link" to="/">
                      Home
                    </NavLink>
                  </li>
                  <li className="nav-item me-5">
                    <NavLink className="scribe-text-primary nav-link" to="/searchLetters">
                      Search
                    </NavLink>
                  </li>
                  <li className="nav-item me-5">
                    {idTokenHasAdminPrivileges() && (
                      <NavLink className="scribe-text-primary nav-link" to="/admin">
                        Administration
                      </NavLink>
                    )}
                  </li>
                </ul>
              </div>
            </nav>
            <span id="content-start" data-testid="content-start" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
