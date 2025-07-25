import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import EditClassPreference from './EditClassPreference';
import { setupMockFormTypesCall, setupMockFormTypesFailureCall } from './testHelpers';
import ListClassPreferences from './ListClassPreferences';
import ClassPreferenceWrapper from './ClassPreferenceWrapper';

const CLASS_PREFERENCE_ID = '288e09fd-654a-45d0-9ed5-540f741740fd';
const CLASS_PREFERENCE_NAME = 'Class Preference name.';
const CLASS_PREFERENCE_CODE = 'Class Preference Code';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: CLASS_PREFERENCE_ID }),
}));

const testDataCategoriesList = [
  { id: '9c44d7f0-1b48-4e05-8344-68a4c427ec5a', name: 'Request for Evidence' },
  {
    id: '027579c9-7607-4649-8adf-8164b25f59aa',
    name: 'Notice of Intent to Deny',
  },
  {
    id: 'd4f55848-ab5b-4418-a774-7b05ee1a756b',
    name: 'Notice of Intent to Revoke',
  },
];

const mockGetCategories = () => mockAxios.onGet(`${APP_API_ENDPOINT}/letter_categories`).reply(200, testDataCategoriesList);

const mockGetClassPreference = () => {
  const mockData = {
    id: CLASS_PREFERENCE_ID,
    name: CLASS_PREFERENCE_NAME,
    code: CLASS_PREFERENCE_CODE,
    active: false,
    created_at: '2023-09-05T14:16:39.757Z',
    updated_at: '2023-09-05T14:16:39.757Z',
  };
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/${CLASS_PREFERENCE_ID}`).reply(200, mockData);
};

const mockEditClassPreference = (responseData) =>
  mockAxios.onPut(`${APP_API_ENDPOINT}/class_preferences/${CLASS_PREFERENCE_ID}`).reply(200, responseData);

const mockEditClassPreferenceError = (responseData) =>
  mockAxios.onPut(`${APP_API_ENDPOINT}/class_preferences/${CLASS_PREFERENCE_ID}`).reply(422, responseData);

const editClassPreference = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  const nameLabel = screen.getByLabelText('Class Preference Name');
  const codeLabel = await screen.findByLabelText('Class Preference Code');

  await userInstance.type(nameLabel, 'Name');
  await userInstance.type(codeLabel, 'Code');

  const activeCheckBox = screen.getByLabelText('Class Preference is Active');
  userInstance.click(activeCheckBox);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Class Preference',
    });
    await userInstance.click(saveButton);
  }
};

const renderComponent = async () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/classPreferences" element={<ClassPreferenceWrapper />}>
        <Route index element={<ListClassPreferences />} />
        <Route path="edit/:id" element={<EditClassPreference type="Edit" />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/classPreferences/edit/:id'],
    initialIndex: 1,
  });

  await waitFor(() => render(<RouterProvider router={router} />));
};

describe('ClassPreference', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setupMockFormTypesCall(mockAxios);
    mockGetClassPreference();
    mockGetCategories();
  });

  it('displays Class Preference with data', async () => {
    await renderComponent();

    expect(screen.getByTestId('header', { name: /Edit Class Preference/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Class Preference Code' })).toHaveValue(CLASS_PREFERENCE_CODE);
  });

  it('displays a successful message', async () => {
    await renderComponent();
    mockEditClassPreference({});

    await editClassPreference();

    expect(await screen.findByText('Class Preference edited successfully!')).toBeInTheDocument();
    expect(mockAxios.history.put.length).toEqual(1);
  });

  it('displays a successful message with Quick Action Save Buttom', async () => {
    await renderComponent();
    mockEditClassPreference({});

    await editClassPreference('quickActionSaveButton');

    expect(await screen.findByText('Class Preference edited successfully!')).toBeInTheDocument();
  });

  it('displays a post error duplicate message', async () => {
    await renderComponent();

    const returnError = {
      error: 'Unable to edit Class preference: Name has already been taken',
    };
    mockEditClassPreferenceError(returnError);
    await editClassPreference('saveButton');

    expect(screen.queryByText(returnError.error)).toBeInTheDocument();
  });
});

describe('HTTP Calls Failing', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('does not blow up if retrieving the class preference fails', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/${CLASS_PREFERENCE_ID}`).reply(400);
    setupMockFormTypesCall(mockAxios);

    await renderComponent();
    expect(await screen.findByText('There was an error retrieving the Class Preference.')).toBeInTheDocument();
  });

  it('does not blow up if retrieving the form types fails', async () => {
    mockGetClassPreference();
    setupMockFormTypesFailureCall(mockAxios);

    await renderComponent();
    expect(await screen.findByText('Encountered an unknown error retrieving Form Types.')).toBeInTheDocument();
  });
});
