import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import CreateLetterType from './CreateLetterType';
import { setupMockFormTypesCall, setupMockFormTypesFailureCall } from '../../../../testSetup/admin/letterTypes/LetterTypeTestHelper';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import 'react-toastify/dist/ReactToastify.css';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import LetterTypeWrapper from './LetterTypeWrapper';
import { setupMockLetterCategoriesCall, mockLetterCategories } from '../../../../testSetup/admin/letterTypes/mockLetterCategories';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

// Mock navigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

const letterTypeName = 'The new letter type name.';
const startsWithText = 'Starts with this';
const endsWithText = 'Ends with this';

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/lettertypes" element={<LetterTypeWrapper />}>
        <Route path="/admin/lettertypes/create" element={<CreateLetterType />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/lettertypes/create'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

const setMockDataAndRenderComponent = () => {
  setupMockFormTypesCall(mockAxios);
  setupMockLetterCategoriesCall(mockAxios);

  const mockData = {
    id: '288e09fd-654a-45d0-9ed5-540f741740fd',
    name: letterTypeName,
    starts_with: startsWithText,
    ends_with: endsWithText,
    created_at: '2023-09-05T14:16:39.757Z',
    updated_at: '2023-09-05T14:16:39.757Z',
    margin_top: 0.65,
    margin_right: 1.0,
    margin_bottom: 1.0,
    margin_left: 1.0,
    active: true,
    starts_with_locked: false,
    ends_with_locked: false,
    signature_included: false,
    title: '',
    letter_category_id: mockLetterCategories[0].id,
    vawa: true,
  };

  mockAxios.onPost(`${APP_API_ENDPOINT}/letter_types/`).reply(200, mockData);
  renderComponent();
};

const setErrorMockAndRenderComponent = async () => {
  setupMockFormTypesCall(mockAxios);
  mockAxios.onPost(`${APP_API_ENDPOINT}/letter_types/`).timeout();
  renderComponent();
};

const createNewLetterType = async (name, margins) => {
  const userInstance = userEvent.setup();

  const letterCategoryInput = await screen.findByLabelText('Letter Category');
  await userInstance.selectOptions(letterCategoryInput, mockLetterCategories[0].id);

  const nameInput = screen.getByLabelText('Letter Type Name');
  await userInstance.type(nameInput, name);
  if (margins) await margins();

  const startsWithInput = document.getElementById('startsWith');
  await userInstance.type(startsWithInput, startsWithText);
  const endsWithInput = document.getElementById('endsWith');
  await userInstance.type(endsWithInput, endsWithText);

  const { shadowRoot } = screen.getByTestId('saveButton');
  await userInstance.click(shadowRoot.querySelector('.dr-btn'));
};

const createNewLetterTypeMargins = async () => {
  const marginTop = screen.getByLabelText('Margin Top');
  await userEvent.type(marginTop, '1.25');
  const marginBottom = screen.getByLabelText('Margin Bottom');
  await userEvent.type(marginBottom, '1.25');
  const marginLeft = screen.getByLabelText('Margin Left');
  await userEvent.type(marginLeft, '1.25');
  const marginRight = screen.getByLabelText('Margin Right');
  await userEvent.type(marginRight, '1.25');
};

describe('CreateLetterType', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Letter Type with a default checked active checkbox and unchecked startsWith and endsWith', async () => {
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => {
      expect(screen.getByLabelText('Letter Type is Active').checked).toEqual(true);
      expect(screen.getByTestId('startsWithLocked').checked).toEqual(false);
      expect(screen.getByTestId('endsWithLocked').checked).toEqual(false);
      expect(screen.getByTestId('vawa').checked).toEqual(false);
    });

    await createNewLetterType(letterTypeName, createNewLetterTypeMargins);

    const expectedMessage = 'Letter Type created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/lettertypes');
    expect(await screen.findByText('Letter Type created successfully!')).toBeInTheDocument();

    expect(mockAxios.history.post.length).toEqual(1);
    const postedData = JSON.parse(mockAxios.history.post[0].data);

    expect(postedData.letter_type.starts_with_locked).toBe(false);
    expect(postedData.letter_type.ends_with_locked).toBe(false);
  });

  it('creates Letter Type form has default margins', async () => {
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();

    await createNewLetterType(letterTypeName);

    expect(await screen.findByText('Letter Type created successfully!')).toBeInTheDocument();
    const postedData = JSON.parse(mockAxios.history.post[0].data);
    expect(postedData.letter_type.margin_top).toBe('0.65');
    expect(postedData.letter_type.margin_bottom).toBe('1.00');
    expect(postedData.letter_type.margin_left).toBe('1.00');
    expect(postedData.letter_type.margin_right).toBe('1.00');
  });

  // this test covers both edit/create form
  it('Form properly checks for blank fields on submission', async () => {
    const userInstance = userEvent.setup();
    await setErrorMockAndRenderComponent();
    setupMockLetterCategoriesCall(mockAxios);
    await waitForLoadingToFinish();

    const shadowRootButton = screen.getByTestId('saveButton').shadowRoot;
    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    expect(druidAlert).toHaveTextContent(/Some required fields need to be updated/i);
    await createNewLetterType(letterTypeName, createNewLetterTypeMargins);
    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));
    await waitFor(() => expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.'));
  });

  it('Successfully submit the form with Quick Action save button', async () => {
    const userInstance = userEvent.setup();
    setMockDataAndRenderComponent();
    await waitForLoadingToFinish();
    setupMockLetterCategoriesCall(mockAxios);

    await createNewLetterType(letterTypeName, createNewLetterTypeMargins);
    await userInstance.click(screen.getByRole('button', { name: 'Save Letter Type' }));

    const { shadowRoot } = screen.getByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i);
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
