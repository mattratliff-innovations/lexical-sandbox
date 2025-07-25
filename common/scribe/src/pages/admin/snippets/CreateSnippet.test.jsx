import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import CreateSnippet from './CreateSnippet';
import SnippetWrapper from './SnippetWrapper';
import ListSnippets from './ListSnippets';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const snippetGroupName = 'snippet name';

const mockSnippetGroupData = {
  id: 'c3e32674-09ce-4615-bda6-b30801e77450',
  name: snippetGroupName,
  active: true,
  multiple: false,
  created_at: '2023-09-05T14:16:39.757Z',
  updated_at: '2023-09-05T14:16:39.757Z',
};

const mockFormTypeData = [
  {
    id: 'zz2d3517-c8f5-4987-ab27-c430c6f3ff99',
    name: 'N-300',
    description: 'test description',
    active: true,
    createdAt: '2024-10-28T19:03:51.261Z',
    updatedAt: '2024-10-28T19:03:51.261Z',
    code: 'N300',
  },
];

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/snippets" element={<SnippetWrapper />}>
        <Route index element={<ListSnippets />} />
        <Route path="create" element={<CreateSnippet />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/snippets/create'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

const mockPostSnippetGroupApi = async () => mockAxios.onPost(`${APP_API_ENDPOINT}/snippet_groups`).reply(200, mockSnippetGroupData);
const mockFormTypeApi = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, mockFormTypeData);

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/snippet_groups`).reply(422, {
    error: 'Unable to create Snippet Group: Name has already been taken',
  });

  renderComponent();
};

const createNewSnippetGroup = async (name, saveButtonId) => {
  const userInstance = userEvent.setup();
  const nameInput = screen.getByLabelText('Placeholder Snippet Group Name');
  await userInstance.type(nameInput, name);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Placeholder Snippet',
    });
    await userInstance.click(saveButton);
  }
};

describe('Create Snippet Group', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Snippet with the active checkbox checked by default', async () => {
    mockPostSnippetGroupApi();
    mockFormTypeApi();

    const userInstance = userEvent.setup();
    const { router } = renderComponent();
    expect(router.state.location.pathname).toEqual('/admin/snippets/create');

    const activeCheckBox = screen.getByLabelText('Standard Placeholder Snippet is Active');
    await waitFor(() => expect(activeCheckBox.checked).toEqual(true));
    const multipleCheckBox = screen.getByTestId('multiple');
    await waitFor(() => expect(multipleCheckBox.checked).toEqual(false));
    await createNewSnippetGroup(snippetGroupName, 'saveButton');

    const expectedMessage = 'Would you like to add a Snippet Placeholder to this Snippet Group?';
    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('noButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(router.state.location.pathname).toEqual('/admin/snippets');

    const parsedSnippethData = JSON.parse(mockAxios.history.post[0].data).snippet_group;
    expect(parsedSnippethData.name).toEqual(snippetGroupName);
    expect(parsedSnippethData.active).toEqual(true);
    expect(parsedSnippethData.multiple).toEqual(false);
  });

  it('successful create with Quick Actions submittal', async () => {
    mockPostSnippetGroupApi();
    mockFormTypeApi();

    renderComponent();
    await createNewSnippetGroup(snippetGroupName, 'quickActionSaveButton');
    expect(await screen.findByText('Would you like to add a Snippet Placeholder to this Snippet Group?')).toBeInTheDocument();

    const parsedSnippethData = JSON.parse(mockAxios.history.post[0].data).snippet_group;
    expect(parsedSnippethData.name).toEqual(snippetGroupName);
    expect(parsedSnippethData.active).toEqual(true);
    expect(parsedSnippethData.multiple).toEqual(false);
  });

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();

    await createNewSnippetGroup(snippetGroupName, 'saveButton');

    const expected = 'Unable to create Snippet Group: Name has already been taken';
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it('properly checks for blank fields on submission', async () => {
    await setErrorMockAndRenderComponent();
    mockFormTypeApi();

    const { shadowRoot } = screen.getByTestId('saveButton');
    const submitButton = shadowRoot.querySelector('.dr-btn');
    const drAlert = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = drAlert.shadowRoot.querySelector('.dr-root-container');

    await userEvent.click(submitButton);
    expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);
  });
});

describe('Create Snippet Group Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('snippetFormHeading')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Placeholder Snippet Group Name');
    await userInstance.type(nameInput, 'Snippet Group A');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let snippetWarning = await screen.findByText(/Leaving this "Snippets" form/);
    await waitFor(() => expect(snippetWarning).toBeInTheDocument());

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    snippetWarning = screen.queryByText(/Leaving this "Snippets" form/);

    await waitFor(() => expect(snippetWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal with a valid form and proceeds', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('snippetFormHeading')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Placeholder Snippet Group Name');
    await userInstance.type(nameInput, 'test name');

    const cancelFormBtn = await screen.findByTestId('cancelButton');
    expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeInTheDocument();
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    await screen.findByText(/Leaving this "Snippets" form/);

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
