import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastContainer } from 'react-toastify';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import RecentDrafts from './RecentDrafts';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const mockData = [
  {
    id: '74b19936-0f04-4db0-b9fa-6b00bed5a16c',
    receipt_number: 'IOE1234567890',
    form_type_name: 'I539N',
    status_id: 'draft',
    updated_at: '2024-09-10T18:29:51.648Z',
    created_at: '2024-08-29T18:05:20.139Z',
    organization_name: 'California Service Center',
    letter_type_name: 'Letter Type 1 - Constitution - Standard Margins',
  },
  {
    id: 'b6860706-6a7a-4b6d-a017-59c297c92f43',
    receipt_number: 'IOE0987654321',
    form_type_name: 'N300',
    status_id: 'draft',
    updated_at: '2024-08-29T18:05:20.205Z',
    created_at: '2024-08-29T18:05:20.147Z',
    organization_name: 'Nebraska Service Center',
    letter_type_name: 'Letter Type 1 - Constitution - Standard Margins',
  },
];
const setMockDataAndRenderComponent = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letters`).reply(200, mockData);
  render(
    <BrowserRouter>
      <RecentDrafts />
    </BrowserRouter>
  );
};

const setErrorMockAndRenderComponent = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letters`).timeout();
  render(
    <BrowserRouter>
      <ToastContainer />
      <RecentDrafts />
    </BrowserRouter>
  );
};

describe('RecentDrafts', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('with valid data', () => {
    it("displays current user's recent drafts", async () => {
      setMockDataAndRenderComponent();
      await waitForLoadingToFinish();

      // HEADER Test (shadow DOM)
      const expectedHeaders = ['Receipt Number', 'Form Type', 'Letter Type', 'Organization', 'Status', 'Last Modified'];

      const { shadowRoot } = document.querySelector('dr-table');
      let table;
      await waitFor(() => {
        table = shadowRoot.querySelector('table');
        expect(table).toBeInTheDocument();
      });
      const headerRow = table.querySelector('thead tr');
      const actualHeaders = Array.from(headerRow.querySelectorAll('th')).map((header) => header.textContent);

      expectedHeaders.forEach((expectedHeader) => {
        const headerMatched = actualHeaders.some((actualHeader) => actualHeader.includes(expectedHeader));
        expect(headerMatched).toBeTruthy();
      });

      // DATA Test
      const expectedValues = ['IOE1234567890', '9/10/2024, 2:29 PM'];

      const promises = [];
      expectedValues.forEach((tableValue) => promises.push(screen.findByText(tableValue)));
      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result).toBeInTheDocument();
      });
    });
  });

  it('displays a error toast on error', async () => {
    setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();

    const expected = 'There was an error retrieving the Recent Drafts list';
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });
});

describe('Receipt Number Link', () => {
  it('displays a Receipt Number link', async () => {
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    await userEvent.click(await screen.findByTestId(`edit-${mockData[0].id}`));

    expect(document.querySelector('a').getAttribute('href')).toBe(`/draft/${mockData[0].id}`);
  });
});
