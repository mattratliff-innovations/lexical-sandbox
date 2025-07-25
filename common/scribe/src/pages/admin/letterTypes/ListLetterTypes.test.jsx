import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ListLetterTypes from './ListLetterTypes';
import './LetterTypes.css';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { queryDruidAccessibleTableByLabel, getDruidAccessibleTableColumnValues } from '../../../../testSetup/DruidTableHelper';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const renderComponent = async () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListLetterTypes />
      </BrowserRouter>
      ,
    </>
  );
};

const mockData = [
  {
    id: '185ecce5-15dd-48bd-bf70-4adf6906ae88',
    name: 'Letter Type 1',
    active: true,
    createdAt: '2024-01-23T14:16:39.757Z',
    updatedAt: '2024-06-23T14:16:39.757Z',
  },
  {
    id: '285ecce5-15dd-48bd-bf70-4adf6906ae88',
    name: 'Letter Type 2',
    active: true,
    createdAt: '2024-01-23T14:16:39.757Z',
    updatedAt: '2024-12-23T14:16:39.757Z',
  },
  {
    id: '385ecce5-15dd-48bd-bf70-4adf6906ae88',
    name: 'Letter Type 3',
    active: false,
    createdAt: '2024-01-23T14:16:39.757Z',
    updatedAt: '2024-01-23T14:16:39.757Z',
  },
  {
    id: '485ecce5-15dd-48bd-bf70-4adf6906ae88',
    name: 'Letter Type 4',
    active: false,
    createdAt: '2024-01-23T14:16:39.757Z',
    updatedAt: '2024-11-23T14:16:39.757Z',
  },
  {
    id: '585ecce5-15dd-48bd-bf70-4adf6906ae88',
    name: 'Letter Type 5',
    active: false,
    createdAt: '2024-01-23T14:16:39.757Z',
    updatedAt: '2024-11-21T14:16:39.757Z',
  },
];

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`).reply(200, mockData);
  await renderComponent();
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`).timeout();

  await renderComponent();
};

describe('ListLetterTypes', () => {
  beforeEach(() => {
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

    const expected = 'There was an error retrieving the Letter Types list';
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(expected);
  });

  it('shows a message when there are no records', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`).reply(200, []);
    await renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('adminListCreateButtonDiv', { name: 'No data found.' })).toBeInTheDocument();
  });
});

describe('ListLetterTypes Druid Table', () => {
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
