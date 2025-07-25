import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import './ChangeSignatureModal.css';
import { findOrganizationSignature } from './LetterUtil';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import { HrNoTopMargin, BtnContainer } from '../../components/designedComponents';
import { H1 } from '../../components/typography';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

const SignaturesArea = styled.div`
  border: 2px solid #707070;
  height: 250px;
  padding: 0px 4px;
  overflow: auto;
`;

const SignatureContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #f7f7f7;
  align-items: center;
  padding: 4px 8px;
  gap: 4px;
`;

const SignatureColumn = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.1;
`;

const SignatureName = styled.span`
  font-weight: 600;
`;

const DEFAULT_LABEL = 'Default';
const PREMIUM_LABEL = 'Premium Processing';

export default function ChangeSignatureModal({ showModal, setShowModal, onSubmit, draft }) {
  const defaultValues = useMemo(
    () => ({
      organizationSignatureId: findOrganizationSignature(draft)?.id,
    }),
    [draft.organization?.organizationSignatures]
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({ mode: 'onSubmit', defaultValues });

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="changeSignatureModalHeader">
          Change Signature here
        </H1>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body data-testid="changeSignatureModalBody">
        <div className="col-sm-6">
          <HrNoTopMargin />
        </div>
        <div className="mb-2">Select Signature</div>

        <form className="mb-4">
          <SignaturesArea>
            {draft.organization?.organizationSignatures?.map((signature) => (
              <SignatureContainer key={`signature-${signature.id}`}>
                <input
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('organizationSignatureId')}
                  type="radio"
                  name="radioOptions"
                  id={signature.id}
                  value={signature.id}
                  onChange={(evt) => setValue('organizationSignatureId', evt.target.value)}
                />

                <label className="form-check-label radio-label" htmlFor={signature.id}>
                  <SignatureColumn>
                    <SignatureName>{`${signature.default ? DEFAULT_LABEL : PREMIUM_LABEL} | ${signature.signatoryName}`}</SignatureName>
                    {signature.signatoryTitle}
                  </SignatureColumn>
                </label>
              </SignatureContainer>
            ))}
          </SignaturesArea>
        </form>

        <BtnContainer className="mb-4">
          <DrButton
            variant="primary"
            data-testid="modifyLetterModalButton"
            onClick={() => handleSubmit(onSubmit)()}
            isDisabled={isSubmitting}
            className="btn-size">
            {isSubmitting ? 'Modifing Letter...' : 'Modify Letter'}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelModalButton" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

ChangeSignatureModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectedSignature: PropTypes.string,
  draft: PropTypes.shape({
    organizationSignatureId: PropTypes.string,
    organization: PropTypes.shape({
      organizationSignatures: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          signatory_name: PropTypes.string,
          signatory_title: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
};
