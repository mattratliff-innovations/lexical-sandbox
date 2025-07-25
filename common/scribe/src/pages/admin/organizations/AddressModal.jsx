/* eslint-disable require-loading-check-for-axios */
import React, { useEffect, useState, useMemo } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { DrButton, DrAlert } from '@druid/druid';
import { useForm } from 'react-hook-form';
import { toast, Flip } from 'react-toastify';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { HeaderContainer, Body } from '../../util/modalDesignComponents';
import {
  StyledInput,
  StyledSelect,
  StyledCheckbox,
  CheckBoxContainer,
  LabelContainer,
  StyledLabel,
  BtnContainer,
  InputContainer,
  StyledNote,
} from '../../../components/designedComponents';
import { H1 } from '../../../components/typography';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import 'react-toastify/dist/ReactToastify.css';
import { ScribeModal, XCloseBtn } from '../../../components/ScribeComponents';

const AddressLine = styled.div`
  display: flex;
  gap: 24px;
`;

export default function AddressModal({ showModal, setShowModal, onSubmit, addressToEdit = {} }) {
  const alertMessageDefault = 'All fields marked with a red asterisk (*) are required.';
  const [alertMessage, setAlertMessage] = useState(alertMessageDefault);
  const [alertMessageType, setAlertMessageType] = useState('info');
  const [activeMsg, setActiveMsg] = useState('Uncheck to hide within the system');
  const axios = createAuthenticatedAxios();
  const [isActDisabled, setIsActDisabled] = useState(false);
  const [stateList, setStateList] = useState([]);

  const { adminFormData } = useAdminFormContext();

  const defaultValues = useMemo(
    () => ({
      street: addressToEdit?.address?.street || '',
      aptSuiteFloor: addressToEdit?.address?.aptSuiteFloor || '',
      state: addressToEdit?.address?.state?.id || '',
      city: addressToEdit?.address?.city || '',
      zipCode: addressToEdit?.address?.zipCode || '',
      preAddress: addressToEdit?.address?.preAddress || '',
      nickname: addressToEdit?.address?.nickname || '',
      active: Object.keys(addressToEdit).length === 0 ? true : addressToEdit?.active,
    }),
    [addressToEdit]
  );

  useEffect(() => {
    axios
      .get(`${APP_API_ENDPOINT}/states`)
      .then((response) => setStateList(response.data))
      .catch(() => {
        toast.error('There was an error retrieving the contacts.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: 'onSubmit', defaultValues });

  useEffect(() => {
    if (!showModal) {
      reset({});
      setAlertMessageType('info');
      setAlertMessage(alertMessageDefault);
      setIsActDisabled(false);
      setActiveMsg('Uncheck to hide within the system');
    } else {
      if (addressToEdit.default) {
        setIsActDisabled(true);
        setActiveMsg('Default address must remain active');
      }
      if (adminFormData.organizationAddressXrefs.length < 1) {
        setIsActDisabled(true);
        setActiveMsg('First address is active and default');
      }
      reset(defaultValues);
      trigger();
    }
  }, [showModal]);

  const validate = () => {
    trigger();
    if (isValid) {
      setAlertMessageType('info');
      setAlertMessage(alertMessageDefault);
      handleSubmit(onSubmit)();
    } else {
      setAlertMessageType('error');
      setAlertMessage(`Some required fields need to be updated. ${alertMessageDefault}`);
    }
  };

  return (
    <ScribeModal className="modal-xl" showModal={showModal} name="addAddressModal">
      <HeaderContainer>
        <H1 className="noMarginHeader" data-testid="addressModalConHeaderContainer">
          {`${addressToEdit.id ? 'Edit' : 'Add'} Organization Address`}
        </H1>

        <XCloseBtn handleClose={() => setShowModal(false)} />
      </HeaderContainer>

      <DrAlert type={alertMessageType} noCloseBtn alert={alertMessage} variant="slim" />

      <Body data-testid="orgAddressModalBody" className="mb-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row mb-3">
            <div className="col-lg-4" style={{ paddingTop: '20px' }}>
              <CheckBoxContainer style={{ alignItems: 'center' }}>
                <StyledCheckbox
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('active')}
                  type="checkbox"
                  aria-label="Address is Active"
                  disabled={isActDisabled}
                />

                <LabelContainer>
                  <StyledLabel>Address is Active</StyledLabel>
                  <StyledNote>{activeMsg}</StyledNote>
                </LabelContainer>
              </CheckBoxContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-4">
              <InputContainer>
                <StyledLabel htmlFor="nickname" className="required">
                  Address Nickname
                </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('nickname', {
                    required: {
                      value: true,
                      message: 'Address nickname is required!',
                    },
                  })}
                  label="Address Nickname"
                  maxLength="100"
                  id="nickname"
                  data-testid="nickname"
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.nickname?.message}
                </div>
              </InputContainer>

              <InputContainer>
                <StyledLabel htmlFor="preAddress">Organization Pre Address </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('preAddress')}
                  label="Organization Pre Address"
                  maxLength="100"
                  id="preAddress"
                  data-testid="preAddress"
                />
              </InputContainer>

              <InputContainer>
                <StyledLabel htmlFor="street" className="required">
                  Organization Street Address 1{' '}
                </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('street', {
                    required: {
                      value: true,
                      message: 'Street Address 1 is required!',
                    },
                  })}
                  label="street"
                  maxLength="100"
                  id="street"
                  data-testid="street"
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.street?.message}
                </div>
              </InputContainer>

              <InputContainer>
                <StyledLabel htmlFor="aptSuiteFloor">Organization Street Address 2 </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('aptSuiteFloor')}
                  label="aptSuiteFloor"
                  maxLength="100"
                  id="aptSuiteFloor"
                  data-testid="aptSuiteFloor"
                />
              </InputContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-8">
              <AddressLine>
                <InputContainer style={{ width: '235px' }}>
                  <StyledLabel htmlFor="city" className="required">
                    Organization City{' '}
                  </StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('city', {
                      required: { value: true, message: 'City is required!' },
                    })}
                    label="city"
                    maxLength="100"
                    id="city"
                    data-testid="city"
                  />

                  <div className="text-danger mt-1" role="alert">
                    {errors?.city?.message}
                  </div>
                </InputContainer>

                <InputContainer style={{ width: '235px' }}>
                  <StyledLabel htmlFor="state" className="required">
                    Organization State{' '}
                  </StyledLabel>
                  <StyledSelect
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('state', {
                      required: { value: true, message: 'State is required!' },
                    })}
                    id="state"
                    data-testid="state">
                    <option value="">--- Select State ---</option>
                    {stateList.map((state) => (
                      <option key={state.id} value={state.id} data-testid={`stateId_${state.id}`}>
                        {state.name}
                      </option>
                    ))}
                  </StyledSelect>

                  <div className="text-danger mt-1" role="alert">
                    {errors?.state?.message}
                  </div>
                </InputContainer>

                <InputContainer>
                  <StyledLabel htmlFor="zipCode" className="required">
                    Org. Zip Code{' '}
                  </StyledLabel>
                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('zipCode', {
                      required: {
                        value: true,
                        message: 'A 5-digit Zip Code is required!',
                      },
                      pattern: {
                        value: /^\d{5}$/,
                        message: 'A 5-digit Zip Code is required!',
                      },
                    })}
                    style={{ width: '105px' }}
                    label="zipCode"
                    maxLength="5"
                    id="zipCode"
                    data-testid="zipCode"
                  />

                  <div className="text-danger mt-1" role="alert">
                    {errors?.zipCode?.message}
                  </div>
                </InputContainer>
              </AddressLine>
            </div>
          </div>
        </form>

        <BtnContainer>
          <DrButton variant="primary" data-testid="saveAddressModalButton" onClick={() => validate()} isDisabled={isSubmitting} className="btn-size">
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton variant="secondary" data-testid="cancelAddressModalButton" onClick={() => setShowModal(false)} className="btn-size">
            Cancel
          </DrButton>
        </BtnContainer>
      </Body>
    </ScribeModal>
  );
}

AddressModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  addressToEdit: PropTypes.shape({
    default: PropTypes.bool,
    active: PropTypes.bool,
    id: PropTypes.string,
    address: PropTypes.shape({
      street: PropTypes.string,
      address: PropTypes.string,
      aptSuiteFloor: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      prevAddress: PropTypes.string,
      nickname: PropTypes.string,
    }),
  }),
};
