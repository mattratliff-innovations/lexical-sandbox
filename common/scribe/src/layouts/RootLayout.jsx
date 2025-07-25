import React, { useContext, useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { DrAlert } from '@druid/druid';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import IdleTimer from '../idleTimeout/IdleTimer';
import { AppContext } from '../AppProvider';
import DefaultModal from '../pages/util/DefaultModal';

// eslint-disable-next-line max-len
const piiwarning =
  'Personal Identifiable Information (PII) is being used in this environment (Scribe Stage). Please practice proper handling and safeguarding of PII in accordance with the DHS ';

// eslint-disable-next-line max-len
const handbookLink =
  'https://usdhs.sharepoint.com/sites/dhsconnect/org/comp/cisa/ora/humancap/Documents/Orientation/Handbook_for_Safeguarding_SPII_at_DHS.pdf';

// eslint-disable-next-line max-len
const noDefaultOrganizationMessage =
  'Please select a new organization from the organization dropdown in the page header. If you are missing access to an organization, please contact the organization administrator.';

export default function RootLayout() {
  const { currentUser } = useContext(AppContext);
  const [showNoDefaultOrgModal, setShowNoDefaultOrgModal] = useState(false);

  const noDefaultOrgModal = () =>
    showNoDefaultOrgModal && (
      <DefaultModal
        defaultMessage={noDefaultOrganizationMessage}
        showModal={showNoDefaultOrgModal}
        setShowModal={setShowNoDefaultOrgModal}
        informationalOnly
        defaultHeader="No Organization Selected"
      />
    );

  useEffect(() => {
    if (currentUser?.organizations?.length > 0 && !currentUser?.defaultOrg) {
      setShowNoDefaultOrgModal(true);
    }
  }, [currentUser]);

  return (
    <>
      <Header />
      <div className="row">
        <div className="col-sm-2" />
        <div className="col-sm-8">
          {window.location.href.includes('staging') && (
            <DrAlert type="warn" noCloseBtn>
              {piiwarning}
              <a href={handbookLink}>Handbook for Safeguarding Sensitive PII.</a>
            </DrAlert>
          )}
        </div>
        <div className="col-sm-2" />
      </div>

      {noDefaultOrgModal()}
      <IdleTimer />
      <ToastContainer />
      <Outlet />
      <Footer />
    </>
  );
}
