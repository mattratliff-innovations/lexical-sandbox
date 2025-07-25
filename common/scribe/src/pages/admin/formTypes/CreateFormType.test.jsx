import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { setupMockLetterTypesCall, setupMockLetterTypesFailureCall } from '../../../../testSetup/admin/letterTypes/FormTypeTestHelper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import CreateFormType from './CreateFormType';
import FormTypeWrapper from './FormTypeWrapper';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

import ListFormTypes from './ListFormTypes';
import { RETRIEVING_LETTER_TYPES_ERRORS } from './FormTypeForm';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const formTypeName = 'N-123';
const expectedSavedFormName = 'N-123';
const expectedSavedFormCode = 'N123';
const formTypeDescription = 'A witty and funny description.';

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/formTypes" element={<FormTypeWrapper />}>
        <Route index element={<ListFormTypes />} />
        <Route path="create" element={<CreateFormType />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/formtypes/create'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/form_types/`).reply(422, {
    error: 'Unable to create FormType: Name has already been taken',
  });
  setupMockLetterTypesCall(mockAxios);

  renderComponent();
  await waitForLoadingToFinish();
};

const createNewFormType = async (name, description, saveButtonId) => {
  const userInstance = userEvent.setup();
  const nameInput = screen.getByLabelText('Form Type Name');
  await userInstance.type(nameInput, name);

  const descriptionInput = screen.getByLabelText('Form Type Description');
  await userInstance.type(descriptionInput, description);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', { name: 'Save Form Type' });
    await userInstance.click(saveButton);
  }
};

describe('CreateFormType', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Form Type with the active checkbox checked by default', async () => {
    const mockData = {
      id: 'c3e32674-09ce-4615-bda6-b30801e77450',
      name: formTypeName,
      description: formTypeDescription,
      active: true,
      created_at: '2023-09-05T14:16:39.757Z',
      updated_at: '2023-09-05T14:16:39.757Z',
    };

    mockAxios.onPost(`${APP_API_ENDPOINT}/form_types/`).reply(200, mockData);
    setupMockLetterTypesCall(mockAxios);

    const { router } = renderComponent();
    await waitForLoadingToFinish();
    expect(router.state.location.pathname).toEqual('/admin/formtypes/create');

    const activeCheckBox = screen.getByLabelText('Form Type is Active');
    await waitFor(() => expect(activeCheckBox.checked).toEqual(true));
    await createNewFormType(formTypeName, formTypeDescription, 'saveButton');

    const expectedMessage = 'Form Type created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(router.state.location.pathname).toEqual('/admin/formtypes');

    const parsedPostedFormTypeData = JSON.parse(mockAxios.history.post[0].data).form_type;
    expect(parsedPostedFormTypeData.name).toEqual(expectedSavedFormName);
    expect(parsedPostedFormTypeData.code).toEqual(expectedSavedFormCode);
    expect(parsedPostedFormTypeData.description).toEqual(formTypeDescription);
    expect(parsedPostedFormTypeData.active).toEqual(true);
  });

  it('successful create with Quick Actions submittal', async () => {
    const mockData = {
      id: 'c3e32674-09ce-4615-bda6-b30801e77450',
      name: formTypeName,
      description: formTypeDescription,
      active: true,
      created_at: '2023-09-05T14:16:39.757Z',
      updated_at: '2023-09-05T14:16:39.757Z',
    };

    mockAxios.onPost(`${APP_API_ENDPOINT}/form_types/`).reply(200, mockData);
    setupMockLetterTypesCall(mockAxios);
    renderComponent();
    await waitForLoadingToFinish();
    await createNewFormType(formTypeName, formTypeDescription, 'QuickActionSaveButton');
    expect(await screen.findByText('Form Type created successfully!')).toBeInTheDocument();
  });

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();
    await createNewFormType(formTypeName, formTypeDescription, 'saveButton');

    const expected = 'Unable to create FormType: Name has already been taken';
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  // this test covers both edit/create form
  it('Form properly checks for blank fields on submission', async () => {
    await setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();

    const { shadowRoot } = screen.getByTestId('saveButton');
    const submitButton = shadowRoot.querySelector('.dr-btn');
    const drAlert = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = drAlert.shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

    await userEvent.click(submitButton);
    expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);

    const mockData = {
      id: 'c3e32674-09ce-4615-bda6-b30801e77450',
      name: formTypeName,
      description: formTypeDescription,
      active: true,
      created_at: '2023-09-05T14:16:39.757Z',
      updated_at: '2023-09-05T14:16:39.757Z',
    };

    mockAxios.onPost(`${APP_API_ENDPOINT}/form_types/`).reply(200, mockData);
    setupMockLetterTypesCall(mockAxios);

    await createNewFormType(formTypeName, formTypeDescription, 'saveButton');
    await userEvent.click(submitButton);
    expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i);
  });

  it('displays validation message for invalid name and no message for valid name', async () => {
    await setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();
    const VALIDATION_MESSAGE_NAME = "Formats: 'G-845' or 'I-129F' or 'EOIR-29' or 'G-845 SUPPLEMENT'";
    const VALIDATION_MESSAGE_CODE = 'A system code is required.';
    const userInstance = userEvent.setup();
    const nameField = screen.getByTestId('form-type-name');
    const submitButton = screen.getByTestId('saveButton').shadowRoot.querySelector('.dr-btn');

    await userInstance.type(nameField, '@%');
    await userInstance.click(submitButton);
    expect(await screen.queryByText(VALIDATION_MESSAGE_NAME)).toBeInTheDocument();
    expect(await screen.queryByText(VALIDATION_MESSAGE_CODE)).toBeInTheDocument();

    await userInstance.clear(nameField); // clear the input field and provide a valid name

    await userInstance.type(nameField, 'N-123');
    await userInstance.click(submitButton);
    expect(await screen.queryByText(VALIDATION_MESSAGE_NAME)).not.toBeInTheDocument();
    expect(await screen.queryByText(VALIDATION_MESSAGE_CODE)).not.toBeInTheDocument();
  });

  it('does not blow up if retrieving the letter types fails', async () => {
    setupMockLetterTypesFailureCall(mockAxios);

    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText(RETRIEVING_LETTER_TYPES_ERRORS)).toBeInTheDocument();
  });

  it('does not accept none alphanumeric for code field', async () => {
    await setErrorMockAndRenderComponent();
    await waitForLoadingToFinish();

    const codeInput = screen.getByLabelText('System Code');
    await userEvent.type(codeInput, '!@N400&^%');

    expect(codeInput.value).toBe('N400');
    expect(codeInput.value).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('CreateFormType Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByTestId('formTypeFormHeading')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Form Type Name');
    await userInstance.type(nameInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let formTypeWarning = await screen.findByText(/Leaving this "Form Types" form/);
    await waitFor(() => expect(formTypeWarning).toBeInTheDocument());

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    formTypeWarning = screen.queryByText(/Leaving this "Form Types" form/);

    await waitFor(() => expect(formTypeWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal with a valid form and proceeds', async () => {
    const userInstance = userEvent.setup();

    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByTestId('formTypeFormHeading')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Form Type Name');
    await userInstance.type(nameInput, 'test name');

    const descriptionInput = screen.getByLabelText('Form Type Description');
    await userInstance.type(descriptionInput, 'test description');

    const cancelFormBtn = await screen.findByTestId('cancelButton');
    expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeInTheDocument();
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    await screen.findByText(/Leaving this "Form Types" form/);

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
