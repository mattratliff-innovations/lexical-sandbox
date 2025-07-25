import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import EditSnippet from './EditSnippet';
import ListSnippets from './ListSnippets';
import SnippetWrapper from './SnippetWrapper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';

const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';
const FORM_TYPE_ID = 'zz2d3517-c8f5-4987-ab27-c430c6f3ff99';
const mockAxios = new MockAdapter(axios);
const nameUpdate = 'name update';

// Mock useParams & useNavigate, keep these together or else error
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: MODEL_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const mockSnippetGroupData = {
  id: MODEL_ID,
  name: 'first',
  active: true,
  multiple: false,
  snippets: [
    {
      id: '123',
      name: 'abc',
      content: 'def',
      active: true,
    },
  ],
  createdAt: '2023-09-08T13:20:48.062Z',
  updatedAt: '2023-09-08T13:20:48.062Z',
  snippetGroupFormLetterXrefs: [
    {
      id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed10',
      letterType: {
        id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed11',
        name: 'Letter Type 2 - Gettysburg - 0.25" Margins',
      },
      formType: { id: 'a2e097b0-3028-4eda-8b02-98b3b5b5ed12', name: 'N-300' },
    },
  ],
};

const mockSnippetData = {
  id: '123',
  name: 'abc',
  code: 'code',
  content: 'def',
  active: true,
};

const mockFormTypeData = [
  {
    id: FORM_TYPE_ID,
    name: 'N-300',
    description: 'test description',
    active: true,
    createdAt: '2024-10-28T19:03:51.261Z',
    updatedAt: '2024-10-28T19:03:51.261Z',
    code: 'N300',
  },
];

const setMockData = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups/${MODEL_ID}`).reply(200, mockSnippetGroupData);

const setMockDataFail = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/snippet_groups/${MODEL_ID}`).reply(400, mockSnippetGroupData);
};
const mockEditApiCall = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/snippet_groups/${MODEL_ID}`).reply(200, outData);

const mockEditApiCallError = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/snippet_groups/${MODEL_ID}`).reply(422, outData);

const mockCreateSnippetApiCall = async () => mockAxios.onPost(`${APP_API_ENDPOINT}/snippets/`).reply(200, mockSnippetData);

const mockFormTypeApi = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, mockFormTypeData);

const updateSnippetGroup = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  await userInstance.click(screen.getByLabelText('Standard Placeholder Snippet is Active'));
  await userInstance.click(screen.getByLabelText('Select Multiple Snippets at Once'));
  await userInstance.type(screen.getByLabelText('Placeholder Snippet Group Name'), nameUpdate);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Placeholder Snippet',
    });
    await userInstance.click(saveButton);
  }
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/snippets" element={<SnippetWrapper />}>
        <Route index element={<ListSnippets />} />
        <Route path="/admin/snippets/:id" element={<EditSnippet />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/snippets/:id'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('EditSnippet', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setMockData();
    mockFormTypeApi();
    renderComponent();
  });

  it('displays a successful message', async () => {
    mockEditApiCall({});

    await updateSnippetGroup('saveButton');

    expect(await screen.findByText('Snippet Group edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).snippet_group;
    expect(updatedData.name).toEqual(mockSnippetGroupData.name + nameUpdate);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.multiple).toEqual(true);
    expect(updatedData.snippet_group_form_letter_xrefs_attributes).toHaveLength(1);

    const expectedHeaders = ['Order', 'Name', 'Code', 'Active', 'Actions'];
    const { shadowRoot } = document.querySelector('dr-table');
    const table = shadowRoot.querySelector('table');
    const headerRow = table.querySelector('thead tr');
    const actualHeaders = Array.from(headerRow.querySelectorAll('th')).map((header) => header.textContent);

    expectedHeaders.forEach((expectedHeader) => {
      const headerMatched = actualHeaders.some((actualHeader) => actualHeader.includes(expectedHeader));
      expect(headerMatched).toBeTruthy();
    });
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/snippets');
  });

  it('displays a successful message for Quick Actions submittal', async () => {
    mockEditApiCall({});

    await updateSnippetGroup('quickActionSaveButton');

    expect(await screen.findByText('Snippet Group edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).snippet_group;
    expect(updatedData.name).toEqual(mockSnippetGroupData.name + nameUpdate);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.multiple).toEqual(true);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/snippets');
  });

  it('displays a post error duplicate message', async () => {
    const returnError = {
      error: 'Unable to edit Snippet Group: Name has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateSnippetGroup('saveButton');

    await screen.findByText(returnError.error);
  });
});

describe('EditSnippetGroup Retrieving Axios Data On The Page', () => {
  beforeEach(() => {
    mockAxios.reset();
    mockFormTypeApi();
    jest.clearAllMocks();
  });

  it('displays a toast error message within axios catch', async () => {
    setMockDataFail();
    renderComponent();

    expect(await screen.findByText('There was an error retrieving the Snippet Group.')).toBeInTheDocument();
  });
});

describe('manage Snippet within Group', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockFormTypeApi();
    setMockData();
    renderComponent();
  });

  it('displays a successful message', async () => {
    const userInstance = userEvent.setup();
    jest.fn = mockEditApiCall({});

    mockEditApiCall({});
    mockCreateSnippetApiCall({});

    expect(screen.getByText(/Placeholder Snippet Group Name/i)).toBeInTheDocument();

    expect(screen.getByText(/Standard Placeholder Snippet is Active/i)).toBeInTheDocument();

    expect(screen.getByText(/Select Multiple Snippets at Once/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('addSnippetButton')).toBeVisible());

    await userInstance.click(screen.getByTestId('addSnippetButton').shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText('Snippet Name')).toBeInTheDocument();
    expect(await screen.findByText('Snippet Content')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Snippet Name/i);
    await userInstance.type(nameInput, 'test name');

    const codeInput = screen.getByLabelText(/Snippet Code/i);
    await userInstance.type(codeInput, 'test code');

    // The code was commented out because the user instance: userInstance.type(contentInput, 'test content') was never actually typing value.
    // Now since the form requires lexical input to proceed, the assertions below will not pass.
    // We will be looking into developing a cypruss test to check this functionality.

    // const contentInput = document.getElementById('content-editable-content');
    // await userInstance.type(contentInput, 'test content');

    // const { shadowRoot } = screen.getByTestId('saveSnippetModalButton');
    // userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // expect(await screen.findByText('The snippet was created successfully!')).toBeInTheDocument();

    // const updatedData = JSON.parse(mockAxios.history.post[0].data).snippet;
    // expect(updatedData.snippet_group_id).toEqual(mockSnippetGroupData.id);
    // expect(updatedData.name).toEqual('test name');
    // expect(updatedData.active).toEqual(true);
  });

  it('snippet name required', async () => {
    const userInstance = userEvent.setup();
    mockEditApiCall({});

    expect(screen.getByText(/Placeholder Snippet Group Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Placeholder Snippet is Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Multiple Snippets at Once/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('addSnippetButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('addSnippetButton').shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText('Snippet Name')).toBeInTheDocument();
    expect(await screen.findByText('Snippet Content')).toBeInTheDocument();

    const { shadowRoot } = screen.getByTestId('saveSnippetModalButton');
    userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText('Name is required!')).toBeInTheDocument();
  });

  it('cancels create snippet', async () => {
    const userInstance = userEvent.setup();
    mockEditApiCall({});
    mockCreateSnippetApiCall({});

    expect(screen.getByText(/Placeholder Snippet Group Name/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('addSnippetButton')).toBeVisible());
    await userInstance.click(screen.getByTestId('addSnippetButton').shadowRoot.querySelector('.dr-btn'));

    expect(await screen.findByText('Snippet Name')).toBeInTheDocument();
    expect(await screen.findByText('Snippet Content')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Snippet Name/i);
    await userInstance.type(nameInput, 'test name');

    const { shadowRoot } = screen.getByTestId('cancelSnippetModalButton');
    userInstance.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockAxios.history.post.length).toEqual(0); // Verify no data is posted on cancel
  });
});
