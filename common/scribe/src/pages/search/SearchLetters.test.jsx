import React, { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BrowserRouter } from 'react-router-dom';
import { DateTime } from 'luxon';
import SearchLetters, {
  getMaxDate,
  getDefaultStartDate,
  START_BEFORE_END_DATE,
  PAST_YEAR_ERROR,
  START_DATE_REQUIRED,
  END_DATE_REQUIRED,
  FUTURE_DATE_ERROR,
} from './SearchLetters';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { LOCAL_COMPLETE_STATUS } from '../draft/preview/DraftPreview';
import { AppContext } from '../../AppProvider';
import { ADMINISTRATOR_PERMISSION } from '../../oidc/Authentication';
import { FeatureFlagsProvider } from '../admin/flag/FeatureFlagsProvider';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const LETTER_SEARCH_URL = `${APP_API_ENDPOINT}/letters/letter_search`;
const mockAxios = new MockAdapter(axios);

const mockDraftData = [
  {
    id: '12d8a463-9118-48aa-b3c7-fe17b49d6dd6',
    receiptNumber: 'IOE1234567890',
    formTypeName: 'I90',
    statusId: 'draft',
    updatedAt: '2024-09-18T14:15:05.800Z',
    createdAt: '2024-09-16T14:28:03.514Z',
    letterDateOverride: '2024-07-19',
    letterTypeName: 'Letter Type 1',
  },
  {
    id: 'a687dcfb-3246-4d3d-ad4a-9afcca2c747b',
    receiptNumber: 'IOE0123456789',
    formTypeName: 'I527',
    statusId: 'completed-local',
    updatedAt: '2024-09-18T14:15:05.800Z',
    createdAt: '2024-09-16T14:28:03.514Z',
    letterDateOverride: '2024-07-19',
    letterTypeName: 'Letter Type 2',
  },
];

const mockStatusData = [{ id: 'draft' }, { id: LOCAL_COMPLETE_STATUS }];

const mockOrganizationData = [
  { id: '4d3af7ab-100b-43ee-8435-14e9f823c73e', name: 'org 1' },
  { id: 'orgtwo', name: 'org 2' },
];

const mockFormTypeData = [
  { id: 'formtype1', name: 'N-400', code: 'N400' },
  { id: 'formtype2', name: 'I-539', code: 'I539' },
];

const mockLetterTypeData = [
  { id: 'lettertype1', name: 'standard' },
  { id: 'lettertype2', name: 'formal' },
];

const mockCurrentUserData = {
  roleName: ADMINISTRATOR_PERMISSION,
  organizations: [
    {
      id: '2fd580d8-510b-4d93-924e-6de7a32d6fce',
      name: 'California Service Center',
    },
    {
      id: '06dda792-6d78-4a42-ab58-b3db7a7e108c',
      name: 'Nebraska Service Center',
    },
  ],
};

const mockLetterSearchApiCall = (mockData) => {
  mockAxios.onGet(LETTER_SEARCH_URL).reply(200, mockData);
};

const mockStatusApiCall = (mockData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letters/letter/status`).reply(200, mockData);
};

const mockOrganizationApiCall = (mockData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations`).reply(200, mockData);
};

const mockFormTypeApiCall = (mockData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, mockData);
};

const mockLetterTypeApiCall = (mockData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types`).reply(200, mockData);
};

const verifyFiltersPassedToApi = (filterName, filterValue) => {
  expect(mockAxios.history.get.length).toBeGreaterThan(0);
  const getCallWithFilters = mockAxios.history.get.filter(
    (history) => history.url === LETTER_SEARCH_URL && Object.prototype.hasOwnProperty.call(history, 'params')
  );

  const filterParams = getCallWithFilters[1].params; // Initial load of page and then search.

  expect(filterParams.letter[filterName]).toEqual(filterValue);
};

function renderComponent() {
  render(
    <BrowserRouter>
      <AppContext.Provider
        value={{
          currentUser: mockCurrentUserData,
        }}>
        <FeatureFlagsProvider pollingInterval="60000">
          <SearchLetters />
        </FeatureFlagsProvider>
      </AppContext.Provider>
    </BrowserRouter>
  );
}

describe('Search Letters', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockLetterSearchApiCall(mockDraftData);
    mockStatusApiCall(mockStatusData);
    mockOrganizationApiCall(mockOrganizationData);
    mockFormTypeApiCall(mockFormTypeData);
    mockLetterTypeApiCall(mockLetterTypeData);
  });

  it('displays Search All Letters Page', async () => {
    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(mockAxios.history.get.length).toBeGreaterThan(0); // Intial Page Load
    });
    const { shadowRoot } = await screen.findByTestId('drAccessibleTable');

    const mockDraft = mockDraftData[0];

    await waitFor(() => {
      expect(shadowRoot).toHaveTextContent(mockDraft.receiptNumber);
    });
    expect(shadowRoot).toHaveTextContent(mockDraft.formTypeName);
    expect(shadowRoot).toHaveTextContent(mockDraft.letterTypeName);
    expect(shadowRoot).toHaveTextContent(mockDraft.statusId);
  });

  it('filters by reciept number ', async () => {
    const receiptNumber = 'ANY';
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), receiptNumber);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(1);
    verifyFiltersPassedToApi('receipt_number', receiptNumber);
  });

  it('filters by status', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choose Status/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.selectOptions(screen.getByTestId('statusId'), mockStatusData[0].id);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(1); // Initial Page Load and Search
    verifyFiltersPassedToApi('status_id', mockStatusData[0].id);
  });

  it('filters by organzation', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choose Organization/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.selectOptions(screen.getByTestId('organizationId'), mockOrganizationData[0].id);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(1); // Initial Page Load and Search
    verifyFiltersPassedToApi('organization_id', mockOrganizationData[0].id);
  });

  it('filters by Form Type', async () => {
    renderComponent();
    await waitForLoadingToFinish();

    const userInstance = userEvent.setup();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choose Form Type/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.selectOptions(screen.getByTestId('formTypeCode'), mockFormTypeData[0].code);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(2); // Initial Page Load, FormType Load and Search
    verifyFiltersPassedToApi('form_type_code', mockFormTypeData[0].code);
  });

  it('filters by Alien Number', async () => {
    const alienNumber = 'ANY';
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/A-Number/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('A-Number'), alienNumber);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(1); // Initial Page Load and Search
    verifyFiltersPassedToApi('alien_number', alienNumber);
  });

  it('filters by Letter Type', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Choose Letter Type/i)).toBeInTheDocument();

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.selectOptions(screen.getByTestId('letterType'), mockLetterTypeData[0].id);
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    verifyFiltersPassedToApi('letter_type', mockLetterTypeData[0].id);
  });

  it('filters by Updated Date date range', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - Start/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.get.length).toBeGreaterThan(1); // Initial Page Load and Search
    verifyFiltersPassedToApi('updated_at_start', getDefaultStartDate());
    verifyFiltersPassedToApi('updated_at_end', getMaxDate());
  });

  it('filter by Updated Date requires start date', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - Start/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.type(screen.getByLabelText('Last Updated - Start'), 'x');

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(START_DATE_REQUIRED)).toBeVisible();
  });

  it('filter by Updated Date requires end date', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - End/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    await userInstance.type(screen.getByLabelText('Last Updated - End'), 'x');

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(END_DATE_REQUIRED)).toBeVisible();
  });

  it('filter by Updated Date start date cannot be in the future', async () => {
    const userInstance = userEvent.setup();
    const futureStartDate = DateTime.local().plus({ days: 15 }).toISODate();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - Start/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    fireEvent.change(screen.getByLabelText('Last Updated - Start'), {
      target: { value: futureStartDate },
    });

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(FUTURE_DATE_ERROR)).toBeVisible();
  });

  it('filter by Updated Date end date cannot be in the future', async () => {
    const userInstance = userEvent.setup();
    const futureEndDate = DateTime.local().plus({ days: 15 }).toISODate();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - End/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    fireEvent.change(screen.getByLabelText('Last Updated - End'), {
      target: { value: futureEndDate },
    });

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(FUTURE_DATE_ERROR)).toBeVisible();
  });

  it('filter by Updated Date start date cannot be after end date', async () => {
    const userInstance = userEvent.setup();
    const startDate = DateTime.local().minus({ days: 5 }).toISODate();
    const endDate = DateTime.local().minus({ days: 10 }).toISODate();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - End/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    fireEvent.change(screen.getByLabelText('Last Updated - Start'), {
      target: { value: startDate },
    });
    fireEvent.change(screen.getByLabelText('Last Updated - End'), {
      target: { value: endDate },
    });

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(START_BEFORE_END_DATE)).toBeVisible();
  });

  it('filter by Updated Date date range cannot exceed a year', async () => {
    const userInstance = userEvent.setup();
    const startDate = DateTime.local().minus({ years: 3 }).toISODate();

    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByText(/Search All Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number Starts With/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Updated - End/i)).toBeInTheDocument();
    const inputs = screen.getAllByText(/1-year date range limit/i);
    expect(inputs.length).toBe(2);

    await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), 'any');
    fireEvent.change(screen.getByLabelText('Last Updated - Start'), {
      target: { value: startDate },
    });

    const { shadowRoot } = screen.getByTestId('searchSubmit');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(screen.getByText(PAST_YEAR_ERROR)).toBeVisible();
  });

  it('removes search filters', async () => {
    const userInstance = userEvent.setup();
    renderComponent();
    await waitForLoadingToFinish();

    const button = await screen.findByRole('button', {
      name: 'Show Filter Menu',
    });
    await userInstance.click(button); // show the menu

    const checkToggle = async (checkboxLabelText, selectTestId) => {
      const filterMenu = await screen.findByTestId('filterMenu');

      await userInstance.click(within(filterMenu).getByLabelText(checkboxLabelText)); // hide
      await waitFor(() => {
        expect(screen.queryByTestId(selectTestId)).not.toBeInTheDocument();
      });
      await userInstance.click(within(filterMenu).getByLabelText(checkboxLabelText)); // show
      expect(await screen.findByTestId(selectTestId)).toBeInTheDocument();
    };

    checkToggle('Organizations', 'organizationId');
    checkToggle('Statuses', 'statusId');
    checkToggle('Form Types', 'formTypeId');
    checkToggle('A-Number', 'anumber');
  });

  describe('Caching Searches', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads previous search into the form', async () => {
      const formData = {
        alienNumber: 'A-344163382',
        formTypeCode: 'N300',
        letterType: 'ae27ca89-66a0-43ab-a8a6-f2511bf4ae3a',
        organizationId: '4d3af7ab-100b-43ee-8435-14e9f823c73e',
        receiptNumber: 'SRC2407050077',
        statusId: 'draft',
        updatedAtEnd: '2024-09-18',
        updatedAtStart: '2024-08-18',
        fullTextSearch: 'this is a full text search box',
      };

      localStorage.setItem('formData', JSON.stringify(formData));

      renderComponent();
      await waitForLoadingToFinish();

      const filterContainer = await screen.findByTestId('filterContainer');

      expect(within(filterContainer).getByLabelText('Receipt Number Starts With')).toHaveValue(formData.receiptNumber);
      expect(within(filterContainer).getByLabelText('Last Updated - Start')).toHaveValue(formData.updatedAtStart);
      expect(within(filterContainer).getByLabelText('Choose Organization')).toHaveValue(formData.organizationId);
      expect(within(filterContainer).getByLabelText('Choose Status')).toHaveValue(formData.statusId);
      expect(within(filterContainer).getByLabelText('Last Updated - End')).toHaveValue(formData.updatedAtEnd);
      expect(within(filterContainer).getByLabelText('Last Updated - End')).toHaveValue(formData.updatedAtEnd);
      expect(within(filterContainer).getByLabelText('Letter Body Contains')).toHaveValue(formData.fullTextSearch);
    });

    it('saves the current search to cache', async () => {
      const userInstance = userEvent.setup();

      const receiptNumber = 'IOE1234567890';
      const formTypeCode = mockFormTypeData[1].code;
      const lastUpdatedStart = DateTime.local().minus({ weeks: 1 }).toISODate();
      const lastUpdatedEnd = DateTime.local().minus({ days: 1 }).toISODate();
      const organizationId = mockOrganizationData[0].id;
      const statusId = mockStatusData[0].id;
      const letterTypeId = mockLetterTypeData[0].id;
      const aNumber = 'A-1234567890';
      const fullTextSearch = 'this is a full text search!';

      renderComponent();
      await waitForLoadingToFinish();

      await waitFor(() => {
        expect(mockAxios.history.get.length).toBeGreaterThanOrEqual(5); // dropdowns are filled
      });

      await userInstance.type(screen.getByLabelText('Receipt Number Starts With'), receiptNumber);
      fireEvent.change(screen.getByLabelText('Last Updated - Start'), {
        target: { value: lastUpdatedStart },
      });
      fireEvent.change(screen.getByLabelText('Last Updated - End'), {
        target: { value: lastUpdatedEnd },
      });
      await userInstance.type(screen.getByLabelText('A-Number'), aNumber);
      await userInstance.type(screen.getByLabelText('Letter Body Contains'), fullTextSearch);
      await userInstance.selectOptions(screen.getByLabelText('Choose Organization'), organizationId);
      await userInstance.selectOptions(screen.getByLabelText('Choose Form Type'), formTypeCode);
      await userInstance.selectOptions(screen.getByLabelText('Choose Status'), statusId);
      await userInstance.selectOptions(screen.getByLabelText('Choose Letter Type'), letterTypeId);

      // Submit
      const { shadowRoot } = await screen.findByTestId('searchSubmit');
      const aButton = shadowRoot.querySelector('.dr-btn');
      await userInstance.click(aButton);

      await waitFor(() => {
        // This is set in the onSubmit
        expect(JSON.parse(localStorage.getItem('formData'))).not.toEqual('null');
      });

      // Check localStorage is being set.
      const datFormData = JSON.parse(localStorage.getItem('formData'));
      expect(datFormData.receiptNumber).toEqual(receiptNumber);
      expect(datFormData.formTypeCode).toEqual(formTypeCode);
      expect(datFormData.updatedAtStart).toEqual(lastUpdatedStart);
      expect(datFormData.updatedAtEnd).toEqual(lastUpdatedEnd);
      expect(datFormData.statusId).toEqual(statusId);
      expect(datFormData.alienNumber).toEqual(aNumber);
      expect(datFormData.fullTextSearch).toEqual(fullTextSearch);
    });
  });
});
