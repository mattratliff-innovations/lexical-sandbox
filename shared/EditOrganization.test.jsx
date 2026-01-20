import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';

import EditOrganization from './EditOrganization';
import ListOrganizations from './ListOrganizations';
import OrganizationWrapper from './OrganizationWrapper';
import { SIGNATORY_IMAGES } from './SignatoryModal';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const invalidNameMsg = 'alphanumeric characters only';
const invalidDaysForwardMsg = 'A number from 0-30 is required.';
const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const ORIGINAL_HEADER_ID = '045f45c0-4c5a-4a1f-b688-6beec7abbe57';
const ORIGINAL_HEADER_NAME = 'Header1';
const UPDATED_HEADER_ID = '045f45c0-4c5a-4a1f-b688-6beec7abbe56';
const UPDATED_HEADER_NAME = 'Header2';
const ORG_ID = '19da6ce2-74f7-407e-95f3-3528e9256057';

const letterType1 = {
  id: 'c49cd7de-9197-43ce-882f-4325dd9bf18d',
  name: 'Letter Type 1',
  created_at: '2024-02-06T16:25:23.263Z',
  updated_at: '2024-02-06T16:25:23.263Z',
  starts_with: null,
  ends_with: null,
  margin_top: null,
  margin_right: null,
  margin_bottom: null,
  margin_left: null,
  active: true,
};

const letterType2 = {
  id: 'df0a42c5-760f-4955-b5c3-bd96a2626066',
  name: 'Letter Type 2',
  created_at: '2024-02-06T16:25:23.271Z',
  updated_at: '2024-02-06T16:25:23.271Z',
  starts_with: null,
  ends_with: null,
  margin_top: null,
  margin_right: null,
  margin_bottom: null,
  margin_left: null,
  active: true,
};

// Base organization data matching the new structure with organizationHeaderLetterTypeXrefs
const mockOrgData = {
  id: ORG_ID,
  name: 'Texas Service Center',
  code: 'TSC',
  occ: false,
  active: true,
  daysForward: 1,
  headerId: ORIGINAL_HEADER_ID,
  organizationAddressXrefs: [
    {
      id: '19da6ce2-74f7-407e-95f3-3528e9212',
      default: true,
      active: true,
      address: {
        id: '770a07d2-4df8-43f7-95fa-0be33e9567d4',
        nickname: 'ABC Nickname',
        preAddress: 'Pre Address 123',
        street: '21 Jump Street',
        aptSuiteFloor: 'Apt 301',
        city: 'Silver Lake',
        state: { id: 'ANY', code: 'MD', name: 'Maryland' },
        zipCode: '11111',
      },
    },
  ],
  organizationSignatures: [
    {
      id: 'ac0a07d2-4df8-43f7-95fa-0be33e9567d4',
      organizationId: ORG_ID,
      signatoryName: 'John Jay',
      signatoryTitle: 'Judge',
      active: true,
      default: true,
      premiumProcessing: false,
      createdAt: '2024-01-22T21:30:29.065Z',
      updatedAt: '2024-01-22T21:30:29.065Z',
      originalFilename: 'john_jay.png',
      signatureImageUrl: 'https://enormous_aws_url/sig.jpg',
    },
  ],
  letterTypes: [letterType1],
  organizationHeaderLetterTypeXrefs: [
    {
      id: 'xref-1',
      letterTypeId: letterType1.id,
      headerId: ORIGINAL_HEADER_ID,
      letterType: { id: letterType1.id, name: letterType1.name },
      header: { id: ORIGINAL_HEADER_ID, name: ORIGINAL_HEADER_NAME },
    },
  ],
  createdAt: '2023-12-05T21:42:49.347Z',
  updatedAt: '2023-12-08T20:07:18.033Z',
};

const mockOrgDataNoAddresses = {
  ...mockOrgData,
  organizationAddressXrefs: [],
};

const headersData = [
  {
    id: ORIGINAL_HEADER_ID,
    name: ORIGINAL_HEADER_NAME,
    active: true,
    createdAt: '2024-02-16T20:54:43.298Z',
    updatedAt: '2024-02-16T20:54:43.298Z',
    row1Col1: '<p>[[[LETTERHEADER_LETTER_DATE]]]</p>',
    row1Col2: '<p>[[[CIS_ADDRESS]]]</p>',
    row2Col1: '<p>[[[LETTERHEADER_ADDRESS_BLOCK]]]</p>',
    row2Col2: '<p>[[[LETTERHEADER_CIS_SEAL]]]</p>',
    row3Col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
    row3Col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p>',
  },
  {
    id: UPDATED_HEADER_ID,
    name: UPDATED_HEADER_NAME,
    active: true,
    createdAt: '2024-02-16T20:54:43.298Z',
    updatedAt: '2024-02-16T20:54:43.298Z',
    row1Col1: '<p>[[[LETTERHEADER_LETTER_DATE]]]</p>',
    row1Col2: '<p>[[[CIS_ADDRESS]]]</p>',
    row2Col1: '<p>[[[LETTERHEADER_ADDRESS_BLOCK]]]</p>',
    row2Col2: '<p>[[[LETTERHEADER_CIS_SEAL]]]</p>',
    row3Col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
    row3Col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p>',
  },
];

const createSignatureResponse = {
  id: '26291fdf-1e1d-4c68-8bfc-2ea2c7e5707b',
  organizationId: ORG_ID,
  signatoryName: 'Hamilton',
  signatoryTitle: 'Treasurer',
  active: true,
  default: true,
  premiumProcessing: false,
  createdAt: '2024-01-23T17:15:58.469Z',
  updatedAt: '2024-01-23T17:15:58.469Z',
  originalFilename: 'halloween.png',
  signatureImageUrl: 'https://enormous_aws_url/sig2.jpg',
};

const createAddressResponse = {
  ...mockOrgData,
  organizationAddressXrefs: [
    {
      id: 'addr-new',
      addressId: 'nn',
      default: true,
      active: true,
      address: {
        nickname: 'nn',
        preAddress: 'PA',
        street: '33 St',
        aptSuiteFloor: 'Fl 7',
        city: 'Rich',
        state: { id: 'ANY', code: 'VA', name: 'Virginia' },
        zipCode: '22222',
      },
    },
  ],
};

const letterTypesReturn = [
  {
    ...letterType1,
    organizations: [
      {
        id: ORG_ID,
        code: mockOrgData.code,
        name: mockOrgData.name,
        active: true,
        createdAt: mockOrgData.createdAt,
        updatedAt: mockOrgData.updatedAt,
      },
    ],
  },
  { ...letterType2, organizations: [] },
];

// Mock useParams & useNavigate together
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: ORG_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const mockHeadersCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/headers`);
const mockSuccessfulHeadersCall = () => mockHeadersCall().reply(200, headersData);
const mockFailureHeadersCall = () => mockHeadersCall().timeout();

const setMockData = (mockTestData = mockOrgData) => 
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/${ORG_ID}`).reply(200, mockTestData);

const setMockCreateSignatureResponse = () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/organizations/${ORG_ID}/organization_signatures`).reply(200, createSignatureResponse);
};

const setMockUpdateSignatureResponse = (rtnData) => {
  const orgSignatureId = mockOrgData.organizationSignatures[0].id;
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${ORG_ID}/organization_signatures/${orgSignatureId}`).reply(200, rtnData);
};

const setMockDataFail = () => mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/${ORG_ID}`).timeoutOnce();

const mockEditApiCall = (rtnData) => mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${ORG_ID}`).reply(200, rtnData);

const mockEditApiCallError = (rtnData) => mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${ORG_ID}`).reply(422, rtnData);

const mockDefaultAddressApiCall = (rtnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/default_address/${ORG_ID}`).reply(200, rtnData);
};

const mockDefaultSignatureApiCall = (rtnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${ORG_ID}/default_signature`).reply(200, rtnData.organizationSignatures);
};

const mockStateData = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/states`).reply(200, [{ id: 'any', code: 'AL', name: 'Alabama' }]);
};

const mockLetterTypesApiCall = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`, { params: { include_organization: true } }).reply(200, letterTypesReturn);
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/organizations" element={<OrganizationWrapper />}>
        <Route index element={<ListOrganizations />} />
        <Route path=":id" element={<EditOrganization />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/organizations/:id'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

describe('EditOrganization', () => {
  beforeEach(() => {
    setMockData();
    mockSuccessfulHeadersCall();
    mockLetterTypesApiCall();
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays Organization, signatures, and addresses', async () => {
    renderComponent();
    await waitForLoadingToFinish();
    const { address } = mockOrgData.organizationAddressXrefs[0];

    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();

    expect(await screen.findByText(/ABC Nickname/i)).toBeInTheDocument();
    expect(screen.getByText(address.preAddress)).toBeInTheDocument();
    expect(screen.getByText(/21 Jump Street, Apt 301/i)).toBeInTheDocument();
    expect(screen.getByText(/Silver Lake, MD 11111/i)).toBeInTheDocument();

    expect(screen.getByTestId('addAddressButton')).toBeInTheDocument();
    expect(screen.getByTestId('header', { name: /Signatories/i })).toBeInTheDocument();
    const orgSig = mockOrgData.organizationSignatures[0];
    const checkbox = screen.getByRole('checkbox', {
      name: 'Show OCC Message',
    });
    expect(checkbox.checked).toBe(false);

    expect(screen.getByTestId(`signature-edit-${orgSig.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`image-for-${orgSig.id}`).src).toBe(orgSig.signatureImageUrl);
  });

  it('redirects on cancel', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const cancelButton = screen.getByTestId('cancelButton');
    await userInstance.click(cancelButton);

    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations');
  });

  it('displays a successful message', async () => {
    const userInstance = userEvent.setup();

    const editData = {
      name: 'Vermont Service Center',
      active: false,
      daysForward: 3,
      occ: true,
      headerId: UPDATED_HEADER_ID,
    };
    mockEditApiCall({ ...mockOrgData, ...editData });
    renderComponent();
    await waitForLoadingToFinish();

    await userInstance.click(screen.getByLabelText('Organization is Active'));
    const checkbox = screen.getByRole('checkbox', {
      name: 'Show OCC Message',
    });
    expect(checkbox.checked).toBe(false);
    await userInstance.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await userInstance.type(screen.getByLabelText('Organization Name'), editData.name);
    
    const daysInput = screen.getByLabelText('Letter Business Days Forward');
    await userInstance.clear(daysInput);
    await userInstance.type(daysInput, String(editData.daysForward));
    
    await userInstance.selectOptions(screen.getByTestId('headerId'), UPDATED_HEADER_NAME);

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    expect(screen.getAllByText('Organization edited successfully!')[0]).toBeInTheDocument();

    const mockAxiosPutHistory = mockAxios.history.put;
    const putData = JSON.parse(mockAxiosPutHistory[0].data);

    expect(putData.organization.name).toContain(editData.name);
    expect(putData.organization.active).toBe(editData.active);
    expect(Number(putData.organization.daysForward)).toBe(editData.daysForward);
    expect(putData.organization.headerId).toBe(editData.headerId);
  });

  describe('Add Signatory', () => {
    it('allows a new signatory to be previewed and saved', async () => {
      const userInstance = userEvent.setup();

      renderComponent();
      await waitForLoadingToFinish();

      setMockCreateSignatureResponse();
      const fakeImageUrl = 'some_url';
      window.URL.createObjectURL = jest.fn().mockImplementation(() => fakeImageUrl);
      const fakeImage = new File(['file'], 'image.png', { type: 'image/png' });

      const modalBtn = await screen.findByTestId('showSignatoryModalButton');
      await userInstance.click(modalBtn);

      expect(screen.getByTestId('signatoryModalHeader').innerHTML.indexOf('Add Signatory')).toBeGreaterThan(-1);

      const signatoryName = screen.getByLabelText("Signatory's Name");
      await userInstance.type(signatoryName, createSignatureResponse.signatoryName);
      const signatoryTitle = screen.getByLabelText("Signatory's Title");
      await userInstance.type(signatoryTitle, createSignatureResponse.signatoryTitle);
      const inputEl = screen.getByTestId(`hidden-input-${SIGNATORY_IMAGES}`);
      Object.defineProperty(inputEl, 'files', { value: [fakeImage] });

      fireEvent.drop(inputEl);
      const thumbnailElement = await screen.findByTestId(`file-input-thumbnail-${SIGNATORY_IMAGES}`);
      expect(thumbnailElement.src.indexOf(fakeImageUrl)).toBeGreaterThan(-1);
      const previewImageElement = screen.getByTestId('signature-preview-image');
      expect(previewImageElement.src.indexOf(fakeImageUrl)).toBeGreaterThan(-1);
      const previewInnerHtml = screen.getByTestId('signaturePreview');
      expect(previewInnerHtml.innerHTML.indexOf(createSignatureResponse.signatoryName)).toBeGreaterThan(-1);
      expect(previewInnerHtml.innerHTML.indexOf(createSignatureResponse.signatoryTitle)).toBeGreaterThan(-1);

      const saveButton = screen.getByTestId('saveSignatoryButton');
      await userInstance.click(saveButton);

      expect(await screen.findByTestId(`signature-edit-${createSignatureResponse.id}`)).toBeInTheDocument();

      const mockAxiosPostHistory = mockAxios.history.post;
      const formData = mockAxiosPostHistory[0].data;
      const formDataEntries = [...formData.entries()];

      const formDataMap = formDataEntries.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

      expect(formDataMap.signatoryTitle).toEqual(createSignatureResponse.signatoryTitle);
      expect(formDataMap.signatoryName).toEqual(createSignatureResponse.signatoryName);
      expect(formDataMap.active).toEqual('true');
      expect(formDataMap.premiumProcessing).toEqual('false');
      expect(formDataMap.signatoryImage.path).toMatch(/image.png/);
    });

    it('shows validation messages on submittal and clears form when canceling', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const modalBtn = await screen.findByTestId('showSignatoryModalButton');
      await userInstance.click(modalBtn.shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeVisible());

      const saveButton = await screen.findByTestId('saveSignatoryButton');
      await userInstance.click(saveButton);

      expect(await screen.findByText('Signatory name is required!')).toBeInTheDocument();
      expect(await screen.findByText('Signatory title is required!')).toBeInTheDocument();

      const cancelSigModBtn = screen.getByTestId('cancelSignatoryModalButton');
      await userInstance.click(cancelSigModBtn);

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeNull());

      await userInstance.click(screen.getByTestId('showSignatoryModalButton'));

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeVisible());

      expect(screen.queryByText('Signatory title is required!')).toBeNull();
      expect(screen.queryByText('Signatory name is required!')).toBeNull();
      expect(screen.queryByText('Signature image is required!')).toBeNull();
    });
  });

  it('displays a post error duplicate message', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    const returnError = {
      error: 'Unable to edit Organization: Name has already been taken',
    };
    mockEditApiCallError(returnError);

    await userInstance.click(screen.getByLabelText('Organization is Active'));
    await userInstance.type(screen.getByLabelText('Organization Name'), mockOrgData.name);
    await userInstance.selectOptions(screen.getByTestId('headerId'), UPDATED_HEADER_NAME);

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    await screen.findByText(returnError.error);
  });
});

describe('EditOrganization Validations', () => {
  beforeEach(() => {
    setMockData();
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays alphanumeric error message for invalid name', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();
    const nameField = screen.getByLabelText('Organization Name');
    await userInstance.clear(nameField);
    await userInstance.type(nameField, 'Invalid Name !@#%');

    await waitFor(async () => {
      expect(nameField).toHaveValue('Invalid Name !@#%');
    });

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    await screen.findByText(invalidNameMsg);
  });

  it('displays no alphanumeric error message for valid name', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    userInstance.type(screen.getByLabelText('Organization Name'), 'Texas Service Center-123');

    await waitFor(() => expect(screen.queryByText(invalidNameMsg)).not.toBeInTheDocument());
  });

  it('displays error message for invalid header selection', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    // Change to blank option
    await userInstance.selectOptions(screen.getByTestId('headerId'), '');

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    await screen.findByText('Default Header is required.');
  });

  it('displays no error if valid Letter Business Days Forward', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const daysInput = screen.getByLabelText('Letter Business Days Forward');
    await userInstance.clear(daysInput);
    await userInstance.type(daysInput, '3');

    await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).not.toBeInTheDocument());
  });

  it('displays error if Letter Business Days Forward is invalid', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();
    const inputValue = screen.getByLabelText('Letter Business Days Forward');

    await waitFor(() => expect(inputValue.value).toEqual('1'));

    const numberInput = screen.getByRole('textbox', {
      name: 'Letter Business Days Forward',
    });
    expect(screen.queryByText(invalidDaysForwardMsg)).not.toBeInTheDocument();

    await userInstance.clear(numberInput);
    await userInstance.type(numberInput, '31');

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    await screen.findByText(invalidDaysForwardMsg);
  });
});

describe('EditOrganization Failing', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays a get error message when querying for the organization', async () => {
    setMockDataFail();
    mockSuccessfulHeadersCall();
    mockLetterTypesApiCall();
    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText('There was an error retrieving the organization.')).toBeInTheDocument();
  });

  it('displays a get error message when querying for headers', async () => {
    setMockData();
    mockFailureHeadersCall();
    mockLetterTypesApiCall();

    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText('Encountered an unknown error retrieving Headers.')).toBeInTheDocument();
  });
});

describe('Add Address', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
  });

  it('verifies required address fields', async () => {
    setMockData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('addAddressButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('addAddressButton'));

    await waitFor(() => expect(screen.getByTestId('saveAddressModalButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('saveAddressModalButton'));

    expect(screen.getByText('Address nickname is required!')).toBeInTheDocument();
    expect(screen.getByText('Street Address 1 is required!')).toBeInTheDocument();
    expect(screen.getByText('City is required!')).toBeInTheDocument();
    expect(screen.getByText('State is required!')).toBeInTheDocument();
    expect(screen.getByText('A 5-digit Zip Code is required!')).toBeInTheDocument();
  });

  it('verifies active button is pre selected when adding', async () => {
    setMockData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('addAddressButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('addAddressButton'));

    const checkbox = screen.getByRole('checkbox', {
      name: 'Address is Active',
    });
    expect(checkbox).not.toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it('allows a new address to be added', async () => {
    setMockData(mockOrgDataNoAddresses);
    mockStateData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    mockEditApiCall(createAddressResponse);

    const { address } = createAddressResponse.organizationAddressXrefs[0];

    await screen.findByTestId('addAddressButton');
    await userInstance.click(screen.getByTestId('addAddressButton'));

    expect(screen.getByText('First address is active and default')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', {
      name: 'Address is Active',
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();

    const nickName = screen.getByLabelText('Address Nickname');
    await userInstance.type(nickName, address.nickname);
    const address1 = screen.getByLabelText('Organization Street Address 1');
    await userInstance.type(address1, address.street);
    const city = screen.getByLabelText('Organization City');
    await userInstance.type(city, address.city);
    const zipCode = screen.getByLabelText('Org. Zip Code');
    await userInstance.type(zipCode, address.zipCode);
    await userInstance.selectOptions(screen.getByTestId('state'), 'Alabama');
    const preAddress = screen.getByLabelText('Organization Pre Address');
    await userInstance.type(preAddress, address.preAddress);
    const address2 = screen.getByLabelText('Organization Street Address 2');
    await userInstance.type(address2, address.aptSuiteFloor);

    const addressModalBtn = screen.getByTestId('saveAddressModalButton');
    await userInstance.click(addressModalBtn);

    await waitFor(() => expect(screen.queryByTestId('orgAddressModalBody')).toBeNull());
    expect(screen.getByText('The address was edited successfully!')).toBeInTheDocument();
  });
});

describe('Letter Types', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData();
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
  });

  it('assigns letter types', async () => {
    const userInstance = userEvent.setup();
    mockEditApiCall({ ...mockOrgData, letterTypes: letterTypesReturn });
    renderComponent();
    await waitForLoadingToFinish();

    await screen.findByText(/Associated Letter Types/i);

    const comboBoxContainer = await screen.findByTestId('letterTypes');

    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Letter Type 2');
    await userInstance.click(screen.getByText('Letter Type 2'));
    await userInstance.selectOptions(screen.getByTestId('headerId'), UPDATED_HEADER_NAME);

    const selected = screen.queryByTestId('typeaheadSelectedContainer_letterTypes');
    expect(selected).toHaveTextContent(letterType2.name);
    expect(selected).toHaveTextContent(letterType1.name);

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    expect((await screen.findAllByText('Organization edited successfully!')).length > 0).toBe(true);
  });

  it('removes letter types', async () => {
    const userInstance = userEvent.setup();
    mockEditApiCall({ ...mockOrgData, letterTypes: [] });
    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText(/Associated Letter Types/i)).toBeInTheDocument();

    const selected = screen.getByTestId('typeaheadSelectedContainer_letterTypes');
    expect(selected).toHaveTextContent(letterType1.name);
    expect(selected).not.toHaveTextContent(letterType2.name);

    await userInstance.click(screen.getByTestId(`removeButtonFor${letterType1.id}`));
    await userInstance.selectOptions(screen.getByTestId('headerId'), UPDATED_HEADER_NAME);

    expect(selected).not.toHaveTextContent(letterType1.name);

    const saveButton = screen.getByTestId('saveButton');
    await userInstance.click(saveButton);

    expect((await screen.findAllByText('Organization edited successfully!')).length > 0).toBe(true);

    const sentData = JSON.parse(mockAxios.history.put[0].data);
    expect(sentData.organization.letter_type_ids).toEqual([]);
  });
});

describe('Update Signature', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockSuccessfulHeadersCall();
    mockLetterTypesApiCall();
    setMockData(mockOrgData);
  });

  it('updates signature', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const signatoryId = mockOrgData.organizationSignatures[0].id;
    setMockUpdateSignatureResponse(createSignatureResponse);

    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
    const signatoryEdit = await screen.findByTestId(`signature-edit-${signatoryId}`);
    await userInstance.click(signatoryEdit);

    const signatoryName = screen.getByLabelText("Signatory's Name");
    await userInstance.clear(signatoryName);
    await userInstance.type(signatoryName, createSignatureResponse.signatoryName);

    const saveButton = screen.getByTestId('saveSignatoryButton');
    await userInstance.click(saveButton);

    expect(await screen.findByText(/Hamilton/i)).toBeInTheDocument();

    expect(mockAxios.history.put.length).toEqual(1);
    const updateUrl = mockAxios.history.put[0].url;
    const formData = mockAxios.history.put[0].data;
    expect(updateUrl).toEqual(expect.stringContaining(ORG_ID));
    expect(updateUrl).toEqual(expect.stringContaining(mockOrgData.organizationSignatures[0].id));
    expect(formData.has('signatoryName')).toBe(true);
  });

  it('cancels signature', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const signatoryId = mockOrgData.organizationSignatures[0].id;

    setMockUpdateSignatureResponse(createSignatureResponse);

    expect(await screen.findByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();

    const signEdit = await screen.findByTestId(`signature-edit-${signatoryId}`);
    await userInstance.click(signEdit);

    const signatoryName = screen.getByLabelText("Signatory's Name");
    await userInstance.type(signatoryName, createSignatureResponse.signatoryName);

    const cancelButton = screen.getByTestId('cancelSignatoryModalButton');
    await userInstance.click(cancelButton);

    expect(mockAxios.history.put.length).toEqual(0);

    await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeNull());
  });
});