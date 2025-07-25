import PropTypes from 'prop-types';
import React from 'react';
import './SignaturePreview.css';
import styled from '@emotion/styled';

const SignContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  font-family: Times New Roman;
`;

export default function SignaturePreview({
  signatureImageClass = 'signature-image',
  signatureImageUrl = '',
  signatoryName = '',
  signatoryTitle = '',
  id,
}) {
  return (
    <SignContainer>
      Sincerely,
      <div style={{ minHeight: '75px' }}>
        {signatureImageUrl && (
          <img id={id} data-testid={id} className={signatureImageClass} src={signatureImageUrl} alt={`Signature of ${signatoryName}`} />
        )}
      </div>
      <div style={{ lineHeight: '1.3' }}>
        <div style={{ fontWeight: '700' }}>{signatoryName || 'Signatory Name'}</div>
        <div>{signatoryTitle || 'Signatory Title'}</div>
      </div>
    </SignContainer>
  );
}

SignaturePreview.propTypes = {
  id: PropTypes.string.isRequired,
  signatureImageUrl: PropTypes.string,
  signatoryName: PropTypes.string,
  signatoryTitle: PropTypes.string,
  signatureImageClass: PropTypes.string,
};
