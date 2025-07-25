/* eslint-disable require-loading-check-for-axios */
import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DrButton } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { toast, Flip } from 'react-toastify';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import './ChangeHeaderModal.css';
import { StyledHr, BtnContainer } from '../../components/designedComponents';
import { H1 } from '../../components/typography';
import { HeaderContainer, Body } from '../util/modalDesignComponents';
import { ScribeModal, XCloseBtn } from '../../components/ScribeComponents';

export default function ChangeHeaderModal({ showModal, setShowModal, onSubmit, draft }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: draft, mode: 'onSubmit' });

  const axios = createAuthenticatedAxios();

  const [headers, setHeaders] = useState([]);
  const [defaultOrganizationAddress, setDefaultOrganizationAddress] = useState();
  const [activeOrganizationAddresses, setActiveOrganizationAddresses] = useState([]);

  const returnAddressOverrideDefaultChecked = (returnAddressOverride, orgAddressAddressId) => {
    if (!returnAddressOverride) {
      return orgAddressAddressId === defaultOrganizationAddress?.address.id;
    }
    return returnAddressOverride === orgAddressAddressId;
  };

  // Repopulate the form when draft changes.
  useEffect(() => reset(draft), [draft]);

  useEffect(() => {
    if (!draft?.organizationId) return;

    axios
      .get(`${APP_API_ENDPOINT}/organizations/${draft.organizationId}/headers/active`)
      .then((response) => {
        setHeaders(response.data);
      })
      .catch(() =>
        toast.error('There was an error retrieving the Headers list', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        })
      );

    setActiveOrganizationAddresses(draft.organization?.organizationAddressXrefs?.filter((orgAddress) => orgAddress.active));
    setDefaultOrganizationAddress(draft.organization?.organizationAddressXrefs?.find((orgAddress) => orgAddress.default));
  }, [draft?.organizationId]);

  return (
    <ScribeModal showModal={showModal}>
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="changeHeaderModalHeader">
          Change Header
        </H1>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <Body data-testid="changeHeaderModalBody" className="mb-3">
        <form>
          <div className="change-header-modal-body">
            <div className="form-fields-group mb-3">
              <div className="form-group mb-3">
                <label htmlFor="letterDateOverride">Change Letter Date</label>

                <input
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('letterDateOverride')}
                  type="date"
                  label="Change Letter Date (mm/dd/yyyy)"
                  className="form-control rounded-0 me-3"
                  maxLength="100"
                  id="letterDateOverride"
                  data-testid="letterDateOverride"
                />
              </div>

              <div className="form-group">
                <label htmlFor="headerId">Change Header</label>

                <select
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('headerId')}
                  id="headerId"
                  data-testid="headerId"
                  className="form-select rounded-0 me-3">
                  <option className="font-weight-light" value="">
                    -Select Header-
                  </option>
                  {headers.map((header) => (
                    <option key={header.id} value={header.id} data-testid={`headerTypeId_${header.id}`}>
                      {header.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="address-box">
              <legend className="address-option-container-legend border-bottom-0 mb-0">Select Return Address</legend>

              <fieldset className="address-option-container border pb-5">
                {activeOrganizationAddresses?.map((orgAddress) => (
                  <Fragment key={`address-${orgAddress.address.id}`}>
                    <div className="radio-option-container">
                      <input
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...register('returnAddressOverride')}
                        className="radio-option m-3"
                        type="radio"
                        id={orgAddress.address.id}
                        value={orgAddress.address.id}
                        defaultChecked={returnAddressOverrideDefaultChecked(draft?.returnAddressOverride, orgAddress.address.id)}
                        data-testid={orgAddress.address.id}
                      />

                      <label htmlFor={orgAddress.address.id}>
                        <p className="preAddress-radio-option mb-0">
                          <strong>{orgAddress.address.preAddress}</strong>
                        </p>

                        <p className="address-radio-option mb-0">
                          {`${orgAddress.address.street}, `}
                          {orgAddress.address.aptSuiteFloor ? `${orgAddress.address.aptSuiteFloor}, ` : ''}
                          {orgAddress.address.city ? `${orgAddress.address.city}, ` : ''}{' '}
                          {orgAddress.address.state?.code ?? orgAddress.address.province}{' '}
                          {orgAddress.address.zipCode ?? orgAddress.address.postalCode} {orgAddress.address.country}{' '}
                        </p>
                      </label>
                    </div>

                    <StyledHr />
                  </Fragment>
                ))}
              </fieldset>
            </div>
          </div>
        </form>

        <BtnContainer>
          <DrButton
            variant="primary"
            data-testid="modifyHeaderModalButton"
            className="btn-size"
            onClick={() => handleSubmit(onSubmit)()}
            isDisabled={isSubmitting}>
            {isSubmitting ? 'Modifing Header...' : 'Modify Header'}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelModalButton" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

ChangeHeaderModal.propTypes = {
  draft: PropTypes.shape({
    organizationId: PropTypes.string,
    returnAddressOverride: PropTypes.string,
    letterTypeId: PropTypes.string,
    headerId: PropTypes.string,
    startsWith: PropTypes.string,
    endsWith: PropTypes.string,
    startsWithLocked: PropTypes.bool,
    endsWithLocked: PropTypes.bool,
    registration: PropTypes.shape({ formTypeName: PropTypes.string }),
    organization: PropTypes.shape({
      headers: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })),
      organizationAddressXrefs: PropTypes.arrayOf(PropTypes.shape({ active: PropTypes.bool, default: PropTypes.bool })),
    }),
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
};
