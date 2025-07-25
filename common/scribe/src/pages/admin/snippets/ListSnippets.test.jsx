import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ListSnippets from './ListSnippets';
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

const renderComponent = () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <ListSnippets />
      </BrowserRouter>
    </>
  );
};

const mockData = [
  {
    id: '82768d94-61a2-45dc-9862-adbb0c14f23b',
    name: 'SNIPPET GROUP XYZ',
    createdAt: '2024-12-23T14:16:19.020Z',
    updatedAt: '2024-12-23T14:16:19.020Z',
    active: true,
    snippets: [
      {
        active: true,
        content: '<p>Snippet content A</p>',
        id: '73426029-25fb-47ea-951f-00871f32d9b8',
        name: 'Snippet A',
        snippet_group_id: '82768d94-61a2-45dc-9862-adbb0c14f23b',
      },
      {
        active: false,
        content: '<p>Snippet content B</p>',
        id: '55426029-25fb-47ea-951f-00871f32d9b8',
        name: 'Snippet B',
        snippet_group_id: '82768d94-61a2-45dc-9862-adbb0c14f23b',
      },
    ],
  },
  {
    id: 'aa768d94-61a2-45dc-9862-adbb0c14f23b',
    name: 'SNIPPET GROUP DEF',
    createdAt: '2024-12-23T14:16:19.020Z',
    updatedAt: '2024-12-23T14:16:19.020Z',
    active: true,
    snippets: [],
  },
];

const setMockDataAndRenderComponent = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups`).reply(200, mockData);
  renderComponent();
};

const setErrorMockAndRenderComponent = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups`).timeout();

  renderComponent();
};

describe('ListSnippets', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays snippet list page', async () => {
    const activeSnippets0 = mockData[0].snippets.filter((snippet) => snippet.active).length;
    const activeSnippets1 = mockData[1].snippets.filter((snippet) => snippet.active).length;

    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    const table = screen.getByTestId('snippetListTable');
    await waitFor(() => expect(table.shadowRoot.querySelector('.dr-table')).toBeDefined());
    const tableRoot = within(table.shadowRoot);
    expect(tableRoot.getByText(/Standard Placeholder Snippets/i)).toBeInTheDocument();

    const expectedHeaders = ['Placeholder Snippet Group', 'Active Snippets', 'Active?', 'Actions'];
    const headerRow = table.shadowRoot.querySelector('table').querySelector('thead tr');
    const actualHeaders = Array.from(headerRow.querySelectorAll('th')).map((header) => header.textContent);

    expectedHeaders.forEach((expectedHeader) => {
      const headerMatched = actualHeaders.some((actualHeader) => actualHeader.includes(expectedHeader));
      expect(headerMatched).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(mockData[0].name)).toBeInTheDocument();
      expect(screen.getByText(`${activeSnippets0} Active Snippets`)).toBeInTheDocument();
      expect(screen.getByText(mockData[1].name)).toBeInTheDocument();
      expect(screen.getByText(`${activeSnippets1} Active Snippets`)).toBeInTheDocument();
    });
  });

  it('orders snippet name correctly', async () => {
    const userInstance = userEvent.setup();
    await setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    // Sort default data array to start
    const sortedNameDefault = mockData.map((item) => item.name).sort((a, b) => a.localeCompare(b));
    const { accessibleTable, sortButton } = queryDruidAccessibleTableByLabel('Placeholder Snippet Group'); // provide the header label

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

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();

    const expected = 'There was an error retrieving the Snippets list';
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(expected);
  });
});
