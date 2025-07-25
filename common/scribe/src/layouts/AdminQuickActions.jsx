import React from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ArrowLeftCircleFill, PlusCircleFill, FileTextFill, FloppyFill } from 'react-bootstrap-icons';
import { H2 } from '../components/typography';
import ActionButton from '../components/actionButton/ActionButton';

export default function AdminQuickActions(props) {
  const { quickActions, handleButtonClick } = props;
  const location = useLocation();
  const currentPage = location.pathname;

  const ADMIN_URL = '/admin';
  const ADMIN_TITLE = 'System Administration';
  const SYS_ADMIN_LABEL = 'Back to System Admin';

  return (
    <div className="sidebar sidebar-margin">
      <div className="side-menu ps-2 p-2 mb-4">
        <H2>Quick Actions</H2>

        <div className="mb-3 mt-3">
          {currentPage === quickActions.listUrl ? (
            <ActionButton navLinkURL={ADMIN_URL} title={ADMIN_TITLE} icon={FileTextFill} text={SYS_ADMIN_LABEL} />
          ) : (
            <ActionButton
              navLinkURL={quickActions.listUrl}
              title={quickActions.listLabel}
              icon={ArrowLeftCircleFill}
              text={`Back to All ${quickActions.listLabel}`}
            />
          )}
        </div>

        {currentPage === quickActions.listUrl && quickActions.createUrl && (
          <div className="m-0 mb-3 mt-3">
            <ActionButton
              navLinkURL={quickActions.createUrl}
              title={quickActions.createLabel}
              icon={PlusCircleFill}
              text={quickActions.createLabel}
            />
          </div>
        )}

        {currentPage !== quickActions.listUrl && (
          <div className="m-0 mb-3 mt-3">
            <ActionButton
              data-testid={quickActions.saveButtonId}
              id={quickActions.saveButtonId}
              title={quickActions.saveLabel}
              aria-label={quickActions.saveLabel}
              onClick={handleButtonClick}
              icon={FloppyFill}
              text={quickActions.saveLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

AdminQuickActions.propTypes = {
  quickActions: PropTypes.shape({
    listUrl: PropTypes.string,
    listLabel: PropTypes.string,
    createUrl: PropTypes.string,
    createLabel: PropTypes.string,
    saveButtonId: PropTypes.string,
    saveLabel: PropTypes.string,
  }).isRequired,
  handleButtonClick: PropTypes.func.isRequired,
};
