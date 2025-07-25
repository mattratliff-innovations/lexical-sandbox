import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import EditFormType from './EditFormType';
import ListFormTypes from './ListFormTypes';
import FormTypeWrapper from './FormTypeWrapper';
import { RETRIEVING_LETTER_TYPES_ERRORS } from './FormTypeForm';
import { setupMockLetterTypesCall, setupMockLetterTypesFailureCall } from '../../../../testSetup/admin/letterTypes/FormTypeTestHelper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';
const mockAxios = new MockAdapter(axios);
const nameUpdate = '0';
const descriptionUpdate = ' description update';

// Mock useParams & useNavigate, keep these together or else error
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: MODEL_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const mockData = {
  id: MODEL_ID,
  name: 'N-400',
  code: 'N400',
  description: 'This is a form type description 1.0',
  active: true,
  createdAt: '2023-09-08T13:20:48.062Z',
  updatedAt: '2023-09-08T13:20:48.062Z',
};

const setMockData = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/${MODEL_ID}`).reply(200, mockData);
const setMockDataFail = async () => {
  await mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/${MODEL_ID}`).reply(400, mockData);
};
const mockEditApiCall = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/form_types/${MODEL_ID}`).reply(200, outData);
const mockEditApiCallError = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/form_types/${MODEL_ID}`).reply(422, outData);

const updateFormType = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  await userInstance.click(screen.getByLabelText('Form Type is Active'));
  await userInstance.type(screen.getByLabelText('Form Type Name'), nameUpdate);
  await userInstance.type(screen.getByLabelText('Form Type Description'), descriptionUpdate);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', { name: 'Save Form Type' });
    await userInstance.click(saveButton);
  }
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/formtypes" element={<FormTypeWrapper />}>
        <Route index element={<ListFormTypes />} />
        <Route path="/admin/formtypes/:id" element={<EditFormType />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/formtypes/:id'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('EditFormType', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData();
    setupMockLetterTypesCall(mockAxios);
    renderComponent();
  });

  it('displays a successful message', async () => {
    await waitForLoadingToFinish();
    mockEditApiCall({});

    await updateFormType('saveButton');

    expect(await screen.findByText('Form Type edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).form_type;
    expect(updatedData.name).toEqual(mockData.name + nameUpdate);
    expect(updatedData.code).toEqual(mockData.code + nameUpdate);
    expect(updatedData.description).toEqual(mockData.description + descriptionUpdate);
    expect(updatedData.active).toEqual(false);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/formtypes');
  });

  it('displays a successful message for Quick Actions submittal', async () => {
    await waitForLoadingToFinish();
    mockEditApiCall({});

    await updateFormType('quickActionSaveButton');

    expect(await screen.findByText('Form Type edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).form_type;
    expect(updatedData.name).toEqual(mockData.name + nameUpdate);
    expect(updatedData.code).toEqual(mockData.code + nameUpdate);
    expect(updatedData.description).toEqual(mockData.description + descriptionUpdate);
    expect(updatedData.active).toEqual(false);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/formtypes');
  });

  it('displays a post error duplicate message', async () => {
    await waitForLoadingToFinish();
    const returnError = {
      error: 'Unable to edit FormType: Name has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateFormType('saveButton');

    await screen.findByText(returnError.error);
  });

  it('displays a post error duplicate message for code', async () => {
    await waitForLoadingToFinish();
    const returnError = {
      error: 'Unable to edit FormType: Code has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateFormType('saveButton');

    await screen.findByText(returnError.error);
  });
});

describe('EditFormType Retrieving Axios Data On The Page', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays a toast error message within axios catch', async () => {
    await waitForLoadingToFinish();
    setupMockLetterTypesCall(mockAxios);
    setMockDataFail();

    renderComponent();

    expect(await screen.findByText('There was an error retrieving the form type.')).toBeInTheDocument();
  });

  it('does not blow up if retrieving the letter types fails', async () => {
    await waitForLoadingToFinish();
    setMockData();
    setupMockLetterTypesFailureCall(mockAxios);

    renderComponent();

    expect(await screen.findByText(RETRIEVING_LETTER_TYPES_ERRORS)).toBeInTheDocument();
  });
});
