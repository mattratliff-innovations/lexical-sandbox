import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ListHeaders from './ListHeaders';
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

const mockData = [
  {
    id: '1e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Header 1.0',
    content: 'This is header content 1.0',
    deleted: false,
    createdAt: '2024-01-14T13:20:48.062Z',
    updatedAt: '2024-06-14T13:20:48.062Z',
  },
  {
    id: '2e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Header 2.0',
    content: 'This is header content 2.0',
    deleted: false,
    createdAt: '2024-01-14T13:20:48.062Z',
    updatedAt: '2024-12-14T13:20:48.062Z',
  },
  {
    id: '3e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Header 3.0',
    content: 'This is header content 3.0',
    deleted: true,
    createdAt: '2024-01-14T13:20:48.062Z',
    updatedAt: '2024-01-14T13:20:48.062Z',
  },
  {
    id: '4e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Header 4.0',
    content: 'This is header content 4.0',
    deleted: true,
    createdAt: '2024-01-14T13:20:48.062Z',
    updatedAt: '2024-11-14T13:20:48.062Z',
  },
  {
    id: '5e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Header 5.0',
    content: 'This is header content 5.0',
    deleted: true,
    createdAt: '2024-01-14T13:20:48.062Z',
    updatedAt: '2024-11-13T13:20:48.062Z',
  },
];

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/headers`).reply(200, mockData);
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListHeaders />
      </BrowserRouter>
      ,
    </>
  );
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/headers`).timeout();
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListHeaders />
      </BrowserRouter>
      ,
    </>
  );
};

describe('ListHeaders', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays last modified date orders correctly', async () => {
    await setMockDataAndRenderComponent(mockData);
    await waitForLoadingToFinish();

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
    await waitForLoadingToFinish();

    const expected = 'There was an error retrieving the Headers list';
    expect(screen.queryByText(expected));
  });

  it('shows a message when there are no records', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/headers`).reply(200, []);
    render(
      <>
        <ToastContainer />
        <BrowserRouter>
          <ListHeaders />
        </BrowserRouter>
        ,
      </>
    );

    await waitForLoadingToFinish();
    expect(screen.getByTestId('adminListCreateButtonDiv', { name: 'No data found.' })).toBeInTheDocument();
  });
});

describe('ListHeaders Druid Table', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays name orders correctly', async () => {
    const userInstance = userEvent.setup();
    await setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

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

describe('Edit Header', () => {
  it('Navigates to the edit page', async () => {
    await waitFor(() => setMockDataAndRenderComponent(mockData));
    await waitForLoadingToFinish();

    const { shadowRoot } = screen.getByTestId(`edit-${mockData[0].id}`);
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockedUseNavigate).toHaveBeenCalledWith(`/admin/headers/${mockData[0].id}`);
  });
});
