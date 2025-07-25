/* eslint-disable require-loading-check-for-axios */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import 'react-toastify/dist/ReactToastify.css';
import { DrButton } from '@druid/druid';
import PropTypes from 'prop-types';
import { toast, Flip } from 'react-toastify';
import {
  StyledInput,
  StyledSelect,
  StyledCheckbox,
  CheckBoxContainer,
  StyledLabel,
  BtnContainer,
  InputContainer,
  StyledNote,
  LabelContainer,
} from '../../components/designedComponents';
import * as Util from './ContactUtils';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../http/authenticatedAxios';

const AllBtns = styled.div`
  display: flex;
  justify-content: space-between;
`;

export default function ContactForm({
  formCheck = {},
  onSubmit,
  handleCloseCheck,
  contactToEdit = {},
  isCreate,
  setConfirmDelete,
  setAlertMessageType,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    watch,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = formCheck;

  const axios = createAuthenticatedAxios();
  const [ssnMasked, setSsnMasked] = useState();
  const [sexList, setSexList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isStatesLoading, setIsStatesLoading] = useState(false);

  const selectedContactType = watch('contactType');
  const addressRequiredClass = getValues('letterRecipient') ? ' required' : '';
  const usAddressRequired = !!(getValues('letterRecipient') && !getValues('foreignAddress'));
  const usAddressRequiredClass = getValues('letterRecipient') && !getValues('foreignAddress') ? ' required' : '';
  const foreignAddressRequired = !!(getValues('letterRecipient') && getValues('foreignAddress'));
  const foreignAddressRequiredClass = getValues('letterRecipient') && getValues('foreignAddress') ? ' required' : '';

  useEffect(() => {
    const ssn = getValues('ssn');
    setSsnMasked(Util.maskedSsn(ssn));
  }, [getValues('ssn')]);

  useEffect(() => {
    setIsApiLoading(true);
    axios
      .get(`${APP_API_ENDPOINT}/sexes`)
      .then((response) => {
        setSexList(response.data);
        setValue('sexId', contactToEdit?.sexId);
        setIsApiLoading(false);
      })
      .catch(() => {
        toast.error('There was an error retrieving the contacts.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, []);

  useEffect(() => {
    setIsStatesLoading(true);
    axios
      .get(`${APP_API_ENDPOINT}/states`)
      .then((response) => {
        setStateList(response.data);
        setValue('stateId', contactToEdit?.contactAddressXref?.address?.state?.id);
        setIsStatesLoading(false);
      })
      .catch(() => {
        toast.error('There was an error retrieving the contacts.', {
          position: 'top-center',
          transition: Flip,
          theme: 'dark',
        });
      });
  }, []);

  const handleSsnMaskOnChange = (e) => {
    const { value } = e.target;

    const newSsn = value.replace(/\D/g, '');
    if (e.nativeEvent.inputType === 'deleteContentBackward') {
      setSsnMasked('');
      setValue('ssn', '');
      return;
    }

    if (newSsn.length <= 9) setSsnMasked(newSsn);
  };

  const handleSsnMaskOnBlur = (e) => {
    const { value } = e.target;
    const newSsn = value.replace(/\D/g, '');

    if (newSsn.length === 9) {
      const maskedSsn = Util.maskedSsn(newSsn);
      setSsnMasked(maskedSsn);
      setValue('ssn', newSsn);
    } else setValue('ssn', newSsn);
  };

  const validate = () => {
    trigger();
    setAlertMessageType(isValid ? 'info' : 'error');
  };

  const formatAnumber = (e) => {
    let { value } = e.target;
    if (value.trim() !== '') {
      value = value.replace(/\D/g, '');

      if (!value.startsWith('A-')) value = `A-${value}`;
      value = value.slice(0, 11);
    }
    setValue('aNumber', value);
  };

  const isDateOfBirthValid = (dateString) => {
    if (!dateString) {
      return true;
    }
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !(date > today);
  };

  const backspaceAnumber = (e) => {
    if (e.key === 'Backspace' && e.target.value === 'A-') setValue('aNumber', '');
  };

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name === 'foreignAddress') {
        clearErrors();
        if (values.foreignAddress === true) {
          setValue('state', '');
          setValue('zipCode', '');
        } else {
          setValue('province', '');
          setValue('postalCode', '');
          setValue('country', '');
        }
      } else if (name === 'letterRecipient') clearErrors();
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <form className="mb-4">
      {isApiLoading || isStatesLoading ? (
        <div className="d-flex flex-column " data-testid="loadingIndicator">
          <div className="d-flex flex-grow-1 justify-content-center align-items-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="row mb-1">
            <div className="col-4">
              <LabelContainer>
                <StyledLabel htmlFor="contactType" className="required">
                  Role
                </StyledLabel>
                <StyledNote id="contactTypeNote">
                  <span>Selecting a different role will enable additional fields. </span>
                  <span>Only one contact can be created at a time.</span>
                </StyledNote>
              </LabelContainer>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-3">
              <StyledSelect
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('contactType', {
                  required: { value: true, message: 'Role is required!' },
                })}
                id="contactType"
                data-testid="contactTypeSelect"
                aria-describedby="contactTypeNote">
                <option value="">--- Select Role ---</option>
                {Util.contactTypeList.map((contactType) => (
                  <option key={contactType.id} value={contactType.id} data-testid={`contactTypeId_${contactType.id}`}>
                    {contactType.name}
                  </option>
                ))}
              </StyledSelect>

              <div className="text-danger mt-1" role="alert">
                {errors?.contactType?.message}
              </div>
            </div>

            <div className="col-4">
              <CheckBoxContainer>
                <StyledCheckbox
                  style={{ marginTop: '5px' }}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('letterRecipient')}
                  type="checkbox"
                  id="letterRecipient"
                  aria-describedby="letterRecipientNote"
                />

                <LabelContainer>
                  <StyledLabel htmlFor="letterRecipient">Letter Recipient?</StyledLabel>
                  <StyledNote id="letterRecipientNote">
                    <span>Check if this contact is also a letter recipient.</span>
                    <span>Some required fields will change.</span>
                  </StyledNote>
                </LabelContainer>
              </CheckBoxContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-3">
              <InputContainer>
                <StyledLabel className="required" htmlFor="first-name">
                  First Name
                </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('firstName', {
                    required: {
                      value: true,
                      message: 'First Name is required!',
                    },
                  })}
                  label="First Name"
                  maxLength="100"
                  id="first-name"
                  data-testid="first-name"
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.firstName?.message}
                </div>
              </InputContainer>
            </div>

            <div className="col-3">
              <InputContainer>
                <StyledLabel htmlFor="middle-name">Middle Name</StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('middleName')}
                  label="Middle Name"
                  maxLength="100"
                  id="middle-name"
                />
              </InputContainer>
            </div>

            <div className="col-3">
              <InputContainer>
                <StyledLabel className="required" htmlFor="last-name">
                  Last Name
                </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('lastName', {
                    required: {
                      value: true,
                      message: 'Last Name is required!',
                    },
                  })}
                  label="Last Name"
                  maxLength="100"
                  id="last-name"
                />
                <div className="text-danger mt-1" role="alert">
                  {errors?.lastName?.message}
                </div>
              </InputContainer>
            </div>
          </div>

          {(selectedContactType === Util.CONTACT_TYPE_REPRESENTATIVE || selectedContactType === Util.CONTACT_TYPE_PETITIONER) && (
            <div className="row">
              <div className="col-3">
                <InputContainer>
                  <StyledLabel htmlFor="firm-name">Firm Name</StyledLabel>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('firmName')}
                    label="Firm Name"
                    maxLength="100"
                    id="firm-name"
                  />
                </InputContainer>
              </div>
            </div>
          )}

          <div className="row mb-2">
            <div className="col-4">
              <InputContainer>
                <StyledLabel className={addressRequiredClass ? ' required' : ''} htmlFor="street">
                  Street Address
                </StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('street', {
                    required: {
                      value: getValues('letterRecipient'),
                      message: 'Street Address is required!',
                    },
                  })}
                  label="Street Address"
                  maxLength="100"
                  id="street"
                />
                <div className="text-danger mt-1" role="alert">
                  {errors?.street?.message}
                </div>
              </InputContainer>
            </div>

            <div className="col-2">
              <InputContainer>
                <StyledLabel htmlFor="aptSuiteFloor">Apartment/Suite/Floor</StyledLabel>
                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('aptSuiteFloor')}
                  label="aptSuiteFloor"
                  maxLength="100"
                  id="aptSuiteFloor"
                />
              </InputContainer>
            </div>

            <div className="col-4">
              <CheckBoxContainer style={{ paddingTop: '16px' }}>
                <StyledCheckbox
                  style={{ marginTop: '10px' }}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('foreignAddress')}
                  type="checkbox"
                  id="foreignAddress"
                  data-testid="foreignAddress"
                  aria-label="Foreign Address, Yes"
                  aria-describedby="foreignAddressNote"
                />

                <LabelContainer>
                  <StyledLabel htmlFor="foreign-address">Foreign Address</StyledLabel>

                  <StyledNote htmlFor="foreignAddress" id="foreignAddressNote">
                    <span>Check if the address is outside of the United States.</span>
                    <span>Some required fields will change.</span>
                  </StyledNote>
                </LabelContainer>
              </CheckBoxContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-3">
              <InputContainer>
                <StyledLabel className={addressRequiredClass} htmlFor="city">
                  City
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('city', {
                    required: {
                      value: getValues('letterRecipient'),
                      message: 'City is required!',
                    },
                  })}
                  label="City"
                  maxLength="100"
                  id="city"
                />
                <div className="text-danger mt-1" role="alert">
                  {errors?.city?.message}
                </div>
              </InputContainer>
            </div>

            <div className="col-3">
              <InputContainer>
                <StyledLabel htmlFor="stateId" className={usAddressRequiredClass} disabled={getValues('foreignAddress')}>
                  State
                </StyledLabel>

                <StyledSelect
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('stateId', {
                    required: {
                      value: usAddressRequired,
                      message: 'State is required!',
                    },
                  })}
                  id="stateId"
                  data-testid="stateId"
                  disabled={getValues('foreignAddress')}>
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
            </div>

            <div className="col-2">
              <InputContainer>
                <StyledLabel className={usAddressRequiredClass} htmlFor="zip-code" disabled={getValues('foreignAddress')}>
                  ZIP Code
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('zipCode', {
                    required: {
                      value: usAddressRequired,
                      message: 'A 5-digit ZIP Code is required!',
                    },
                    pattern: {
                      value: /^\d{5}$/,
                      message: 'A 5-digit ZIP Code is required!',
                    },
                  })}
                  label="ZIP Code"
                  maxLength="5"
                  id="zip-code"
                  disabled={getValues('foreignAddress')}
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.zipCode?.message}
                </div>
              </InputContainer>
            </div>
          </div>

          <div className="row">
            <div className="col-3">
              <InputContainer>
                <StyledLabel disabled={!getValues('foreignAddress')} htmlFor="province">
                  Province
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('province')}
                  label="Province"
                  maxLength="100"
                  id="province"
                  disabled={!getValues('foreignAddress')}
                />
              </InputContainer>
            </div>

            <div className="col-2">
              <InputContainer>
                <StyledLabel disabled={!getValues('foreignAddress')} className={foreignAddressRequiredClass} htmlFor="postal-code">
                  Postal Code
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('postalCode', {
                    required: {
                      value: foreignAddressRequired,
                      message: 'Postal Code is required!',
                    },
                  })}
                  label="Postal Code"
                  maxLength="100"
                  id="postal-code"
                  disabled={!getValues('foreignAddress')}
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.postalCode?.message}
                </div>
              </InputContainer>
            </div>

            <div className="col-3">
              <InputContainer>
                <StyledLabel disabled={!getValues('foreignAddress')} className={foreignAddressRequiredClass} htmlFor="country">
                  Country
                </StyledLabel>

                <StyledInput
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('country', {
                    required: {
                      value: foreignAddressRequired,
                      message: 'Country is required!',
                    },
                  })}
                  label="Country"
                  maxLength="100"
                  id="country"
                  disabled={!getValues('foreignAddress')}
                />

                <div className="text-danger mt-1" role="alert">
                  {errors?.country?.message}
                </div>
              </InputContainer>
            </div>
          </div>

          {(selectedContactType === Util.CONTACT_TYPE_APPLICANT || selectedContactType === Util.CONTACT_TYPE_PETITIONER) && (
            <div className="row">
              <div className="col-2">
                <InputContainer>
                  <StyledLabel htmlFor="a-number">A-Number</StyledLabel>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('aNumber', {
                      pattern: {
                        value: /^A-\d{9}$/,
                        message: 'Format: A-#########',
                      },
                    })}
                    label="A-Number"
                    maxLength="11"
                    id="a-number"
                    onChange={formatAnumber}
                    onKeyDown={backspaceAnumber}
                  />

                  <div className="text-danger mt-1" role="alert">
                    {errors?.aNumber?.message}
                  </div>
                </InputContainer>
              </div>

              {selectedContactType === Util.CONTACT_TYPE_PETITIONER && (
                <div className="col-3">
                  <InputContainer>
                    <StyledLabel htmlFor="inCareOf">In Care Of</StyledLabel>

                    <StyledInput
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('inCareOf')}
                      label="In Care Of"
                      maxLength="100"
                      id="inCareOf"
                    />
                  </InputContainer>
                </div>
              )}

              {selectedContactType === Util.CONTACT_TYPE_APPLICANT && (
                <div className="col-2">
                  <InputContainer>
                    <StyledLabel htmlFor="ssnMasked">Social Security Number</StyledLabel>

                    <StyledInput
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('ssn', {
                        pattern: {
                          value: /^\d{9}$/,
                          message: 'Please provide 9 digits',
                        },
                      })}
                      id="ssn"
                      type="hidden"
                    />

                    <StyledInput
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('ssnMasked')}
                      value={ssnMasked}
                      onChange={handleSsnMaskOnChange}
                      onBlur={handleSsnMaskOnBlur}
                      maxLength="9"
                      id="ssnMasked"
                      data-testid="ssnMasked"
                    />

                    <div className="text-danger mt-1" role="alert">
                      {errors?.ssn?.message}
                    </div>
                  </InputContainer>
                </div>
              )}

              <div className="col-2">
                <InputContainer>
                  <StyledLabel htmlFor="dateOfBirth">Date of Birth</StyledLabel>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('dateOfBirth', {
                      validate: { isDateOfBirthValid },
                    })}
                    type="date"
                    maxLength="100"
                    id="dateOfBirth"
                    data-testid="dateOfBirth"
                  />

                  <div className="text-danger mt-1" role="alert">
                    {errors?.dateOfBirth?.type === 'isDateOfBirthValid' && <p>Please enter past date</p>}
                  </div>
                </InputContainer>
              </div>

              {selectedContactType === Util.CONTACT_TYPE_APPLICANT && (
                <div className="col-3">
                  <InputContainer>
                    <StyledLabel htmlFor="sexId">Sex</StyledLabel>

                    <StyledSelect
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...register('sexId')}
                      id="sexId"
                      data-testid="sexId">
                      <option value="">--- Select Sex ---</option>
                      {sexList.map((sex) => (
                        <option key={sex.id} value={sex.id} data-testid={`sexId_${sex.id}`}>
                          {sex.name}
                        </option>
                      ))}
                    </StyledSelect>
                  </InputContainer>
                </div>
              )}
            </div>
          )}

          {selectedContactType === Util.CONTACT_TYPE_APPLICANT && (
            <div className="row">
              <div className="col-3">
                <InputContainer>
                  <StyledLabel htmlFor="email">Email Address</StyledLabel>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('email')}
                    label="Email Address"
                    maxLength="100"
                    id="email"
                  />
                </InputContainer>
              </div>

              <div className="col-3">
                <InputContainer>
                  <StyledLabel htmlFor="inCareOf">In Care Of</StyledLabel>

                  <StyledInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('inCareOf')}
                    label="In Care Of"
                    maxLength="100"
                    id="inCareOf"
                  />
                </InputContainer>
              </div>
            </div>
          )}

          <AllBtns className="mt-3">
            <BtnContainer>
              <DrButton
                className="btn-size"
                data-testid="submitContactButton"
                id="submit-button"
                isDisabled={isSubmitting}
                onClick={() => {
                  validate();
                  handleSubmit(onSubmit)();
                }}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </DrButton>

              <DrButton className="btn-size" data-testid="cancelSaveContact" onClick={handleCloseCheck} variant="light">
                Cancel
              </DrButton>
            </BtnContainer>

            {!isCreate && (
              <DrButton
                data-testid="deleteContact"
                ariaLabel="deleteContact"
                onClick={() => setConfirmDelete(true)}
                variant="danger"
                className="btn-size">
                Delete Contact
              </DrButton>
            )}
          </AllBtns>
        </>
      )}
    </form>
  );
}

ContactForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setAlertMessageType: PropTypes.func.isRequired,
  contactToEdit: PropTypes.string,
  formCheck: PropTypes.shape({
    register: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    setValue: PropTypes.func.isRequired,
    trigger: PropTypes.func.isRequired,
    watch: PropTypes.func.isRequired,
    clearErrors: PropTypes.func.isRequired,
    formState: PropTypes.shape({
      errors: PropTypes.string,
      isValid: PropTypes.bool,
      isSubmitting: PropTypes.bool,
    }),
  }),
  handleCloseCheck: PropTypes.func.isRequired,
  isCreate: PropTypes.bool.isRequired,
  setConfirmDelete: PropTypes.func.isRequired,
};
