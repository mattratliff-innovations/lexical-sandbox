import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ListClassPreferences from './ListClassPreferences';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import { queryDruidAccessibleTableByLabel, getDruidAccessibleTableColumnValues } from '../../../../testSetup/DruidTableHelper';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const LAST_MODIFIED_COLUMN_NUMBER = 3;

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
        <ListClassPreferences />
      </BrowserRouter>
    </>
  );
};

const mockData = [
  {
    id: '1e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Class Preference A',
    code: 'CPA',
    createdAt: '2024-12-23T14:16:19.020Z',
    updatedAt: '2024-12-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '2e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Class Preference B',
    code: 'CPB',
    createdAt: '2024-01-23T14:16:19.020Z',
    updatedAt: '2024-01-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '3e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Class Preference C',
    code: 'CPC',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-06-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '4e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Class Preference D',
    code: 'CPD',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-11-23T14:16:19.020Z',
    active: true,
  },
  {
    id: '5e09ca5e-f10e-489a-9158-082d34004868',
    name: 'Class Preference E',
    code: 'CPE',
    createdAt: '2024-06-23T14:16:19.020Z',
    updatedAt: '2024-11-21T14:16:19.020Z',
    active: true,
  },
];

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences`).reply(200, mockData);
  await renderComponent();
  await waitForLoadingToFinish();
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences`).timeout();

  await renderComponent();
  await waitForLoadingToFinish();
};

describe('ListClassPreferences', () => {
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
    let updatedDates = getDruidAccessibleTableColumnValues(accessibleTable, LAST_MODIFIED_COLUMN_NUMBER).map((dateStr) => new Date(dateStr));
    expect(updatedDates).toEqual(sortedDatesDefault);

    // Click to sort descending
    await userEvent.click(sortButton);
    updatedDates = getDruidAccessibleTableColumnValues(accessibleTable, LAST_MODIFIED_COLUMN_NUMBER).map((dateStr) => new Date(dateStr));
    expect(updatedDates).toEqual(sortedDatesDefault.reverse());
  });

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();

    const expected = 'There was an error retrieving the Class Preferences list';
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(expected);
  });

  it('shows a message when there are no records', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences`).reply(200, []);
    await renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('adminListCreateButtonDiv', { code: 'No data found.' })).toBeInTheDocument();
  });
});

describe('ListClassPreferences Druid Table', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays code orders correctly', async () => {
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
      const defaultCopy = [...sortedNameDefault];
      expect(updatedNameReverseOrder).toEqual(defaultCopy.reverse());
    });

    // Second Click: Back to Original
    await userInstance.click(sortButton);
    const updatedNameOriginalOrder = getDruidAccessibleTableColumnValues(accessibleTable, 1);
    await waitFor(() => {
      expect(updatedNameOriginalOrder).toEqual(sortedNameDefault);
    });
  });
});

// describe('Edit Class Preferences', () => {
//   it('Navigates to the edit page', async () => {
//     await waitFor(() => setMockDataAndRenderComponent(mockData));

//     const { shadowRoot } = screen.getByTestId(`edit-${mockData[0].id}`);
//     await userEvent.click(shadowRoot.querySelector('.dr-btn'));

//     expect(mockedUseNavigate).toHaveBeenCalledWith(
//       `/admin/classpreferences/${mockData[0].id}`
//     );
//   });

//   it('Name column links to the edit page', async () => {
//     await waitFor(() => setMockDataAndRenderComponent(mockData));

//     expect(
//       screen.getByRole('link', { name: mockData[0].name })
//     ).toHaveAttribute('href', `/admin/classpreferences/${mockData[0].id}`);
//   });
// });
