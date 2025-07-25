import React from 'react';
import { DrButton } from '@druid/druid';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { StyledHr } from '../components/designedComponents';
import { H1 } from '../components/typography';

function NoPermissions({ messageJsx }) {
  const redirect = useNavigate();
  return (
    <div className="row page_min_height">
      <div className="col-sm-2 d-flex flex-column" />

      <div className="col-sm-10">
        <div className="row">
          <div className="col-lg-10">
            <H1>You Don&apos;t Have Access To That</H1>
            <StyledHr />
            <p className="mb-3" data-testid="messageContainer">
              {messageJsx}
            </p>
            <div className="mb-5">
              <DrButton variant="primary" data-testid="signInButton" onClick={() => redirect('/')}>
                Return Home
              </DrButton>
            </div>
          </div>
          <div className="col-lg-2" />
        </div>
      </div>
    </div>
  );
}

NoPermissions.propTypes = {
  messageJsx: PropTypes.node.isRequired,
};
export default NoPermissions;
