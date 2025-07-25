/* eslint-disable require-loading-check-for-axios */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Flip, ToastContainer } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DrButton, DrCard, DrAlert, DrIcon } from '@druid/druid';
import CustomError from '../../util/CustomError';
import { createAuthenticatedAxios, APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import UtilityModal from '../../util/UtilityModal';
import './OrganizationForm.css';
import SignatoryModal, { SIGNATORY_IMAGES } from './SignatoryModal';
import SignaturePreview from './SignaturePreview';
import AddressModal from './AddressModal';
import useModalCheck from '../../util/customHooks/useModalCheck';
import AddToOrganizationModal from './AddToOrganizationModal';
import DefaultModal from '../../util/DefaultModal';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import * as Util from './OrganizationFormUtil';
import {
  StyledInput,
  StyledInputUpperCase,
  StyledCheckbox,
  CheckBoxContainer,
  LabelContainer,
  StyledLabel,
  StyledNote,
  StyledHr,
  BtnContainer,
  InputContainer,
  CardData,
} from '../../../components/designedComponents';
import { H1, H2 } from '../../../components/typography';

const OrgCodeContainer = styled.div`
  display: flex;
  gap: 16px;
`;

const LetterDayContainer = styled.div`
  display: flex;
  align-items: center;
  text-wrap: nowrap;
  gap: 8px;
`;

const LetterNote = styled.span`
  font-size: 14px;
  color: gray;
`;

const activeCardStyles = {
  container: {
    padding: '4px 6px 6px 0px',
    border: '3px solid #707070',
    borderRadius: '15px',
  },
};

const inActiveCardStyles = {
  container: {
    padding: '4px 6px 6px 0px',
    border: '3px solid #eeeeee',
    borderRadius: '15px',
    background: '#eeeeee',
  },
};

const btnCardStyles = {
  button: {
    border: 'none',
    background: 'none',
    padding: '0px',
    fontWeight: '700',
    cursor: 'pointer',
    marginRight: '5px',
    marginTop: '4px',
  },
};

const defaultBtnStyles = {
  button: {
    padding: '0px',
    textDecoration: 'none',
    color: '#0000EE',
    backgroundColor: '#FFFFFF',
  },
  buttonHover: {
    padding: '0px',
    textDecoration: 'none',
    color: '#0000EE',
    backgroundColor: '#FFFFFF',
  },
};

const DaysInput = styled(StyledInput)`
  width: 25%;
`;

export default function OrganizationForm() {
  const { setHandleButtonClick } = useOutletContext();
  const { adminFormSettings, setAdminFormData, adminFormData, setAdminErrorMessage } = useAdminFormContext();

  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddToOrgModal, setShowAddToOrgModal] = useState(false);
  const [organizationToEdit, setOrganizationToEdit] = useState('');
  const [addressToEdit, setAddressToEdit] = useState({});
  const [signatureToEdit, setSignatureToEdit] = useState({});
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [defaultMessage, setDefaultMessage] = useState('');
  const [makeDefault, setMakeDefault] = useState('');
  const [curAlertType, setCurAlertType] = useState('info');

  const navigate = useNavigate();
  const isUpdating = () => adminFormSettings && adminFormSettings.action !== 'Create';
  const ADDRESS_TYPE = 'AddressOrganizationType';

  const defaultValues = useMemo(
    () => ({
      name: adminFormData.name,
      code: adminFormData.code,
      daysForward: adminFormData.daysForward,
      active: adminFormData.active,
      headers: adminFormData.headers,
      letterTypes: adminFormData.letterTypes,
      occ: adminFormData.occ,
    }),
    [adminFormData]
  );

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    getFieldState,
    formState: { errors, isValid, isSubmitted, isSubmitting, isDirty },
  } = useForm({ mode: 'all', defaultValues });

  const { isBlocked, setIsBlocked, blocker } = useModalCheck(!isSubmitting && isDirty && !showAddToOrgModal);

  useEffect(() => {
    trigger();
    reset(defaultValues);
  }, [adminFormData]);

  const onSubmitSignature = async (data) => {
    const axios = createAuthenticatedAxios();
    const formData = new FormData();
    formData.append('default', data.active ? !Util.isExistingDefaultSignature(adminFormData) : false);

    Object.keys(data).forEach((key) => {
      if (key === SIGNATORY_IMAGES) formData.append('signatoryImage', data[key][0]);
      else formData.append(key, data[key]);
    });

    const config = { headers: { 'content-type': 'multipart/form-data' } };
    try {
      const response = await axios.post(`${APP_API_ENDPOINT}/organizations/${adminFormData.id}/organization_signatures`, formData, config);
      const nextOrganizationSignatures = [...adminFormData.organizationSignatures, response.data];
      setAdminFormData({
        ...adminFormData,
        organizationSignatures: nextOrganizationSignatures,
      });
      setShowSignatoryModal(false);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitUpdateSignature = async (data) => {
    const axios = createAuthenticatedAxios();
    const formData = new FormData();

    formData.append('default', data.active ? Util.makeDefaultSignature(adminFormData, signatureToEdit.id) : false);

    Object.keys(data).forEach((key) => {
      if (key !== SIGNATORY_IMAGES) formData.append(key, data[key]);
      // Indicates a File
      else if (key === SIGNATORY_IMAGES && Array.isArray(data[key])) formData.append('signatoryImage', data[key][0]);
    });

    const config = { headers: { 'content-type': 'multipart/form-data' } };

    try {
      const response = await axios.put(
        `${APP_API_ENDPOINT}/organizations/${adminFormData.id}/organization_signatures/${signatureToEdit.id}`,
        formData,
        config
      );
      const signatures = adminFormData.organizationSignatures.filter((signature) => signature.id !== signatureToEdit.id);
      signatures.push(response.data);
      setAdminFormData({
        ...adminFormData,
        organizationSignatures: signatures,
      });

      setShowSignatoryModal(false);
      setSignatureToEdit({});
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmit = async (data) => {
    const axios = createAuthenticatedAxios();
    const axiosAction = isUpdating() ? axios.put : axios.post;
    try {
      const response = await axiosAction(`${APP_API_ENDPOINT}/organizations/${adminFormData.id}`, {
        organization: {
          name: data.name,
          code: data.code,
          active: data.active,
          daysForward: data.daysForward,
          letter_type_ids: data.letterTypes.filter((letterType) => letterType.selected).map((selected) => selected.id),
          header_ids: data.headers.filter((header) => header.selected).map((selected) => selected.id),
          occ: data.occ,
        },
      });

      if (adminFormSettings.action === Util.CREATE_ACTION) {
        setOrganizationToEdit(response.data.id);
        setShowAddToOrgModal(true);
      } else {
        toast.success(`Organization ${adminFormSettings.participle} successfully!`, {
          position: 'top-center',
          autoClose: 1000,
          transition: Flip,
          theme: 'dark',
          toastId: 'toastOrganizationForm',
        });
        navigate('/admin/organizations');
      }
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const handleButtonClick = useCallback(() => {
    setCurAlertType(isValid ? 'info' : 'error');
    handleSubmit(onSubmit)();
  }, [isValid, handleSubmit, adminFormData]);

  // For save button under Quick Actions
  useEffect(() => {
    setHandleButtonClick(() => handleButtonClick);
  }, [handleButtonClick]);

  const setDefaultAddress = () => {
    // if new address determine if there is an exiting default
    if (addressToEdit?.id === undefined) return !Util.isExistingDefaultAddress(adminFormData);
    // else if existing address, save the existing address value
    return addressToEdit.default;
  };

  const onSubmitAddress = async (data) => {
    const axios = createAuthenticatedAxios();
    const endPoint = `${APP_API_ENDPOINT}/organizations/${adminFormData.id}`;
    const axiosAction = axios.put;

    try {
      const response = await axiosAction(endPoint, {
        organization: {
          organization_address_xrefs_attributes: [
            {
              id: addressToEdit?.id,
              default: !data.active ? data.active : setDefaultAddress(),
              active: data.active,
              address_attributes: {
                id: addressToEdit?.address?.id,
                nickname: data.nickname,
                pre_address: data.preAddress,
                apt_suite_floor: data.aptSuiteFloor,
                street: data.street,
                city: data.city,
                state_id: data.state,
                zip_code: data.zipCode,
                type: ADDRESS_TYPE,
              },
            },
          ],
        },
      });

      toast.success('The address was edited successfully!', {
        position: 'top-center',
        autoClose: 1000,
        transition: Flip,
        theme: 'dark',
        toastId: 'toastContact',
      });

      setAdminFormData({ ...adminFormData, ...response.data });
      setShowAddressModal(false);
      setAddressToEdit({});
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitDefaultAddress = async () => {
    const axios = createAuthenticatedAxios();
    const endPoint = `${APP_API_ENDPOINT}/organizations/default_address/${adminFormData.id}`;
    const axiosAction = axios.put;

    axiosAction(endPoint, {
      organization: {
        organization_address_xrefs_attributes: [{ id: addressToEdit?.id, default: true }],
      },
    })
      .then((response) => {
        setAdminFormData({ ...adminFormData, ...response.data });
        setShowDefaultModal(false);
        setAddressToEdit({});
      })
      .catch((e) => setAdminErrorMessage(e?.response?.data?.error));
  };

  const onSubmitDefaultSignature = async () => {
    const axios = createAuthenticatedAxios();

    const endPoint = `${APP_API_ENDPOINT}/organizations/${adminFormData.id}/default_signature`;
    const axiosAction = axios.put;

    axiosAction(endPoint, { id: signatureToEdit.id, default: true })
      .then((response) => {
        setAdminFormData({
          ...adminFormData,
          organizationSignatures: response.data,
        });
        setShowDefaultModal(false);
        setSignatureToEdit({});
      })
      .catch((e) => {
        setAdminErrorMessage(e?.response?.data?.error);
      });
  };

  const handleSignatureEdit = (signatureItem) => {
    setSignatureToEdit(signatureItem);
    setShowSignatoryModal(true);
  };

  const handleSetDefault = (item) => {
    if (item?.address?.nickname) {
      setAddressToEdit(item);
      setMakeDefault(Util.DEFAULT_ADDRESS);
      setDefaultMessage(Util.formatDefaultMessage(item.address.nickname, Util.DEFAULT_ADDRESS));
    } else {
      setSignatureToEdit(item);
      setDefaultMessage(Util.formatDefaultMessage(item.signatoryName, Util.DEFAULT_SIGNATURE));
      setMakeDefault(Util.DEFAULT_SIGNATURE);
    }
    setShowDefaultModal(true);
  };

  return (
    <>
      <ToastContainer />
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Organization" />

      <form>
        <div className="row">
          <div className="col-sm-10">
            <H1 data-testid="header">{`${adminFormSettings.action} Organization`}</H1>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <CustomError errorType={curAlertType} />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <InputContainer>
              <StyledLabel className="required" htmlFor="organization-name">
                Organization Name
              </StyledLabel>

              <StyledInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('name', {
                  required: { value: true, message: 'Name is required!' },
                  pattern: {
                    value: /^[a-z0-9]([\w\-\s])+$/i,
                    message: 'alphanumeric characters only',
                  },
                })}
                data-testid="nameInput"
                label="Name"
                maxLength="100"
                id="organization-name"
                placeholder="ex: Texas Service Center"
              />

              {getFieldState('name').invalid && isSubmitted && (
                <div className="text-danger mt-1" aria-live="polite" role="alert">
                  {' '}
                  {errors?.name?.message}
                </div>
              )}
            </InputContainer>

            <OrgCodeContainer>
              <InputContainer>
                <StyledLabel className="required" htmlFor="code">
                  Organization Code
                </StyledLabel>
                <StyledInputUpperCase
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('code', {
                    pattern: {
                      value: /^[A-Za-z]{3}$/g,
                      message: '3 Alpha characters only',
                    },
                    required: {
                      value: true,
                      message: 'Organization Code is required!',
                    },
                    maxLength: 3,
                  })}
                  label="Code"
                  maxLength={3}
                  id="code"
                />

                {getFieldState('code').invalid && isSubmitted && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {' '}
                    {errors?.code?.message}
                  </div>
                )}
              </InputContainer>

              <InputContainer>
                <StyledLabel className="required" htmlFor="days-forward">
                  Letter Business Days Forward
                </StyledLabel>

                <LetterDayContainer>
                  <DaysInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...register('daysForward', {
                      required: {
                        value: true,
                        message: 'Business Days Forward is required!',
                      },
                      pattern: {
                        valueAsNumber: true,
                        value: /^(0|[1-9]|[12]\d|30)$/,
                        message: 'A number from 0-30 is required.',
                      },
                    })}
                    maxLength="2"
                    label="Business Days Forward"
                    id="days-forward"
                  />
                  <LetterNote>Letter Date Adjustment</LetterNote>
                </LetterDayContainer>

                {getFieldState('daysForward').invalid && isSubmitted && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {' '}
                    {errors?.daysForward?.message}
                  </div>
                )}
              </InputContainer>
            </OrgCodeContainer>
          </div>
          <div className="col-sm-5">
            <CheckBoxContainer className="pt-4">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('active')}
                type="checkbox"
                id="active"
              />
              <LabelContainer>
                <StyledLabel htmlFor="active">Organization is Active</StyledLabel>
                <StyledNote>Uncheck to hide throughout the system</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
            <CheckBoxContainer className="pt-4">
              <StyledCheckbox
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...register('occ')}
                type="checkbox"
                id="occ"
              />
              <LabelContainer>
                <StyledLabel htmlFor="occ">Show OCC Message</StyledLabel>
                <StyledNote>Check to add message to footer encouraging recipients to sign-up for a USCIS online account</StyledNote>
              </LabelContainer>
            </CheckBoxContainer>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-5">
            <div className="d-flex align-items-center required">
              <H2>Associated Headers</H2>
            </div>

            <ControlledComboBox
              typeaheadId="headers"
              typeaheadLabel="Header(s)"
              control={control}
              name="headers"
              rule="Associated Header is required!"
            />
          </div>
          <div className="col-sm-5">
            <H2>Associated Letter Types</H2>
            <ControlledComboBox typeaheadId="letterType" typeaheadLabel="Letter Type(s)" control={control} name="letterTypes" />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-10">
            <StyledHr />
          </div>
        </div>

        {isUpdating() && (
          <>
            <div className="row mb-3">
              <div className="col-sm-10">
                <H2>Organization Addresses</H2>

                {Util.isOrgAddress(adminFormData) && !Util.isExistingDefaultAddress(adminFormData) && (
                  <DrAlert type="warn" noCloseBtn alert={Util.MISSING_DEFAULT_ADDRESS_MSG} />
                )}

                {adminFormData.organizationAddressXrefs?.map((orgAddress, rowIndex) => {
                  const rowItems = adminFormData.organizationAddressXrefs.slice(rowIndex * 2, rowIndex * 2 + 2);
                  return (
                    <div className="row mb-4" key={orgAddress.id}>
                      {rowItems.map((orgAddrItem) => (
                        <div className="col-sm-6" key={`orgAddress-${orgAddrItem.id}`}>
                          <DrCard orientation="horizontal" styles={!orgAddrItem.active ? inActiveCardStyles : activeCardStyles}>
                            <div className="d-flex mb-1">
                              <DrButton
                                size="small"
                                variant="unstlyed"
                                styles={btnCardStyles}
                                aria-label={`edit ${orgAddrItem.address.nickname}`}
                                data-testid={`edit-${orgAddrItem.address.id}`}
                                id={`edit-${orgAddrItem.address.id}`}
                                onClick={() => {
                                  setAddressToEdit(orgAddrItem);
                                  setShowAddressModal(true);
                                }}>
                                <DrIcon iconName="pen-to-square" color="black" />
                              </DrButton>

                              <span style={{ fontWeight: '700' }}>
                                {!orgAddrItem.active && ' (INACTIVE)'}
                                {` ${orgAddrItem.address.nickname}`}
                              </span>
                            </div>

                            <CardData>
                              <div
                                style={{
                                  fontWeight: '700',
                                  marginBottom: '4px',
                                }}>
                                Organization Address:
                              </div>
                              {orgAddrItem.address.preAddress && <div>{orgAddrItem.address.preAddress}</div>}
                              <div>{Util.formatAddressLine1(orgAddrItem.address)}</div>
                              <div>{Util.formatAddressLine2(orgAddrItem.address)}</div>
                            </CardData>

                            <div className="text-end">
                              {orgAddrItem.active && !orgAddrItem.default && (
                                <DrButton
                                  data-testid={`make default ${orgAddrItem.addressId}`}
                                  size="small"
                                  styles={defaultBtnStyles}
                                  variant="unstyled"
                                  onClick={() => handleSetDefault(orgAddrItem)}>
                                  Make Default
                                </DrButton>
                              )}

                              {orgAddrItem.default && (
                                <div data-testid={`default address ${orgAddrItem.addressId}`} style={{ color: '#707070' }}>
                                  Default Address
                                </div>
                              )}
                            </div>
                          </DrCard>
                        </div>
                      ))}
                      {rowItems.length === 1 && <div className="col-sm-6" />}
                    </div>
                  );
                })}

                <div className="d-flex align-items-center">
                  <DrButton
                    data-testid="addAddressButton"
                    styles={{
                      button: { borderColor: 'black', marginRight: '8px' },
                    }}
                    variant="secondary"
                    size="small"
                    id="add-button"
                    ariaLabel="Add Organization Address"
                    onClick={() => {
                      setAddressToEdit({});
                      setShowAddressModal(true);
                    }}>
                    <DrIcon iconName="plus" color="black" />
                  </DrButton>
                  <StyledLabel>Add Organization Address</StyledLabel>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-sm-10">
                <StyledHr />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-sm-10">
                <H2>Signatories</H2>
                {Util.isOrgSignature(adminFormData) && !Util.isExistingDefaultSignature(adminFormData) && (
                  <DrAlert type="warn" noCloseBtn alert={Util.MISSING_DEFAULT_SIGNATURE_MSG} />
                )}

                {adminFormData.organizationSignatures?.map((signature, rowIndex) => {
                  const rowItems = adminFormData.organizationSignatures.slice(rowIndex * 2, rowIndex * 2 + 2);
                  return (
                    <div className="row mb-4" key={signature.id}>
                      {rowItems.map((signatureItem) => (
                        <div className="col-sm-6" key={`signature-${signatureItem.id}`}>
                          <DrCard orientation="horizontal" styles={!signatureItem.active ? inActiveCardStyles : activeCardStyles}>
                            <div className="d-flex mb-1">
                              <DrButton
                                size="small"
                                variant="unstlyled"
                                styles={btnCardStyles}
                                aria-label={`edit ${signatureItem.signatoryName}`}
                                data-testid={`signature-edit-${signatureItem.id}`}
                                onClick={() => handleSignatureEdit(signatureItem)}>
                                <DrIcon iconName="pen-to-square" color="black" />
                              </DrButton>

                              <span style={{ fontWeight: '700' }}>
                                {!signatureItem.active && ' (INACTIVE)'}
                                {` ${signatureItem.signatoryName}`}
                              </span>
                            </div>

                            <div className="row">
                              <div className="col-sm-9">
                                <SignaturePreview
                                  id={`image-for-${signatureItem.id}`}
                                  signatureImageUrl={signatureItem.signatureImageUrl}
                                  signatoryName={signatureItem.signatoryName}
                                  signatoryTitle={signatureItem.signatoryTitle}
                                />
                              </div>

                              {signatureItem.active && (
                                <div className="col-sm-3 text-end make-default">
                                  {!signatureItem.default ? (
                                    <DrButton
                                      size="small"
                                      styles={defaultBtnStyles}
                                      variant="unstyled"
                                      data-testid={`make-default-${signatureItem.id}`}
                                      onClick={() => handleSetDefault(signatureItem)}>
                                      Make Default
                                    </DrButton>
                                  ) : (
                                    <div style={{ color: '#707070' }}>Default Signature</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </DrCard>
                        </div>
                      ))}
                      {rowItems.length === 1 && <div className="col-sm-6" />}
                    </div>
                  );
                })}

                <div className="d-flex align-items-center">
                  <DrButton
                    styles={{
                      button: { borderColor: 'black', marginRight: '8px' },
                    }}
                    variant="secondary"
                    size="small"
                    data-testid="showSignatoryModalButton"
                    ariaLabel="Add Signatory"
                    onClick={() => {
                      setSignatureToEdit({});
                      setShowSignatoryModal(true);
                    }}>
                    <DrIcon iconName="plus" color="black" />
                  </DrButton>
                  <StyledLabel>Add Signatory</StyledLabel>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-sm-6">
                <StyledHr />
              </div>
            </div>
          </>
        )}

        <BtnContainer>
          <DrButton data-testid="saveButton" className="btn-size" id="save-button" onClick={handleButtonClick} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </DrButton>

          <DrButton data-testid="cancelButton" className="btn-size" onClick={() => navigate('/admin/organizations')}>
            Cancel
          </DrButton>
        </BtnContainer>
      </form>

      <SignatoryModal
        showModal={showSignatoryModal}
        setShowModal={setShowSignatoryModal}
        onSubmit={Object.keys(signatureToEdit).length < 1 ? onSubmitSignature : onSubmitUpdateSignature}
        signatureToEdit={signatureToEdit}
      />

      <AddressModal showModal={showAddressModal} setShowModal={setShowAddressModal} onSubmit={onSubmitAddress} addressToEdit={addressToEdit} />

      <AddToOrganizationModal showModal={showAddToOrgModal} setShowModal={setShowAddToOrgModal} organizationToEdit={organizationToEdit} />

      <DefaultModal
        showModal={showDefaultModal}
        setShowModal={setShowDefaultModal}
        onSubmit={makeDefault === Util.DEFAULT_ADDRESS ? onSubmitDefaultAddress : onSubmitDefaultSignature}
        defaultMessage={defaultMessage}
      />
    </>
  );
}
