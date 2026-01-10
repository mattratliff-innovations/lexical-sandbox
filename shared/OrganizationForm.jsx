/* eslint-disable scribe/require-loading-check-for-axios */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DrAlert, DrButton, DrCard, DrIcon } from '@druid/druid';
import styled from '@emotion/styled';
import { useForm } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import AddressModal from './AddressModal';
import AddToOrganizationModal from './AddToOrganizationModal';
import './OrganizationForm.css';
import {
  CREATE_ACTION,
  DEFAULT_ADDRESS,
  DEFAULT_SIGNATURE,
  formatAddressLine1,
  formatAddressLine2,
  formatDefaultMessage,
  isExistingDefaultAddress,
  isExistingDefaultSignature,
  isOrgAddress,
  isOrgSignature,
  makeDefaultSignature,
  MISSING_DEFAULT_ADDRESS_MSG,
  MISSING_DEFAULT_SIGNATURE_MSG,
} from './OrganizationFormUtil';
import SignatoryModal, { SIGNATORY_IMAGES } from './SignatoryModal';
import SignaturePreview from './SignaturePreview';
import {
  BtnContainer,
  CardData,
  CheckBoxContainer,
  InputContainer,
  LabelContainer,
  StyledCheckbox,
  StyledHr,
  StyledInput,
  StyledInputUpperCase,
  StyledLabel,
  StyledNote,
  StyledOption,
  StyledSelect,
} from '../../../components/designedComponents';
import Spinner from '../../../components/spinner/Spinner';
import ControlledComboBox from '../../../components/typeaheadWithSelectedList/ControlledComboBox';
import { H1, H2 } from '../../../components/typography';
import { useAdminFormContext } from '../../../contexts/AdminFormContext';
import { APP_API_ENDPOINT, createAuthenticatedAxios } from '../../../http/authenticatedAxios';
import fetchHeaders from '../../../http/headers';
import { showToastError, showToastSuccess } from '../../../utils/toastHelpers';
import CustomError from '../../util/CustomError';
import useModalCheck from '../../util/customHooks/useModalCheck';
import DefaultModal from '../../util/DefaultModal';
import UtilityModal from '../../util/UtilityModal';

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
    position: 'relative',
    padding: '4px 6px 6px 0px',
    border: '3px solid #707070',
    borderRadius: '15px',
  },
};

const inActiveCardStyles = {
  container: {
    position: 'relative',
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

const StyledOptionBlank = styled(StyledOption)`
  color: gray;
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
  const [defaultHeadersList, setDefaultHeadersList] = useState([]);
  const [isDefaultHeadersListLoading, setIsDefaultHeadersListLoading] = useState(false);

  const navigate = useNavigate();
  const isUpdating = () => adminFormSettings && adminFormSettings.action !== 'Create';
  const ADDRESS_TYPE = 'AddressOrganizationType';
  const axios = createAuthenticatedAxios();

  const defaultValues = useMemo(
    () => ({
      name: adminFormData.name,
      code: adminFormData.code,
      daysForward: adminFormData.daysForward,
      active: adminFormData.active,
      headers: adminFormData.headers,
      letterTypes: adminFormData.letterTypes,
      occ: adminFormData.occ,
      headerId: adminFormData.headerId,
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
    const formData = new FormData();
    formData.append('default', data.active ? !isExistingDefaultSignature(adminFormData) : false);

    const images = data[SIGNATORY_IMAGES];
    const hasFiles = Array.isArray(images) && images.length > 0;
    const firstFile = hasFiles ? images[0] : null;

    Object.keys(data).forEach((key) => {
      if (key !== SIGNATORY_IMAGES) formData.append(key, data[key]);
    });

    if (firstFile) {
      formData.append('signatoryImage', firstFile);
    }

    const config = { headers: { 'content-type': 'multipart/form-data' } };
    try {
      const response = await axios.post(`${APP_API_ENDPOINT}/organizations/${adminFormData.id}/organization_signatures`, formData, config);
      const nextOrganizationSignatures = [...adminFormData.organizationSignatures, response.data];
      setAdminFormData({ ...adminFormData, organizationSignatures: nextOrganizationSignatures });
      setShowSignatoryModal(false);
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitUpdateSignature = async (data) => {
    const formData = new FormData();

    formData.append('default', data.active ? makeDefaultSignature(adminFormData, signatureToEdit.id) : false);

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
          header_id: data.headerId,
        },
      });

      if (adminFormSettings.action === CREATE_ACTION) {
        setOrganizationToEdit(response.data.id);
        setShowAddToOrgModal(true);
      } else {
        showToastSuccess(`Organization ${adminFormSettings.participle} successfully!`);
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
    if (addressToEdit?.id === undefined) return !isExistingDefaultAddress(adminFormData);
    // else if existing address, save the existing address value
    return addressToEdit.default;
  };

  useEffect(() => {
    setIsDefaultHeadersListLoading(true);
    fetchHeaders()
      .then((data) => {
        setDefaultHeadersList(data);
        setIsDefaultHeadersListLoading(false);
      })
      .catch(() => {
        showToastError('There was an error retrieving the Default Headers list');
        setIsDefaultHeadersListLoading(false);
      });
  }, []);

  const onSubmitAddress = async (data) => {
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

      showToastSuccess('The address was edited successfully!');
      setAdminFormData({ ...adminFormData, ...response.data });
      setShowAddressModal(false);
      setAddressToEdit({});
    } catch (e) {
      setAdminErrorMessage(e?.response?.data?.error);
    }
  };

  const onSubmitDefaultAddress = async () => {
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
      setMakeDefault(DEFAULT_ADDRESS);
      setDefaultMessage(formatDefaultMessage(item.address.nickname, DEFAULT_ADDRESS));
    } else {
      setSignatureToEdit(item);
      setDefaultMessage(formatDefaultMessage(item.signatoryName, DEFAULT_SIGNATURE));
      setMakeDefault(DEFAULT_SIGNATURE);
    }
    setShowDefaultModal(true);
  };

  return (
    <>
      <ToastContainer />
      <UtilityModal isOpen={isBlocked} setIsOpen={setIsBlocked} blocker={blocker} name="Organization" />

      <H1 data-testid="header">{`${adminFormSettings.action} Organization`}</H1>

      <form>
        <Spinner isVisible={isDefaultHeadersListLoading}>
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

              <InputContainer>
                <StyledLabel htmlFor="headerId" className="required">
                  Default Header
                </StyledLabel>
                <StyledSelect
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...register('headerId', {
                    required: {
                      value: true,
                      message: 'Default Header is required.',
                    },
                  })}
                  id="headerId"
                  aria-required="true"
                  data-testid="headerId">
                  <StyledOptionBlank value="" data-testid="headerId_blank">
                    --- Select a Default Header ---
                  </StyledOptionBlank>
                  {defaultHeadersList.map((defaultHeader) => (
                    <StyledOption key={defaultHeader.id} value={defaultHeader.id} data-testid={`headerId_${defaultHeader.id}`}>
                      {defaultHeader.name}
                    </StyledOption>
                  ))}
                </StyledSelect>

                {getFieldState('headerId').invalid && isSubmitted && (
                  <div className="text-danger mt-1" aria-live="polite" role="alert">
                    {errors?.headerId?.message}
                  </div>
                )}
              </InputContainer>
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

                  {isOrgAddress(adminFormData) && !isExistingDefaultAddress(adminFormData) && (
                    <DrAlert type="warn" noCloseBtn alert={MISSING_DEFAULT_ADDRESS_MSG} />
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
                                <div>{formatAddressLine1(orgAddrItem.address)}</div>
                                <div>{formatAddressLine2(orgAddrItem.address)}</div>
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
                  {isOrgSignature(adminFormData) && !isExistingDefaultSignature(adminFormData) && (
                    <DrAlert type="warn" noCloseBtn alert={MISSING_DEFAULT_SIGNATURE_MSG} />
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
        </Spinner>
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
        onSubmit={makeDefault === DEFAULT_ADDRESS ? onSubmitDefaultAddress : onSubmitDefaultSignature}
        defaultMessage={defaultMessage}
      />
    </>
  );
}
