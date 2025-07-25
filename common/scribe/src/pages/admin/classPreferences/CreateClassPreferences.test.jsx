import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import CreateClassPreference from './CreateClassPreference';
import ClassPreferenceWrapper from './ClassPreferenceWrapper';
import { setupMockFormTypesCall, setupMockFormTypesFailureCall } from './testHelpers';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

// Mock navigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

const classPrefName = 'The new class preference name.';
const classPrefCode = 'ClassPrefCode';

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/classPreferences" element={<ClassPreferenceWrapper />}>
        <Route path="/admin/classPreferences/create" element={<CreateClassPreference />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/classPreferences/create'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

const setMockDataAndRenderComponent = () => {
  setupMockFormTypesCall(mockAxios);

  const mockData = {
    id: '',
    name: classPrefName,
    code: classPrefCode,
    form_type_id_list: [],
    form_types: [],
    active: true,
  };

  mockAxios.onPost(`${APP_API_ENDPOINT}/class_preferences/`).reply(200, mockData);
  renderComponent();
};

const setErrorMockAndRenderComponent = async () => {
  setupMockFormTypesCall(mockAxios);
  mockAxios.onPost(`${APP_API_ENDPOINT}/class_preferences/`).timeout();
  renderComponent();
  await waitForLoadingToFinish();
};

const createNewClassPref = async () => {
  const userInstance = userEvent.setup();

  const nameLabel = await screen.findByLabelText('Class Preference Name');
  const codeLabel = await screen.findByLabelText('Class Preference Code');

  await userInstance.type(nameLabel, classPrefName);
  await userInstance.type(codeLabel, classPrefCode);

  const { shadowRoot } = screen.getByTestId('saveButton');
  await userInstance.click(shadowRoot.querySelector('.dr-btn'));
};

describe('Create Class Preference', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Class Preference with a default checked active checkbox', async () => {
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => {
      expect(screen.getByLabelText('Class Preference is Active').checked).toEqual(true);
    });

    createNewClassPref();

    const expectedMessage = 'Class Preference created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/classPreferences');
    expect(await screen.findByText('Class Preference created successfully!')).toBeInTheDocument();

    expect(mockAxios.history.post.length).toEqual(1);
  });

  it('Form properly checks for blank fields on submission', async () => {
    const userInstance = userEvent.setup();
    await setErrorMockAndRenderComponent();

    const shadowRootButton = screen.getByTestId('saveButton').shadowRoot;
    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);

    await createNewClassPref();
    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    await waitFor(() => expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.'));
  });

  it('Successfully submit the form with Quick Action save button', async () => {
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();
    createNewClassPref();

    const expectedMessage = 'Class Preference created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/classPreferences');
  });

  describe('HTTP Calls Failing', () => {
    it('does not blow up if retrieving the form types fails', async () => {
      setupMockFormTypesFailureCall(mockAxios);
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('Encountered an unknown error retrieving Form Types.')).toBeInTheDocument();
    });
  });
});
