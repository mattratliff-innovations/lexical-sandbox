import * as React from 'react';
import { render, waitFor, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import EditOrganization from './EditOrganization';
import ListOrganizations from './ListOrganizations';
import OrganizationWrapper from './OrganizationWrapper';
import { SIGNATORY_IMAGES } from './SignatoryModal';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const invalidNameMsg = 'alphanumeric characters only';
const invalidDaysForwardMsg = 'A number from 0-30 is required.';
const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

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

const mockDataNoStartingAddresses = {
  name: 'Texas Service Center',
  code: 'TSC',
  occ: false,
  organization_address_xrefs: [],
  organization_signatures: [
    {
      id: 'ac0a07d2-4df8-43f7-95fa-0be33e9567d4',
      organization_id: 'bed00f1f-3da4-46f6-b65c-642fdfd8d0da',
      signatory_name: 'John Jay',
      signatory_title: 'Judge',
      active: true,
      default: true,
      premium_processing: false,
      created_at: '2024-01-22T21:30:29.065Z',
      updated_at: '2024-01-22T21:30:29.065Z',
      original_filename: 'john_jay.png',
      signature_image_url: 'https://enormous_aws_url/sig.jpg',
    },
  ],
  letter_types: [letterType1],
  active: true,
  days_forward: '1',
  id: '19da6ce2-74f7-407e-95f3-3528e9256057',
  created_at: '2023-12-05T21:42:49.347Z',
  updated_at: '2023-12-08T20:07:18.033Z',
};

const mockData = {
  name: 'Texas Service Center',
  code: 'TSC',
  occ: false,
  organization_address_xrefs: [
    {
      default: true,
      active: true,
      id: '19da6ce2-74f7-407e-95f3-3528e9212',
      address: {
        id: '770a07d2-4df8-43f7-95fa-0be33e9567d4',
        nickname: 'ABC Nickname',
        pre_address: 'Pre Address 123',
        street: '21 Jump Street',
        apt_suite_floor: 'Apt 301',
        city: 'Silver Lake',
        state: { id: 'ANY', code: 'MD', name: 'Maryland' },
        zip_code: '11111',
      },
    },
  ],
  organization_signatures: [
    {
      id: 'ac0a07d2-4df8-43f7-95fa-0be33e9567d4',
      organization_id: 'bed00f1f-3da4-46f6-b65c-642fdfd8d0da',
      signatory_name: 'John Jay',
      signatory_title: 'Judge',
      active: true,
      default: true,
      premium_processing: false,
      created_at: '2024-01-22T21:30:29.065Z',
      updated_at: '2024-01-22T21:30:29.065Z',
      original_filename: 'john_jay.png',
      signature_image_url: 'https://enormous_aws_url/sig.jpg',
    },
  ],
  letter_types: [letterType1],
  active: true,
  days_forward: '1',
  id: '19da6ce2-74f7-407e-95f3-3528e9256057',
  created_at: '2023-12-05T21:42:49.347Z',
  updated_at: '2023-12-08T20:07:18.033Z',
};

const ORIGINAL_HEADER_ID = '045f45c0-4c5a-4a1f-b688-6beec7abbe57';
const ORIGINAL_HEADER_NAME = 'Header1';

const UPDATED_HEADER_ID = '045f45c0-4c5a-4a1f-b688-6beec7abbe56';
const UPDATED_HEADER_NAME = 'Header2';

const headersData = [
  {
    id: ORIGINAL_HEADER_ID,
    name: ORIGINAL_HEADER_NAME,
    active: true,
    created_at: '2024-02-16T20:54:43.298Z',
    updated_at: '2024-02-16T20:54:43.298Z',
    row1_col1: '<p>[[[LETTER_DATE]]]</p>',
    row1_col2: '<p>[[[CIS_ADDRESS]]]</p>',
    row2_col1: '<p>[[[RECIPIENT_ADDRESS]]]</p>',
    row2_col2: '<p>[[[DHS_SEAL]]]</p>',
    row3_col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
    row3_col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p>',
    organization_header_xrefs: [
      {
        id: 'a212ab10-7258-4219-a8cf-add71cc478b8',
        organization_id: mockData.id,
        header_id: ORIGINAL_HEADER_ID,
        created_at: '2024-02-20T21:09:48.143Z',
        updated_at: '2024-02-20T21:09:48.143Z',
      },
    ],
  },
  {
    id: UPDATED_HEADER_ID,
    name: UPDATED_HEADER_NAME,
    active: true,
    created_at: '2024-02-16T20:54:43.298Z',
    updated_at: '2024-02-16T20:54:43.298Z',
    row1_col1: '<p>[[[LETTER_DATE]]]</p>',
    row1_col2: '<p>[[[CIS_ADDRESS]]]</p>',
    row2_col1: '<p>[[[RECIPIENT_ADDRESS]]]</p>',
    row2_col2: '<p>[[[DHS_SEAL]]]</p>',
    row3_col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
    row3_col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p>',
    organization_header_xrefs: [],
  },
];

const createSignatureResponse = {
  id: '26291fdf-1e1d-4c68-8bfc-2ea2c7e5707b',
  organization_id: mockData.id,
  signatory_name: 'Hamilton',
  signatory_title: 'Treasurer',
  active: true,
  default: true,
  premium_processing: false,
  created_at: '2024-01-23T17:15:58.469Z',
  updated_at: '2024-01-23T17:15:58.469Z',
  original_filename: 'halloween.png',
  signature_image_url: 'https://enormous_aws_url/sig2.jpg',
};

const createAddressResponse = {
  name: 'California Service Center',
  code: 'CSC',
  occ: false,
  active: true,
  id: '19da6ce2-74f7-407e-95f3-3528e9256057',
  organization_address_xrefs: [
    {
      addressId: 'nn',
      default: true,
      active: true,
      address: {
        nickname: 'nn',
        pre_address: 'PA',
        street: '33 St',
        apt_suite_floor: 'Fl 7',
        city: 'Rich',
        state: { id: 'ANY', code: 'VA', name: 'Virginia' },
        zip_code: '22222',
      },
    },
    {
      addressId: 'Daniel Id',
      default: false,
      active: true,
      address: {
        nickname: 'Daniel info',
        pre_address: 'SA',
        street: 'Daniel St',
        apt_suite_floor: 'Apt 4',
        city: 'Lava',
        state: { id: 'ANY', code: 'WY', name: 'Wyoming' },
        zip_code: '78454',
      },
    },
    {
      addressId: 'Perri Id',
      default: false,
      active: true,
      address: {
        nickname: 'Perri info',
        pre_address: 'DA',
        street: 'Perri st',
        apt_suite_floor: 'suit 101',
        city: 'Poshmart',
        state: { id: 'ANY', code: 'FL', name: 'Florida' },
        zip_code: '98954',
      },
    },
  ],
};

const defaultAddressMock = {
  name: 'California Service Center',
  code: 'CSC',
  occ: false,
  active: true,
  id: '19da6ce2-74f7-407e-95f3-3528e9256057',
  organization_address_xrefs: [
    {
      addressId: 'nn',
      default: false,
      active: true,
      address: {
        nickname: 'nn',
        pre_address: 'PA',
        street: '33 St',
        apt_suite_floor: 'Fl 7',
        city: 'Rich',
        state: { id: 'ANY', code: 'VA', name: 'Virginia' },
        zip_code: '22222',
      },
    },
    {
      addressId: 'Daniel Id',
      default: true,
      active: true,
      address: {
        nickname: 'Daniel info',
        pre_address: 'SA',
        street: 'Daniel St',
        apt_suite_floor: 'Apt 4',
        city: 'Lava',
        state: { id: 'ANY', code: 'WY', name: 'Wyoming' },
        zip_code: '78454',
      },
    },
    {
      addressId: 'Perri Id',
      default: false,
      active: true,
      address: {
        nickname: 'Perri info',
        pre_address: 'DA',
        street: 'Perri st',
        apt_suite_floor: 'suit 101',
        city: 'Poshmart',
        state: { id: 'ANY', code: 'WY', name: 'Wyoming' },
        zip_code: '98954',
      },
    },
  ],
  organization_signatures: [],
};

const defaultSignatureMock = {
  name: 'Texas Service Center',
  code: 'TSC',
  occ: false,
  organization_address_xrefs: [],
  organization_signatures: [
    {
      id: '26291fdf-1e1d-4c68-8bfc-2ea2c7e5707b',
      organization_id: mockData.id,
      signatory_name: 'Hamilton',
      signatory_title: 'Treasurer',
      active: true,
      default: false,
      premium_processing: false,
      created_at: '2024-01-23T17:15:58.469Z',
      updated_at: '2024-01-23T17:15:58.469Z',
      original_filename: 'halloween.png',
      signature_image_url: 'https://enormous_aws_url/sig2.jpg',
    },
  ],
  active: true,
  id: mockData.id,
};

const inactiveSignatureMock = {
  name: 'Texas Service Center',
  code: 'TSC',
  occ: false,
  organization_address_xrefs: [],
  organization_signatures: [
    {
      id: '26291fdf-1e1d-4c68-8bfc-2ea2c7e5707b',
      organization_id: mockData.id,
      signatory_name: 'Hamilton',
      signatory_title: 'Treasurer',
      active: false,
      default: false,
      premium_processing: false,
      created_at: '2024-01-23T17:15:58.469Z',
      updated_at: '2024-01-23T17:15:58.469Z',
      original_filename: 'halloween.png',
      signature_image_url: 'https://enormous_aws_url/sig2.jpg',
    },
  ],
  active: true,
  id: mockData.id,
};

const inactiveAddressMock = {
  name: 'California Service Center',
  code: 'CSC',
  active: true,
  occ: false,
  id: '19da6ce2-74f7-407e-95f3-3528e9256057',
  organization_address_xrefs: [
    {
      default: false,
      active: false,
      address: {
        nickname: 'nn',
        pre_address: 'PA',
        street: '33 St',
        apt_suite_floor: 'Fl 7',
        city: 'Rich',
        state: { id: 'ANY', code: 'VA', name: 'Virginia' },
        zip_code: '22222',
      },
    },
  ],
  organization_signatures: [],
};

const letterTypesReturn = [
  {
    ...letterType1,
    organizations: [
      {
        id: mockData.id,
        code: mockData.code,
        name: mockData.name,
        active: true,
        created_at: mockData.created_at,
        updated_at: mockData.updated_at,
      },
    ],
  },
  { ...letterType2, organizations: [] },
];

// Mock useParams & useNavigate together
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: mockData.id }),
  useNavigate: () => mockedUseNavigate,
}));

const mockHeadersCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/headers/available_headers_for_organization`);

const mockSuccessfulHeadersCall = () => mockHeadersCall().reply(200, headersData);

const mockFailureHeadersCall = () => mockHeadersCall().timeout();

const setMockData = (mockTestData = mockData) => mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/${mockData.id}`).reply(200, mockTestData);

const setMockCreateSignatureResponse = () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/organizations/${mockData.id}/organization_signatures`).reply(200, createSignatureResponse);
};

const setMockUpdateSignatureResponse = (rtnData) => {
  const orgSignatureId = mockData.organization_signatures[0].id;
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${mockData.id}/organization_signatures${orgSignatureId}`).reply(200, rtnData);
};

const setMockDataFail = () => mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/${mockData.id}`).timeoutOnce();

const mockEditApiCall = (rtnData) => mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${mockData.id}`).reply(200, rtnData);

const mockEditApiCallError = (rtnData) => mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${mockData.id}`).reply(422, rtnData);

const mockDefaultAddressApiCall = (rtnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/default_address/${mockData.id}`).reply(200, rtnData);
};

const mockDefaultSignatureApiCall = (rtnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/organizations/${rtnData.id}/default_signature`).reply(200, rtnData);
};

const mockStateData = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/states`).reply(200, [{ id: 'any', code: 'AL', name: 'Alabama' }]);
};

const druidAlertTest = async (alertType) => {
  await waitFor(() => {
    const druidAlert = document.querySelector('dr-alert').shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
    if (alertType === 'show-required') {
      expect(druidAlert).toHaveTextContent('Some required fields need to be updated.');
    } else {
      expect(druidAlert).not.toHaveTextContent('Some required fields need to be updated.');
    }
  });
};

const mockLetterTypesApiCall = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`).reply(200, letterTypesReturn);
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
    const { address } = mockData.organization_address_xrefs[0];

    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();

    expect(await screen.findByText(/ABC Nickname/i)).toBeInTheDocument();
    expect(screen.getByText(address.pre_address)).toBeInTheDocument();
    expect(screen.getByText(/21 Jump Street, Apt 301/i)).toBeInTheDocument();
    expect(screen.getByText(/Silver Lake, MD 11111/i)).toBeInTheDocument();
    expect(screen.getByTestId('addAddressButton')).toBeInTheDocument();
    expect(screen.getByTestId('header', { name: /Signatures/i })).toBeInTheDocument();
    const orgSig = mockData.organization_signatures[0];
    const checkbox = screen.getByRole('checkbox', {
      name: 'Show OCC Message',
    });
    expect(checkbox.checked).toBe(false);

    expect(screen.getByTestId(`signature-edit-${orgSig.id}`)).toBeInTheDocument();

    expect(screen.getByTestId(`image-for-${orgSig.id}`).src).toBe(orgSig.signature_image_url);
  });

  it('redirects on cancel', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const { shadowRoot } = screen.getByTestId('cancelButton');
    await waitFor(() => expect(shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // await userInstance.click(screen.getByTestId('cancelButton'));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations');
  });

  // The below test uses mockAxios.history which is great and allow us to get closer to the real scenario.
  // There appears to be a possible bug with it not releasing the previous data set with more than one axios mocks.
  // Thru trial and error below is a working setup allowing us to test the edit data. The edit data append to the previous data.
  // At least it's error and warning free:-)
  it('displays a successful message', async () => {
    const userInstance = userEvent.setup();

    const editData = {
      name: 'Vermont Service Center',
      active: 'false',
      days_forward: '3',
      occ: 'true',
    };
    mockEditApiCall(editData);
    renderComponent();
    await waitForLoadingToFinish();

    const comboBoxContainer = await screen.findByTestId('headers');
    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header2');
    await userInstance.click(screen.getByText('Header2'));

    await userInstance.click(screen.getByTestId('removeButtonFor045f45c0-4c5a-4a1f-b688-6beec7abbe57'));

    await userInstance.click(screen.getByLabelText('Organization is Active'));
    const checkbox = screen.getByRole('checkbox', {
      name: 'Show OCC Message',
    });
    expect(checkbox.checked).toBe(false);
    await userInstance.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await userInstance.type(screen.getByLabelText('Organization Name'), editData.name);
    await userInstance.type(screen.getByLabelText('Letter Business Days Forward'), editData.days_forward);

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.queryAllByText('Organization edited successfully!')[0]).toBeInTheDocument();

    await waitFor(() => {
      const mockAxiosPutHistory = mockAxios.history.put;
      const putData = JSON.parse(mockAxiosPutHistory[0].data);
      Object.entries(editData).forEach(([key, value]) => expect(String(putData.organization[key])).toContain(value));
      expect(putData.organization.header_ids).toHaveLength(1);
      expect(putData.organization.header_ids[0]).toBe(UPDATED_HEADER_ID);
    });
  });

  // Same as above but with a different submit button
  it('displays a successful message for submit button under Quick Actions', async () => {
    const userInstance = userEvent.setup();

    const editData = {
      name: 'Vermont Service Center',
      active: 'false',
      days_forward: '3',
    };
    mockEditApiCall(editData);
    renderComponent();
    await waitForLoadingToFinish();

    const comboBoxContainer = await screen.findByTestId('headers');
    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header2');
    await userInstance.click(screen.getByText('Header2'));

    await userInstance.click(screen.getByTestId('removeButtonFor045f45c0-4c5a-4a1f-b688-6beec7abbe57'));
    await userInstance.click(screen.getByLabelText('Organization is Active'));
    await userInstance.type(screen.getByLabelText('Organization Name'), editData.name);
    await userInstance.type(screen.getByLabelText('Letter Business Days Forward'), editData.days_forward);

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.queryAllByText('Organization edited successfully!')[0]).toBeInTheDocument();

    await waitFor(() => {
      const mockAxiosPutHistory = mockAxios.history.put;
      const putData = JSON.parse(mockAxiosPutHistory[0].data);
      Object.entries(editData).forEach(([key, value]) => expect(String(putData.organization[key])).toContain(value));
      expect(putData.organization.header_ids).toHaveLength(1);
      expect(putData.organization.header_ids[0]).toBe(UPDATED_HEADER_ID);
    });
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

      await userInstance.click(modalBtn.shadowRoot.querySelector('.dr-btn'));

      await druidAlertTest('show-default');

      expect(screen.getByTestId('signatoryModalHeader').innerHTML.indexOf('Add Signatory')).toBeGreaterThan(-1);

      const signatoryName = screen.getByLabelText("Signatory's Name");
      await userInstance.type(signatoryName, createSignatureResponse.signatory_name);
      const signatoryTitle = screen.getByLabelText("Signatory's Title");
      await userInstance.type(signatoryTitle, createSignatureResponse.signatory_title);
      const inputEl = screen.getByTestId(`hidden-input-${SIGNATORY_IMAGES}`);
      Object.defineProperty(inputEl, 'files', { value: [fakeImage] });

      await fireEvent.drop(inputEl);
      const thumbnailElement = await screen.findByTestId(`file-input-thumbnail-${SIGNATORY_IMAGES}`);
      expect(thumbnailElement.src.indexOf(fakeImageUrl)).toBeGreaterThan(-1);
      const previewImageElement = screen.getByTestId('signature-preview-image');
      expect(previewImageElement.src.indexOf(fakeImageUrl)).toBeGreaterThan(-1);
      const previewInnerHtml = screen.getByTestId('signaturePreview');
      expect(previewInnerHtml.innerHTML.indexOf(createSignatureResponse.signatory_name)).toBeGreaterThan(-1);
      expect(previewInnerHtml.innerHTML.indexOf(createSignatureResponse.signatory_title)).toBeGreaterThan(-1);

      const { shadowRoot } = screen.getByTestId('saveSignatoryButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByTestId(`signature-edit-${createSignatureResponse.id}`)).toBeInTheDocument();

      const mockAxiosPostHistory = mockAxios.history.post;
      const formData = mockAxiosPostHistory[0].data;
      [...formData.entries()].forEach((pair) => {
        const value = pair[1];
        switch (pair[0]) {
          case 'signatory_title':
            expect(value).toEqual(createSignatureResponse.signatory_title);
            break;
          case 'signatory_name':
            expect(value).toEqual(createSignatureResponse.signatory_name);
            break;
          case 'active':
            expect(value).toEqual('true');
            break;
          case 'premium_processing':
            expect(value).toEqual('false');
            break;
          case 'signatory_image':
            expect(value.path).toMatch(/image.png/);
            break;
          default:
        }
      });
    });

    it('shows validation messages and required druid alert on submittal and clears the form when canceling', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const modalBtn = await screen.findByTestId('showSignatoryModalButton');
      await userInstance.click(modalBtn.shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeVisible());

      await waitFor(() => {
        const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
        expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      });

      const { shadowRoot } = await screen.findByTestId('saveSignatoryButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => {
        const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
        expect(druidAlert).toHaveTextContent('Some required fields need to be updated.');
      });

      expect(await screen.findByText('Signatory name is required!')).toBeInTheDocument();
      expect(await screen.findByText('Signatory title is required!')).toBeInTheDocument();
      expect(await screen.findByText('Signature image is required!')).toBeInTheDocument();

      const cancelSigModBtn = screen.getByTestId('cancelSignatoryModalButton');
      await userInstance.click(cancelSigModBtn.shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeNull());

      await userInstance.click(screen.getByTestId('showSignatoryModalButton').shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeVisible());

      // All the validations are gone
      expect(screen.queryByText('Signatory title is required!')).toBeNull();
      expect(screen.queryByText('Signatory name is required!')).toBeNull();
      expect(screen.queryByText('Signature image is required!')).toBeNull();

      await waitFor(() => {
        // The alert is reset to the default message
        const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
        expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      });
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
    await userInstance.type(screen.getByLabelText('Organization Name'), mockData.name);

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    waitFor(() => expect(screen.getByText(returnError.error)).toBeInTheDocument());
  });
});

describe('EditOrganization Validations', () => {
  beforeEach(() => {
    setMockData();
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
    renderComponent();
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays alphanumeric error message for invalid name', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    const nameField = screen.getByLabelText('Organization Name');

    await waitFor(async () => {
      await userInstance.clear(nameField);
      await userInstance.type(nameField, 'Invalid Name !@#%');
      expect(nameField).toHaveValue('Invalid Name !@#%');
    });

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByText(invalidNameMsg)).toBeInTheDocument());
  });

  it('displays no alphanumeric error message for valid name', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    userInstance.type(screen.getByLabelText('Organization Name'), 'Texas Service Center-123');

    await waitFor(() => expect(screen.queryByText(invalidNameMsg)).not.toBeInTheDocument());
  });

  it('displays error message for invalid header mapping name', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    await waitFor(() => expect(screen.findByTestId('headers')).toBeDefined());

    await userInstance.click(screen.getByTestId(`removeButtonFor${ORIGINAL_HEADER_ID}`));

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByText('Associated Header is required!')).toBeInTheDocument());
  });

  it('displays no error if valid  Letter Business Days Forward', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    userInstance.type(screen.getByLabelText('Letter Business Days Forward'), '3');

    await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).not.toBeInTheDocument());
  });

  it('displays error if Letter Business Days Forward is invalid', async () => {
    await waitForLoadingToFinish();
    const inputValue = screen.getByLabelText('Letter Business Days Forward');

    await waitFor(() => expect(inputValue.value).toEqual('1'));

    const userInstance = userEvent.setup();
    const numberInput = screen.getByRole('textbox', {
      name: 'Letter Business Days Forward',
    });
    expect(screen.queryByText(invalidDaysForwardMsg)).not.toBeInTheDocument();

    await userInstance.clear(numberInput);
    await userInstance.type(numberInput, '03');

    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).toBeInTheDocument());
  });
});

describe('EditOrganization Failing', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays a get error message when querying for the organization', async () => {
    setMockDataFail(); //  no axios call, timeout, and 400 are all same in this context
    mockSuccessfulHeadersCall();
    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText('There was an error retrieving the organization.')).toBeInTheDocument();
  });

  it('displays a get error message when querying for the letter type mappings', async () => {
    setMockData();
    mockFailureHeadersCall();

    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText('Encountered an unknown error retrieving headers.')).toBeInTheDocument();
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
    await userInstance.click(screen.getByTestId('addAddressButton').shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      expect(druidAlert).not.toHaveTextContent('Some required fields need to be updated.');
    });

    await waitFor(() => expect(screen.getByTestId('saveAddressModalButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('saveAddressModalButton').shadowRoot.querySelector('.dr-btn'));

    // this is a false positive and needs to be fixed. Add an await but it will fail
    waitFor(() => {
      const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      expect(druidAlert).toHaveTextContent('Some required fields need to be updated.');
    });

    // this is a false positive and needs to be fixed. Add an await but it will fail
    waitFor(() => {
      expect(screen.queryByText('Address nickname is required!')).toBeInTheDocument();
      expect(screen.queryByText('Street Address 1 is required!')).toBeInTheDocument();
      expect(screen.queryByText('City is required!')).toBeInTheDocument();
      expect(screen.queryByText('State is required!')).toBeInTheDocument();
      expect(screen.queryByText('A 5-digit Zip Code is required!')).toBeInTheDocument();
    });
  });

  it('verifies active button is pre selected when adding', async () => {
    setMockData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('addAddressButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('addAddressButton').shadowRoot.querySelector('.dr-btn'));

    const checkbox = screen.getByRole('checkbox', {
      name: 'Address is Active',
    });
    expect(checkbox).not.toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it('allows a new address to be added', async () => {
    setMockData(mockDataNoStartingAddresses);
    mockStateData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    mockEditApiCall(createAddressResponse);

    const { address } = createAddressResponse.organization_address_xrefs[0];

    await waitFor(() => expect(screen.getByTestId('addAddressButton')).toBeDefined());
    await userInstance.click(screen.getByTestId('addAddressButton').shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      expect(druidAlert).not.toHaveTextContent('Some required fields need to be updated.');
    });

    expect(screen.getByText('First address is active and default')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', {
      name: 'Address is Active',
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();

    const { shadowRoot } = await screen.findByTestId('saveAddressModalButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const druidAlert = document.querySelector('div[role="dialog"] dr-alert').shadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      expect(druidAlert).toHaveTextContent('Some required fields need to be updated.');
    });

    const contactModalBody = screen.getByTestId('orgAddressModalBody');
    expect(contactModalBody).toHaveTextContent('Organization Pre Address');
    expect(contactModalBody).toHaveTextContent('Organization Street Address 2');

    const nickName = screen.getByLabelText('Address Nickname');
    await userInstance.type(nickName, address.nickname);
    const address1 = screen.getByLabelText('Organization Street Address 1');
    await userInstance.type(address1, address.street);
    const city = screen.getByLabelText('Organization City');
    await userInstance.type(city, address.city);
    const zipCode = screen.getByLabelText('Org. Zip Code');
    await userInstance.type(zipCode, address.zip_code);
    await userInstance.selectOptions(screen.getByTestId('state'), 'Alabama');
    const preAddress = screen.getByLabelText('Organization Pre Address');
    await userInstance.type(preAddress, address.pre_address);
    const address2 = screen.getByLabelText('Organization Street Address 2');
    await userInstance.type(address2, address.apt_suite_floor);

    const addressModalBtn = screen.getByTestId('saveAddressModalButton');
    await userInstance.click(addressModalBtn.shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('orgAddressModalBody')).toBeNull());
    expect(screen.queryByText(/Default Address/i)).toBeInTheDocument();
  });

  it('cancels address closes modal', async () => {
    setMockData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    const { address } = mockData.organization_address_xrefs[0];

    await waitFor(() => {
      expect(screen.queryByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
      expect(screen.queryByText(/21 Jump Street, Apt 301/i)).toBeInTheDocument();
    });

    const { shadowRoot } = await screen.findByTestId(`edit-${address.id}`);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const contactModalBody = screen.queryByTestId('orgAddressModalBody');
      expect(contactModalBody).toHaveTextContent('Organization Pre Address');
    });

    expect(screen.getByText('Default address must remain active')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: 'Address is Active',
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();

    const cancelAddressModBtn = await screen.findByTestId('cancelAddressModalButton');
    await userInstance.click(cancelAddressModBtn.shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('orgAddressModalBody')).toBeNull());
  });

  it('X button closes modal', async () => {
    setMockData();
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    const { address } = mockData.organization_address_xrefs[0];
    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
    const editAddress = await screen.findByTestId(`edit-${address.id}`);
    await userInstance.click(editAddress.shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const contactModalBody = screen.getByTestId('orgAddressModalBody');
      expect(contactModalBody).toHaveTextContent('Organization Pre Address');
    });

    await userInstance.click(screen.getByTestId('closeButtonModal'));
    await waitFor(() => expect(screen.queryByTestId('orgAddressModalBody')).toBeNull());
  });
});

describe('Default Address', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData(defaultAddressMock);
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
    renderComponent();
  });

  it('closes modal on no', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    expect(await screen.findByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
    expect(await screen.findByText(/33 St, Fl 7/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Make Default')).toHaveLength(2));

    await userInstance.click(screen.getAllByText('Make Default')[0].shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByTestId('defaultModalBody')).toHaveTextContent(
      'Are you sure you want to make nn the Default Address?' +
        "Note: This will change the organization's address on all drafts for users in this organization."
    );

    const { shadowRoot } = await screen.findByTestId('noButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('defaultModalBody')).toBeNull());
  });

  it('saves default modal on yes', async () => {
    const userInstance = userEvent.setup();

    mockDefaultAddressApiCall(createAddressResponse);

    await waitFor(() => {
      expect(screen.queryByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();

      expect(screen.queryByText(/33 St, Fl 7/i)).toBeInTheDocument();
      expect(screen.getAllByText('Make Default')).toHaveLength(2);
    });

    await userInstance.click(screen.getByTestId('make default nn').shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByTestId('defaultModalBody')).toHaveTextContent(
      'Are you sure you want to make nn the Default Address?' +
        "Note: This will change the organization's address on all drafts for users in this organization."
    );

    const { shadowRoot } = await screen.findByTestId('YesButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByTestId('default address nn')).toBeInTheDocument();
    expect(await screen.findByText(/Default Address/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('defaultModalBody')).toBeNull());
  });
});

describe('Default Signature', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData(defaultSignatureMock);
    mockLetterTypesApiCall();
    mockSuccessfulHeadersCall();
    renderComponent();
  });

  it('closes modal on no', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    const signatoryName = defaultSignatureMock.organization_signatures[0].signatory_name;

    await waitFor(() => {
      expect(screen.queryByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
      expect(screen.getByTestId(/make-default/)).toBeVisible();
    });

    await userInstance.click(screen.getByTestId(/make-default/).shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const contactModalBody = screen.getByTestId('defaultModalBody');

      expect(contactModalBody).toHaveTextContent(
        `Are you sure you want to make ${signatoryName} the Default Signature?` +
          "Note: This will change the organization's signature on all drafts for users in this organization."
      );
    });

    const { shadowRoot } = await screen.findByTestId('noButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('defaultModalBody')).toBeNull());
  });

  it('saves default modal on yes', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    const signatoryName = defaultSignatureMock.organization_signatures[0].signatory_name;

    await mockDefaultSignatureApiCall(createSignatureResponse);
    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId(/make-default/)).toBeVisible());
    await userInstance.click(screen.getByTestId(/make-default/).shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const contactModalBody = screen.getByTestId('defaultModalBody');
      expect(contactModalBody).toHaveTextContent(`Are you sure you want to make ${signatoryName} the Default Signature`);
    });

    const { shadowRoot } = await screen.findByTestId('YesButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.queryByText(/Default Signature/i)).toBeInTheDocument();
  });

  it('X closes modal', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    const signatoryName = defaultSignatureMock.organization_signatures[0].signatory_name;

    await waitFor(() => {
      expect(screen.queryByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
      expect(screen.getByTestId(/make-default/)).toBeVisible();
    });

    await userInstance.click(screen.getByTestId(/make-default/).shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      const contactModalBody = screen.queryByTestId('defaultModalBody');
      expect(contactModalBody).toHaveTextContent(
        `Are you sure you want to make ${signatoryName} the Default Signature?` +
          "Note: This will change the organization's signature on all drafts for users in this organization."
      );
    });

    await userInstance.click(await screen.findByTestId('closeButtonModal'));

    await waitFor(() => expect(screen.queryByTestId('defaultModalBody')).toBeNull());
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
    mockEditApiCall({ ...mockData, letter_types: letterTypesReturn });
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.queryByText(/Associated Letter Types/i)).toBeInTheDocument());

    const comboBoxContainer = await screen.findByTestId('letterType');

    await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Letter Type 2');
    await userInstance.click(screen.getByText('Letter Type 2'));

    // Check the Selected Letter Types
    await waitFor(() => {
      const selected = screen.queryByTestId('typeaheadSelectedContainer_letterType');
      expect(selected).toHaveTextContent(letterType2.name); // new type
      expect(selected).toHaveTextContent(letterType1.name);
    });

    // Click Save
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // Verify success
    expect((await screen.findAllByText('Organization edited successfully!')).length > 0).toBe(true);
  });

  it('removes letter types', async () => {
    const userInstance = userEvent.setup();
    mockEditApiCall({ ...mockData, letter_types: [] });
    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText(/Associated Letter Types/i)).toBeInTheDocument();

    // Check the Selected Letter Types
    const selected = screen.getByTestId('typeaheadSelectedContainer_letterType');
    expect(selected).toHaveTextContent(letterType1.name);
    expect(selected).not.toHaveTextContent(letterType2.name);

    await userInstance.click(screen.getByTestId(`removeButtonFor${letterType1.id}`));

    expect(selected).not.toHaveTextContent(letterType1.name);

    // Click Save
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // Verify success
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
    setMockData(mockData);
  });

  it('updates signature', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const signatoryId = mockData.organization_signatures[0].id;
    setMockUpdateSignatureResponse(createSignatureResponse);

    expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
    const signatoryEdit = await screen.findByTestId(`signature-edit-${signatoryId}`);
    await userInstance.click(signatoryEdit.shadowRoot.querySelector('.dr-btn'));

    const signatoryName = screen.getByLabelText("Signatory's Name");
    await userInstance.type(signatoryName, createSignatureResponse.signatory_name);

    const { shadowRoot } = screen.getByTestId('saveSignatoryButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText(/Hamilton/i)).toBeInTheDocument();

    // Verify mock call
    expect(mockAxios.history.put.length).toEqual(1);
    const updateUrl = mockAxios.history.put[0].url;
    const formData = mockAxios.history.put[0].data;
    expect(updateUrl).toEqual(expect.stringContaining(mockData.id));
    expect(updateUrl).toEqual(expect.stringContaining(mockData.organization_signatures[0].id));
    expect(formData.has('signatory_name')).toBe(true);
  });

  it('cancels signature', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const signatoryId = mockData.organization_signatures[0].id;

    setMockUpdateSignatureResponse(createSignatureResponse);

    expect(await screen.findByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();

    const signEdit = await screen.findByTestId(`signature-edit-${signatoryId}`);
    await userInstance.click(signEdit.shadowRoot.querySelector('.dr-btn'));

    const signatoryName = screen.getByLabelText("Signatory's Name");
    await userInstance.type(signatoryName, createSignatureResponse.signatory_name);

    const { shadowRoot } = screen.getByTestId('cancelSignatoryModalButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // Verify update has not been called
    expect(mockAxios.history.put.length).toEqual(0);

    await waitFor(() => expect(screen.queryByTestId('signatoryModalHeader')).toBeNull());
  });
});

describe('Inactive Signature', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData(inactiveSignatureMock);
    mockSuccessfulHeadersCall();
    mockLetterTypesApiCall();

    renderComponent();
  });

  it('cannot be made default', async () => {
    await waitForLoadingToFinish();
    await waitFor(() => {
      expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
      expect(screen.queryByText('Make Default')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const druidAlerts = Array.from(document.querySelectorAll('dr-alert'));
      const foundAlert = druidAlerts.find((alert) => alert?.shadowRoot?.innerHTML.match(/Default signatory missing/i));
      expect(foundAlert.alert).toEqual('Default signatory missing. Organization signatures will not be populated by default');
    });
  });
});

describe('Inactive Address', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData(inactiveAddressMock);
    mockSuccessfulHeadersCall();
    mockLetterTypesApiCall();
    renderComponent();
  });

  it('cannot be made default', async () => {
    await waitForLoadingToFinish();
    await waitFor(() => {
      expect(screen.getByTestId('header', { name: /Edit Organization/i })).toBeInTheDocument();
      expect(screen.queryByText('Make Default')).not.toBeInTheDocument();
      const druidAlerts = Array.from(document.querySelectorAll('dr-alert'));
      const foundAlert = druidAlerts.find((alert) => alert?.shadowRoot?.innerHTML.match(/Default address missing/i));
      expect(foundAlert.alert).toEqual('Default address missing. Organization address variables will not be populated by default.');
    });
  });
});
