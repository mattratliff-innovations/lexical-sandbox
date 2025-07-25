import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ListFormTypes from './ListFormTypes';
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
        <ListFormTypes />
      </BrowserRouter>
    </>
  );
};

const mockData = [
  {
    id: '1e09ca5e-f10e-489a-9158-082d34004868',
    name: 'form-type-name-1',
    createdAt: '2024-12-23T14:16:19.020Z',
    updatedAt: '2024-12-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '2e09ca5e-f10e-489a-9158-082d34004868',
    name: 'form-type-name-2',
    createdAt: '2024-01-23T14:16:19.020Z',
    updatedAt: '2024-01-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '3e09ca5e-f10e-489a-9158-082d34004868',
    name: 'form-type-name-3',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-06-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '4e09ca5e-f10e-489a-9158-082d34004868',
    name: 'form-type-name-4',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-11-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '5e09ca5e-f10e-489a-9158-082d34004868',
    name: 'form-type-name-5',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-11-21T14:16:19.020Z',
    active: true,
  },
];

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, mockData);
  await renderComponent();
  await waitForLoadingToFinish();
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).timeout();

  await renderComponent();
  await waitForLoadingToFinish();
};

describe('ListFormTypes', () => {
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

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();

    const expected = 'There was an error retrieving the Form Types list';
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(expected);
  });

  it('shows a message when there are no records', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, []);
    await renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('adminListCreateButtonDiv', { name: 'No data found.' })).toBeInTheDocument();
  });
});

describe('ListFormTypes Druid Table', () => {
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
    const updatedNameReverseOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
    await waitFor(() => {
      expect(updatedNameReverseOrder).toEqual(sortedNameDefault.reverse());
    });

    // Second Click: Back to Original
    await userInstance.click(sortButton);
    const updatedNameOriginalOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
    await waitFor(() => {
      expect(updatedNameOriginalOrder).toEqual(sortedNameDefault.reverse());
    });
  });
});

describe('Edit Form Type', () => {
  it('Navigates to the edit page', async () => {
    await waitFor(() => setMockDataAndRenderComponent(mockData));

    const { shadowRoot } = screen.getByTestId(`edit-${mockData[0].id}`);
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockedUseNavigate).toHaveBeenCalledWith(`/admin/formtypes/${mockData[0].id}`);
  });
});
