import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { formData, mockData } from './testData';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import EditEnclosure from './EditEnclosure';
import ListEnclosures from './ListEnclosures';
import EnclosureWrapper from './EnclosureWrapper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios);
const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';

// Mock useParams & useNavigate, keep these together or else error
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: MODEL_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const setMockData = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/enclosures/${MODEL_ID}`).reply(200, mockData);

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setMockDataFail = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/enclosures/${MODEL_ID}`).reply(400, mockData);
};
const mockEditApiCall = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/enclosures/${MODEL_ID}`).reply(200, outData);
const mockEditApiCallError = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/enclosures/${MODEL_ID}`).reply(422, outData);

const updateEnclosure = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  await userInstance.click(screen.getByLabelText('Enclosure is Active')); // Uncheck

  const nameInput = screen.getByLabelText('Enclosure Name');
  await userInstance.clear(nameInput);
  await userInstance.type(nameInput, formData[0].name);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Enclosure',
    });
    await userInstance.click(saveButton);
  }
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/enclosures" element={<EnclosureWrapper />}>
        <Route index element={<ListEnclosures />} />
        <Route path="/admin/enclosures/:id" element={<EditEnclosure />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/enclosures/:id'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('EditEnclosure', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockFormCall();
    setMockData();
    renderComponent();
  });

  it('displays a successful message', async () => {
    mockEditApiCall({});

    await updateEnclosure('saveButton');

    expect(await screen.findByText('Enclosure edited successfully!')).toBeInTheDocument();

    const updatedData = JSON.parse(mockAxios.history.put[0].data).enclosure;

    expect(updatedData.name).toEqual(formData[0].name);
    expect(updatedData.active).toEqual(false);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/enclosures');
  });

  it('displays a successful message for Quick Actions submittal', async () => {
    mockEditApiCall({});

    await updateEnclosure('quickActionSaveButton');

    expect(await screen.findByText('Enclosure edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).enclosure;

    expect(updatedData.name).toEqual(formData[0].name);
    expect(updatedData.active).toEqual(false);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/enclosures');
  });

  it('displays a post error duplicate message', async () => {
    const returnError = {
      error: 'Unable to edit Enclosure: Name has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateEnclosure('saveButton');
    await screen.findByText(returnError.error);
  });
});

describe('Edit Enclosure Retrieving Axios Data On The Page', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockFormCall();
    jest.clearAllMocks();
  });

  it('displays a toast error message within axios catch', async () => {
    setMockDataFail();

    renderComponent();

    expect(await screen.findByText('There was an error retrieving the data needed.')).toBeInTheDocument();
  });
});
