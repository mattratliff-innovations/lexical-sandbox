import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import ListUsers from './ListUsers';
import { queryDruidAccessibleTableByLabel, getDruidAccessibleTableColumnValues } from '../../../../testSetup/DruidTableHelper';
import { getRoleNameFromPermission } from '../../../oidc/Authentication';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));
jest.mock('../../../oidc/Authentication');

const mockUsersCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/users`);

const mockUserData = [
  {
    id: '27349156-57c9-4dde-8e1a-802b65135067',
    first_name: 'Echo',
    middle_initial: null,
    last_name: 'User',
    email: 'echo.user@fake.uscis.dhs.gov',
    piv_upn: '3970609828@fake.uscis.dhs.gov',
    role_name: 'PLACEHOLDER',
    created_at: '2024-02-12T20:39:43.667Z',
    updated_at: '2024-02-12T20:39:43.667Z',
    organizations: [
      {
        id: 'e3a26635-8a5c-4dac-ac48-6ad4b987a1bc',
        name: 'California Service Center',
        active: true,
        created_at: '2024-02-12T20:39:42.162Z',
        updated_at: '2024-02-12T20:39:42.162Z',
      },
      {
        id: '9f93fc51-09a2-4475-93ec-4b40f0117608',
        name: 'Nebraska Service Center',
        active: true,
        created_at: '2024-02-12T20:39:42.191Z',
        updated_at: '2024-12-14T20:39:42.191Z',
      },
    ],
  },
  {
    id: '27349156-57c9-4dde-8e1a-802b65135068',
    first_name: 'Mac',
    middle_initial: 'Middle',
    last_name: 'Apple',
    email: 'first.last@fake.uscis.dhs.gov',
    piv_upn: '4970609828@fake.uscis.dhs.gov',
    role_name: 'PLACEHOLDER',
    created_at: '2024-02-12T20:39:43.667Z',
    updated_at: '2024-01-14T20:39:43.667Z',
    organizations: [],
  },
  {
    id: '27349156-57c9-4dde-8e1a-802b65135068',
    first_name: 'Yoyo',
    middle_initial: 'Michael',
    last_name: 'Mama',
    email: 'first.last@fake.uscis.dhs.gov',
    piv_upn: '4970609828@fake.uscis.dhs.gov',
    role_name: 'PLACEHOLDER',
    created_at: '2024-02-12T20:39:43.667Z',
    updated_at: '2024-11-14T20:39:43.667Z',
    organizations: [],
  },
];

const renderComponent = async () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListUsers />
      </BrowserRouter>
      ,
    </>
  );
};

describe('ListUsers', () => {
  it('displays the users and navigates to the edit page', async () => {
    getRoleNameFromPermission.mockImplementation(() => 'SOME_ROLE_NAME');
    mockUsersCall().reply(200, mockUserData);

    await waitFor(() => renderComponent());
    await waitForLoadingToFinish();

    const expectedValues = [
      `${mockUserData[0].last_name}, ${mockUserData[0].first_name}`,
      mockUserData[0].email,
      'SOME_ROLE_NAME',
      mockUserData[0].organizations.map((org) => org.name).join(', '),
    ];
    const { shadowRoot: tableShadowRoot } = screen.getByTestId('users-table');
    const allSlots = Array.from(tableShadowRoot.querySelectorAll('slot'));
    expectedValues.forEach((tableValue) => {
      expect(allSlots.find((el) => el.textContent === tableValue)).toBeInTheDocument();
    });
    const rowWithMiddleName = `${mockUserData[1].last_name}, ${mockUserData[1].first_name} ${mockUserData[1].middle_initial.substring(0, 1)}`;
    expect(allSlots.find((el) => el.textContent === rowWithMiddleName)).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId(`edit-${mockUserData[0].id}`);
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(`/admin/users/${mockUserData[0].id}`);
    });
    expect(getRoleNameFromPermission.mock.calls[0][0]).toBe(mockUserData[0].role_name);
  });

  it('displays an error message if the get users call fails', async () => {
    mockUsersCall().timeout();

    await renderComponent();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('There was an error retrieving the User list');
  });

  it('shows a no data found message when there are no results', async () => {
    mockUsersCall().reply(200, []);

    await renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('adminListCreateButtonDiv', { name: 'No data found.' })).toBeInTheDocument();
  });
});

describe('ListFormTypes Druid Table', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockUsersCall().reply(200, mockUserData);
    renderComponent();
  });

  it('displays name orders correctly', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();

    // Sort default data array to start
    const sortedNameDefault = mockUserData
      .map((item) => {
        const middleInitial = item.middle_initial ? ` ${item.middle_initial.substring(0, 1)}` : '';
        return `${item.last_name}, ${item.first_name}${middleInitial}`;
      })
      .sort((a, b) => a.localeCompare(b));
    const { accessibleTable, sortButton } = queryDruidAccessibleTableByLabel('Name'); // provide the header label

    // Default Sort
    await waitFor(() => {
      const updatedNameDefaultOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
      expect(updatedNameDefaultOrder).toEqual(sortedNameDefault);
    });

    // First Click: Reverse the Default
    await userInstance.click(sortButton);
    await waitFor(() => {
      const updatedNameReverseOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
      expect(updatedNameReverseOrder).toEqual(sortedNameDefault.reverse());
    });

    // Second Click: Back to Original
    await userInstance.click(sortButton);
    await waitFor(() => {
      const updatedNameOriginalOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
      expect(updatedNameOriginalOrder).toEqual(sortedNameDefault.reverse());
    });
  });
});
