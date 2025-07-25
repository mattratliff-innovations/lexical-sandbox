import * as React from 'react';
import { render, waitFor, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import CreateOrganization from './CreateOrganization';
import ListOrganizations from './ListOrganizations';
import OrganizationWrapper from './OrganizationWrapper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const mockCreateApiCall = (returnData) => mockAxios.onPost(`${APP_API_ENDPOINT}/organizations/`).reply(200, returnData);
const mockCreateApiCallError = (returnData) => mockAxios.onPost(`${APP_API_ENDPOINT}/organizations/`).reply(422, returnData);
const HEADER_ID = '045f45c0-4c5a-4a1f-b688-6beec7abbe57';
const HEADER_NAME = 'Header1';

const headersData = [
  {
    id: HEADER_ID,
    name: HEADER_NAME,
    active: true,
    created_at: '2024-02-16T20:54:43.298Z',
    updated_at: '2024-02-16T20:54:43.298Z',
    row1_col1: '<p>[[[LETTER_DATE]]]</p>',
    row1_col2: '<p>[[[CIS_ADDRESS]]]</p>',
    row2_col1: '<p>[[[RECIPIENT_ADDRESS]]]</p>',
    row2_col2: '<p>[[[DHS_SEAL]]]</p>',
    row3_col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
    row3_col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p>',
  },
];

const mockHeadersCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/headers/available_headers_for_organization`);
const mockLetterTypesCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`);

const mockSuccessfulHeadersCall = () => mockHeadersCall().reply(200, headersData);
const mockSuccessfulLetterTypesCall = () => mockLetterTypesCall().reply(200, []);

const mockErrorHeadersCall = () => mockHeadersCall().timeout();

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

const renderComponent = async () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/organizations" element={<OrganizationWrapper />}>
        <Route index element={<ListOrganizations />} />
        <Route path="create" element={<CreateOrganization />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/organizations/create'],
    initialIndex: [1],
  });
  render(<RouterProvider router={router} />);
};

describe('CreateOrganization', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('with successful API and data calls', () => {
    beforeEach(() => {
      mockSuccessfulHeadersCall();
      mockSuccessfulLetterTypesCall();
      mockCreateApiCall({ id: 'testOrgId' });
    });

    it('displays organization and does not show an add signatory button', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const submitButton = screen.queryByText('Add Signatory');
      expect(submitButton).toBeNull();
      expect(screen.getByTestId('header', { name: /Create Organization/i })).toBeInTheDocument();
    });

    it('displays a successful message with a default checked active checkbox', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const serviceCenter = 'Virginia Service Center';

      const comboBoxContainer = await screen.findByTestId('headers');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header1');
      await userInstance.click(screen.getByText('Header1'));

      const activeCheckBox = screen.getByLabelText('Organization is Active');
      expect(activeCheckBox.checked).toEqual(true);
      await userInstance.type(screen.getByLabelText('Organization Name'), serviceCenter);
      await userInstance.type(screen.getByLabelText('Organization Code'), 'BQR');

      const saveBtn = screen.getByTestId('saveButton');
      await waitFor(() => expect(saveBtn.shadowRoot.querySelector('.dr-btn').disabled).toBe(false));

      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => {
        const modalHeader = screen.getByTestId('addToOrgModalHeader');
        expect(modalHeader).toHaveTextContent(/Confirmation Required/i);

        const modalBody = screen.getByTestId('addToOrgModalBody');
        expect(modalBody).toHaveTextContent(/Would you like to add an address and/i);
      });

      const { shadowRoot } = screen.getByTestId('noButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('addToOrgModalBody')).toBeNull());
      expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations');
      const updatedData = JSON.parse(mockAxios.history.post[0].data);
      const orgJson = updatedData.organization;
      expect(orgJson.name).toBe(serviceCenter);
      expect(orgJson.active).toBe(true);
      expect(orgJson.header_ids).toHaveLength(1);
      expect(orgJson.header_ids[0]).toBe(HEADER_ID);
    });

    it('displays a successful message and confirmation modal to add address', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const comboBoxContainer = await screen.findByTestId('headers');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header1');
      await userInstance.click(screen.getByText('Header1'));

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Test Org');
      await userInstance.type(screen.getByLabelText('Organization Code'), 'XOL');

      const saveBtn = screen.getByTestId('saveButton');
      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));

      const modalHeader = screen.getByTestId('addToOrgModalHeader');

      await waitFor(() => expect(modalHeader).toHaveTextContent(/Confirmation Required/i));

      const { shadowRoot } = screen.getByTestId('yesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByTestId('addToOrgModalBody')).toBeNull());
      expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations/testOrgId');
    });

    it('displays a successful message and closes modal', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const comboBoxContainer = await screen.findByTestId('headers');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header1');
      await userInstance.click(screen.getByText('Header1'));

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Test Org 2');
      await userInstance.type(screen.getByLabelText('Organization Code'), 'ZQU');

      const saveBtn = screen.getByTestId('saveButton');
      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => {
        const modalHeader = screen.getByTestId('addToOrgModalHeader');
        expect(modalHeader).toHaveTextContent(/Confirmation Required/i);
      });

      await userInstance.click(screen.getByTestId('closeButtonModal'));

      await waitFor(() => expect(screen.queryByTestId('addToOrgModalBody')).toBeNull());
      expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations');
    });

    // this test covers both edit/create form
    it('Form properly checks for blank fields on submission', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const saveBtn = screen.getByTestId('saveButton');

      const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
      let druidAlert;

      await waitFor(() => {
        druidAlert = shadowRoot.querySelector('.dr-root-container');
        expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
      });

      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i));

      const comboBoxContainer = await screen.findByTestId('headers');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header1');
      await userInstance.click(screen.getByText('Header1'));

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Test Org');
      await userInstance.type(screen.getByLabelText('Organization Code'), 'TWA');
      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i));
    });

    it('redirects on cancel', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = screen.getByTestId('cancelButton');
      await waitFor(() => expect(userInstance.click(shadowRoot.querySelector('.dr-btn'))).toBeDefined());
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/organizations');
    });

    it('Successfully submits with Save Organization button under Quick Actions', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      const comboBoxContainer = await screen.findByTestId('headers');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Header1');
      await userInstance.click(screen.getByText('Header1'));

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Org From Quick Actions Sumittal');
      await userInstance.type(screen.getByLabelText('Organization Code'), 'WZQ');

      const saveBtn = screen.getByTestId('saveButton');
      await userInstance.click(saveBtn.shadowRoot.querySelector('.dr-btn'));

      const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
      const druidAlert = shadowRoot.querySelector('.dr-root-container');

      await waitFor(() => expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i));
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockSuccessfulHeadersCall();
      mockSuccessfulLetterTypesCall();
      mockCreateApiCall({ id: 'testOrgId' });
    });

    const invalidNameMsg = 'alphanumeric characters only';
    const invalidDaysForwardMsg = 'A number from 0-30 is required.';

    it('displays error message for invalid name', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Org Name !@#%');

      const { shadowRoot } = screen.getByTestId('saveButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByText(invalidNameMsg)).toBeInTheDocument());
    });

    it('displays no error message for valid name', async () => {
      const userInstance = userEvent.setup();

      renderComponent();
      await waitForLoadingToFinish();
      await userInstance.type(screen.getByLabelText('Organization Name'), 'Org_Name-123');

      await waitFor(() => expect(screen.queryByText(invalidNameMsg)).not.toBeInTheDocument());
    });

    it('displays error message for invalid header mapping name', async () => {
      const userInstance = userEvent.setup();

      renderComponent();
      await waitForLoadingToFinish();
      await waitFor(() => expect(screen.findByTestId('headers')).toBeDefined());

      const { shadowRoot } = screen.getByTestId('saveButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(screen.queryByText('Associated Header is required!')).toBeInTheDocument();
    });

    it('displays no error if valid Letter Business Days Forward', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.paste(await screen.findByLabelText('Letter Business Days Forward'), '3');

      await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).not.toBeInTheDocument());
    });

    it('displays error if Letter Business Days Forward > 30', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.type(screen.getByLabelText('Letter Business Days Forward'), '31');

      const { shadowRoot } = screen.getByTestId('saveButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).toBeInTheDocument());
    });

    it('displays error if Letter Business Days Forward not a true number', async () => {
      const userInstance = userEvent.setup();
      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.type(screen.getByLabelText('Letter Business Days Forward'), '03');

      const { shadowRoot } = screen.getByTestId('saveButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(screen.queryByText(invalidDaysForwardMsg)).toBeInTheDocument());
    });
  });

  describe('http error cases', () => {
    it('displays a post error duplicate message', async () => {
      const userInstance = userEvent.setup();
      mockSuccessfulHeadersCall();
      mockSuccessfulLetterTypesCall();
      const returnData = {
        error: 'Unable to create Organization: Name has already been taken',
      };
      mockCreateApiCallError(returnData);
      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.type(screen.getByLabelText('Organization Name'), 'Any Name');

      const { shadowRoot } = screen.getByTestId('saveButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      waitFor(() => expect(screen.getByText(returnData.error)).toBeInTheDocument());
    });

    it('displays an error if there is a failure getting headers', async () => {
      mockErrorHeadersCall();
      mockSuccessfulLetterTypesCall();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('Encountered an unknown error retrieving headers.')).toBeInTheDocument();
    });
  });
});
