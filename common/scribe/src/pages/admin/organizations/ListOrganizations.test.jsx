import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ListOrganizations from './ListOrganizations';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { queryDruidAccessibleTableByLabel, getDruidAccessibleTableColumnValues } from '../../../../testSetup/DruidTableHelper';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

// Mock navigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

const renderComponent = async () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListOrganizations />
      </BrowserRouter>
    </>
  );
};

const mockData = [
  {
    id: '6e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Texas Service Center',
    active: true,
    createdAt: '2024-01-22T13:20:48.062Z',
    updatedAt: '2024-06-22T13:20:48.062Z',
  },
  {
    id: '2e09ca5e-f10e-489a-9158-082d34004222',
    name: 'California Service Center',
    active: false,
    createdAt: '2024-01-22T13:20:48.062Z',
    updatedAt: '2024-12-22T13:20:48.062Z',
  },
  {
    id: '3e09ca5e-f10e-489a-9158-082d34004222',
    name: 'Vermont Service Center',
    active: true,
    createdAt: '2024-01-22T13:20:48.062Z',
    updatedAt: '2024-01-22T13:20:48.062Z',
  },
  {
    id: '4e09ca5e-f10e-489a-9158-082d34004222',
    name: 'Nebraska Service Center',
    active: true,
    createdAt: '2024-01-22T13:20:48.062Z',
    updatedAt: '2024-11-22T13:20:48.062Z',
  },
  {
    id: '5e09ca5e-f10e-489a-9158-082d34004222',
    name: 'Potomac Service Center',
    active: true,
    createdAt: '2024-01-22T13:20:48.062Z',
    updatedAt: '2024-11-21T13:20:48.062Z',
  },
];

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations`).reply(200, mockData);
  await renderComponent();
  await waitForLoadingToFinish();
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations`).timeout();
  await renderComponent();
  await waitForLoadingToFinish();
};

describe('ListOrganizations', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays last modified date orders correctly', async () => {
    await setMockDataAndRenderComponent();

    // Sort default data array to start
    const sortedDatesDefault = mockData.map((item) => new Date(item.updatedAt)).sort((a, b) => b - a);

    const { accessibleTable, sortButton } = queryDruidAccessibleTableByLabel('Last Modified'); // provide the header label

    // Click to sort ascending
    await userEvent.click(sortButton);
    let updatedDates = getDruidAccessibleTableColumnValues(accessibleTable, 2).map((dateStr) => new Date(dateStr));
    expect(updatedDates).toEqual(sortedDatesDefault);

    // Click to sort descending
    await userEvent.click(sortButton);
    updatedDates = getDruidAccessibleTableColumnValues(accessibleTable, 2).map((dateStr) => new Date(dateStr));
    expect(updatedDates).toEqual(sortedDatesDefault.reverse());
  });

  it('displays correct toast message on error', async () => {
    await setErrorMockAndRenderComponent();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('There was an error retrieving the Organizations list');
  });

  it('shows a message when there are no records', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/organizations`).reply(200, []);
    await renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('adminListCreateButtonDiv', { name: 'No data found.' })).toBeInTheDocument();
  });

  it('Navigates to the edit page', async () => {
    await waitFor(() => {
      setMockDataAndRenderComponent();
    });

    const { shadowRoot } = screen.getByTestId(`edit-${mockData[1].id}`);
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockedUseNavigate).toHaveBeenCalledWith(`/admin/organizations/${mockData[1].id}`);
  });
});

describe('Organizations Druid Table', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays name orders correctly', async () => {
    const userInstance = userEvent.setup();
    await setMockDataAndRenderComponent();

    // Sort default data array to start
    const sortedNameDefault = mockData.map((item) => item.name).sort((a, b) => a.localeCompare(b));
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
