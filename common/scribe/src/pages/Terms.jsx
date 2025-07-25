import React from 'react';
import { StyledHr } from '../components/designedComponents';
import { H1 } from '../components/typography';

export default function Terms() {
  return (
    <div className="row page_min_height">
      <div className="col-2" />
      <div className="col-8">
        <H1 data-testid="termsHeader">Terms</H1>
        <StyledHr />
        <div className="mb-5" data-testid="page-content">
          <p>
            This page explains the terms and conditions which apply to the access and use of this site. Please read and understand the terms on this
            page.
          </p>

          <p>
            You are accessing a U.S. Government computer system. Access to this system is restricted to authorized users only. Anyone who accesses
            this system without authorization, or exceeds authorized access, could be subject to a fine or imprisonment, or both, under Public Law
            98-473.
          </p>

          <p>
            By accessing this system, you consent to having your activities and or accesses recorded by the system software and periodically
            monitored. If this record reveals suspected unauthorized use or criminal activity, the evidence may be provided to supervisory personnel
            and law enforcement officials.
          </p>
        </div>
      </div>
      <div className="col-2" />
    </div>
  );
}
