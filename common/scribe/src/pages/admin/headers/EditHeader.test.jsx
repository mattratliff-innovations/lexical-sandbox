import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import EditHeader from './EditHeader';
import HeaderWrapper from './HeaderWrapper';
import ListHeaders from './ListHeaders';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const HEADER_ID = '6e09ca5e-f10e-489a-9158-082d34004868';
const INVALID_NAME_MSG = 'Only alphanumeric characters, dashes, spaces, and underscores are allowed.';
const mockAxios = new MockAdapter(axios);
const headerName = 'Header Name 123';

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: HEADER_ID }),
}));

const setMockData = () => {
  const mockData = {
    id: HEADER_ID,
    name: 'Header 1',
    content: 'This is header content 1.0',
    active: false,
    createdAt: '2023-09-08T13:20:48.062Z',
    updatedAt: '2023-09-08T13:20:48.062Z',
  };

  mockAxios.onGet(`${APP_API_ENDPOINT}/headers/${HEADER_ID}`).reply(200, mockData);
};

const setMockDataFail = async () => {
  const mockData = {
    id: HEADER_ID,
    name: 'Header 1',
    content: 'This is header content 1.0',
    active: false,
    createdAt: '2023-09-08T13:20:48.062Z',
    updatedAt: '2023-09-08T13:20:48.062Z',
  };

  mockAxios.onGet(`${APP_API_ENDPOINT}/headers/${HEADER_ID}`).reply(400, mockData);
};

const mockEditApiCall = (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/headers/${HEADER_ID}`).reply(200, outData);
const mockEditApiCallError = (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/headers/${HEADER_ID}`).reply(422, outData);

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/headers" element={<HeaderWrapper />}>
        <Route index element={<ListHeaders />} />
        <Route path=":id" element={<EditHeader />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/headers/:id'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

describe('EditHeader', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData();
    renderComponent();
  });

  it('displays Headers', async () => {
    await waitForLoadingToFinish();
    expect(screen.getByTestId('header', { name: /Edit Header/i })).toBeInTheDocument();
    expect(screen.queryByText(/The following variables are available for use:/i)).toBeInTheDocument();
  });

  it('displays a successful message', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    mockEditApiCall({});
    const activeCheckBox = screen.getByLabelText('Header is Active');
    await userInstance.click(activeCheckBox);
    await userInstance.type(screen.getByLabelText('Letter Header Name'), headerName);

    const hiddenEditorInputR1C1 = document.querySelector('#contentR1C1');
    await userInstance.type(hiddenEditorInputR1C1, '[[[LETTER_DATE]]]');

    const hiddenEditorInputR1C2 = document.querySelector('#contentR1C2');
    await userEvent.type(hiddenEditorInputR1C2, '[[[CIS_ADDRESS]]]');

    const { shadowRoot } = screen.getByTestId('createButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText('Header edited successfully!')).toBeInTheDocument();
  });

  it('displays a successful message for Quick Action submittal', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    await mockEditApiCall({});
    await userInstance.type(screen.getByLabelText('Letter Header Name'), headerName);
    await userInstance.click(screen.getByRole('button', { name: 'Save Header' }));

    expect(await screen.findByText('Header edited successfully!')).toBeInTheDocument();
  });

  it('displays validation message for bad name submittal', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    mockEditApiCall({});
    await userInstance.type(screen.getByLabelText('Letter Header Name'), 'Header @ Name % 123');
    await userInstance.click(screen.getByRole('button', { name: 'Save Header' }));

    expect(await screen.findByText(INVALID_NAME_MSG)).toBeInTheDocument();
  });

  it('displays a post error duplicate message', async () => {
    await waitForLoadingToFinish();
    const userInstance = userEvent.setup();
    const returnError = {
      error: 'Unable to edit Header: Name has already been taken',
    };

    mockEditApiCallError(returnError);
    const activeCheckBox = screen.getByLabelText('Header is Active');
    await userInstance.click(activeCheckBox);
    await userInstance.type(screen.getByLabelText('Letter Header Name'), headerName);
    const { shadowRoot } = screen.getByTestId('createButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText(returnError.error)).toBeInTheDocument();
  });

  it('displays no alphanumeric characters error message for valid name', async () => {
    await waitForLoadingToFinish();
    await userEvent.type(screen.getByLabelText('Letter Header Name'), 'Header_Name-123');
    await waitFor(() => expect(screen.queryByText(INVALID_NAME_MSG)).not.toBeInTheDocument());
  });
});

describe('EditHeader Failing', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockDataFail();
    renderComponent();
  });

  it('displays a get error message', async () => {
    await waitForLoadingToFinish();
    const errorMessage = await screen.findByText('There was an error retrieving the header.');
    expect(errorMessage).toBeInTheDocument();
  });
});
