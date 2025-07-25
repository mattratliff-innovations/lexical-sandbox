import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, within, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import EditUser from './EditUser';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import UserWrapper from './UserWrapper';
import ListUsers from './ListUsers';
import { AppContext } from '../../../AppProvider';
import { getRoleNameFromPermission } from '../../../oidc/Authentication';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockUserData = {
  id: '27349156-57c9-4dde-8e1a-802b65135067',
  first_name: 'Echo',
  middle_initial: 'Middle',
  last_name: 'User',
  email: 'echo.user@fake.uscis.dhs.gov',
  piv_upn: '3970609828@fake.uscis.dhs.gov',
  role_name: 'PLACEHOLDER',
  created_at: '2024-02-12T20:39:43.667Z',
  updated_at: '2024-02-12T20:39:43.667Z',
};

const NEXT_ORGANIZATION_NAME = 'Nebraska Service Center';
const NEXT_ORGANIZATION_ID = '13328d58-9a56-4814-976c-b2bf4110fa38';
const PREVIOUS_ORGANIZATION_NAME = 'Potomac Service Center';
const PREVIOUS_ORGANIZATION_ID = 'f5433174-0ae4-4a22-a229-c5528f9841bc';

const mockAvailableOrganizations = [
  {
    id: PREVIOUS_ORGANIZATION_ID,
    name: PREVIOUS_ORGANIZATION_NAME,
    active: true,
    created_at: '2024-02-12T20:39:42.162Z',
    updated_at: '2024-02-12T20:39:42.162Z',
    default: true,
    user_organization_xrefs: [
      {
        default: true,
        id: '27349156-57c9-4dde-8e1a-802b65135067',
        organization_id: PREVIOUS_ORGANIZATION_ID,
        user_id: mockUserData.id,
        created_at: '2024-02-12T20:39:43.670Z',
        updated_at: '2024-02-12T20:39:43.670Z',
      },
    ],
  },
  {
    id: NEXT_ORGANIZATION_ID,
    name: NEXT_ORGANIZATION_NAME,
    active: true,
    created_at: '2024-02-12T20:39:42.196Z',
    updated_at: '2024-02-12T20:39:42.196Z',
    default: false,
    user_organization_xrefs: [],
  },
];

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: mockUserData.id }),
  useNavigate: () => mockedUseNavigate,
}));
jest.mock('../../../oidc/Authentication');

const mockUsersCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/users/${mockUserData.id}`);
const mockAvailableOrganizationsCall = () =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/available_organizations_for_user`, { params: { user_id: mockUserData.id } });

const successfulMockUsersCall = () => mockUsersCall().reply(200, mockUserData);
const successfulMockAvailableOrganizationsCall = () => mockAvailableOrganizationsCall().reply(200, mockAvailableOrganizations);

const saveUserCall = () => mockAxios.onPut(`${APP_API_ENDPOINT}/users/set_user_organization_mapping/${mockUserData.id}`);
const setUserOrgsListEdit = () => false;

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/users" element={<UserWrapper />}>
        <Route index element={<ListUsers />} />
        <Route path="/admin/users/:id" element={<EditUser />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/users/:id'],
    initialIndex: 1,
  });

  render(
    <AppContext.Provider value={{ setUserOrgsListEdit }}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
};

describe('EditUser', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('shows an error message when the get user call fails', async () => {
    mockUsersCall().timeout();
    successfulMockAvailableOrganizationsCall();

    renderComponent();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('There was an error retrieving the User data');
  });

  it('shows an error message when the get organizations call fails', async () => {
    successfulMockUsersCall();
    mockAvailableOrganizationsCall().timeout();

    renderComponent();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('There was an error retrieving Organization data');
  });

  describe('without any get network errors', () => {
    it('shows the user info', async () => {
      getRoleNameFromPermission.mockImplementation(() => 'SOME_ROLE_NAME');
      successfulMockAvailableOrganizationsCall();
      successfulMockUsersCall();
      renderComponent();

      const fullName = `${mockUserData.first_name} ${mockUserData.middle_initial} ${mockUserData.last_name}`;

      await waitFor(() => {
        expect(screen.getByText(new RegExp(fullName, 'i'))).toBeInTheDocument();
        expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
        expect(getRoleNameFromPermission.mock.calls.find((call) => call[0] === mockUserData.role_name)).not.toBeNull();
      });
    });

    it('shows an error message if the update user fails', async () => {
      successfulMockAvailableOrganizationsCall();
      successfulMockUsersCall();
      saveUserCall().timeout();

      renderComponent();

      const fullName = `${mockUserData.first_name} ${mockUserData.middle_initial} ${mockUserData.last_name}`;
      expect(await screen.findByText(new RegExp(fullName, 'i'))).toBeInTheDocument();
      const { shadowRoot } = screen.getByTestId('saveUserButton');
      await userEvent.click(shadowRoot.querySelector('.dr-btn'));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('There was an error saving user data.');
    });

    it('allows the user to assign organizations to a user', async () => {
      const userInstance = userEvent.setup();

      successfulMockAvailableOrganizationsCall();
      successfulMockUsersCall();
      saveUserCall().reply(200, mockUserData);
      renderComponent();

      const comboBoxContainer = await screen.findByTestId('organizations');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), 'Nebraska Service Center');
      await userInstance.click(screen.getByText('Nebraska Service Center'));

      await userInstance.click(await screen.findByTestId(`removeButtonFor${PREVIOUS_ORGANIZATION_ID}`));

      const { shadowRoot } = screen.getByTestId('saveUserButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Updated the user successfully!');
      const updatedData = JSON.parse(mockAxios.history.put[0].data);
      const updatedAttributes = updatedData.user.user_organization_xrefs_attributes;
      expect(updatedAttributes.length).toEqual(1);
      const updatedAttribute = updatedAttributes[0];
      expect(updatedAttribute.user_id).toEqual(mockUserData.id);
      expect(updatedAttribute.organization_id).toEqual(NEXT_ORGANIZATION_ID);
      expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/users');
    });

    it('preserves the currently selected default org', async () => {
      const userInstance = userEvent.setup();

      successfulMockAvailableOrganizationsCall();
      successfulMockUsersCall();
      saveUserCall().reply(200, mockUserData);
      renderComponent();

      const comboBoxContainer = await screen.findByTestId('organizations');
      await userInstance.type(within(comboBoxContainer).getByRole('combobox'), PREVIOUS_ORGANIZATION_NAME);
      await userInstance.click(screen.getByText(PREVIOUS_ORGANIZATION_NAME));

      const { shadowRoot } = screen.getByTestId('saveUserButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Updated the user successfully!');
      const targetPut = mockAxios.history.put.find((putRequest) => {
        const parsedData = JSON.parse(putRequest.data);
        return parsedData.user.user_organization_xrefs_attributes.length > 0;
      });
      const parsedData = JSON.parse(targetPut.data);
      expect(parsedData.user.user_organization_xrefs_attributes[0].default).toBe(true);
    });
  });
});
