import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import CreateEnclosure from './CreateEnclosure';
import EnclosureWrapper from './EnclosureWrapper';
import { formData } from './testData';
import ListEnclosures from './ListEnclosures';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const enclosureName = 'Name123';
const enclosureActive = true;

const mockEditData = {
  id: 'c3e32674-09ce-4615-bda6-b30801e77450',
  name: enclosureName,
  enclosure_xrefs_attributes: ['dafdegfsa'],
  active: true,
  created_at: '2023-09-05T14:16:39.757Z',
  updated_at: '2023-09-05T14:16:39.757Z',
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/enclosures" element={<EnclosureWrapper />}>
        <Route index element={<ListEnclosures />} />
        <Route path="create" element={<CreateEnclosure />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/enclosures/create'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/enclosures/`).reply(422, {
    error: 'Unable to create Enclosure: Name has already been taken',
  });

  renderComponent();
};

const createNewEnclosure = async (name, active, saveButtonId = 'saveButton') => {
  const userInstance = userEvent.setup();
  const nameInput = await screen.findByLabelText('Enclosure Name');
  await userInstance.type(nameInput, name);

  const activeInput = await screen.findByLabelText('Enclosure is Active');
  if (!active) await userInstance.check(activeInput); // This should be checked by default

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = await screen.findByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = await screen.findByRole('button', {
      name: 'Save Enclosure',
    });
    await userInstance.click(saveButton);
  }
};

describe('CreateEnclosure', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Enclosure with the active checkbox checked by default', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/enclosures/`).reply(200, mockEditData);

    const { router } = renderComponent();
    expect(router.state.location.pathname).toEqual('/admin/enclosures/create');

    const activeCheckBox = screen.getByLabelText('Enclosure is Active');
    await waitFor(() => expect(activeCheckBox.checked).toEqual(true));
    await createNewEnclosure(enclosureName, enclosureActive, 'saveButton');

    const expectedMessage = 'Enclosure created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();

    const parsedPostedEnclosureData = JSON.parse(mockAxios.history.post[0].data).enclosure;

    expect(parsedPostedEnclosureData.name).toEqual(enclosureName);
    expect(parsedPostedEnclosureData.active).toEqual(enclosureActive);
  });

  it('successful create with Quick Actions submittal', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/enclosures/`).reply(200, mockEditData);
    renderComponent();
    await createNewEnclosure(enclosureName, enclosureActive, 'QuickActionSaveButton');
    expect(await screen.findByText('Enclosure created successfully!')).toBeInTheDocument();
  });

  it('displays an error toast on error', async () => {
    await mockFormCall();
    await setErrorMockAndRenderComponent();
    await createNewEnclosure(enclosureName, enclosureActive, 'saveButton');

    const expected = 'Unable to create Enclosure: Name has already been taken';
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  // this test covers both edit/create form
  it('properly checks for blank fields on submission', async () => {
    await setErrorMockAndRenderComponent();

    const { shadowRoot } = screen.getByTestId('saveButton');
    const submitButton = shadowRoot.querySelector('.dr-btn');
    const drAlert = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = drAlert.shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

    await userEvent.click(submitButton);

    expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);

    await createNewEnclosure(enclosureName, enclosureActive, 'saveButton');
    await userEvent.click(submitButton);
    expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i);
  });

  it('displays validation message for missing name and no message for valid name', async () => {
    const userInstance = userEvent.setup();

    await setErrorMockAndRenderComponent();
    const VALIDATION_MESSAGE_NAME = 'A name is required.';
    const nameField = screen.getByTestId('enclosure-name');
    const submitButton = screen.getByTestId('saveButton').shadowRoot.querySelector('.dr-btn');

    await userInstance.type(nameField, '{backspace}');
    await userInstance.click(submitButton);

    expect(await screen.findByText(VALIDATION_MESSAGE_NAME)).toBeInTheDocument();

    await userInstance.clear(nameField);
    await userInstance.type(nameField, 'NAME BOND');
    await userInstance.click(submitButton);
    await waitFor(() => expect(screen.queryByText(VALIDATION_MESSAGE_NAME)).not.toBeInTheDocument());
  });
});

describe('CreateEnclosure Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('enclosureFormHeading')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Enclosure Name');
    await userInstance.type(nameInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let enclosureWarning = await screen.findByText(/Leaving this "Enclosures" form/);
    await waitFor(() => expect(enclosureWarning).toBeInTheDocument());

    await userInstance.click(screen.getByTestId('exitModalCancel'));

    enclosureWarning = screen.queryByText(/Leaving this "Enclosures" form/);

    await waitFor(() => expect(enclosureWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal with a valid form and proceeds', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('enclosureFormHeading')).toBeInTheDocument();

    const codeInput = screen.getByLabelText('Enclosure Name');
    await userInstance.type(codeInput, 'test name');

    const cancelFormBtn = await screen.findByTestId('cancelButton');
    expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeInTheDocument();
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    await screen.findByText(/Leaving this "Enclosures" form/);

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
