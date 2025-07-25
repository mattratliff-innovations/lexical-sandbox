import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import EditLetterType, { FORM_TYPE_RETRIEVAL_ERROR } from './EditLetterType';
import { setupMockFormTypesCall, setupMockFormTypesFailureCall } from '../../../../testSetup/admin/letterTypes/LetterTypeTestHelper';
import ListLetterTypes from './ListLetterTypes';
import LetterTypeWrapper from './LetterTypeWrapper';

const LETTER_TYPE_ID = '288e09fd-654a-45d0-9ed5-540f741740fd';
const LETTER_TYPE_NAME = 'Letter type name.';
const LETTER_TYPE_TITLE = 'Letter Type Title';
const STARTS_WITH = '<p>Starts with this</p>';
const ENDS_WITH = '<p>Ends with this</p>';
const MARGIN_TOP = '1.25';
const MARGIN_BOTTOM = '1.31';
const MARGIN_LEFT = '1.43';
const MARGIN_RIGHT = '1.17';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: LETTER_TYPE_ID }),
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

const mockGetLetterType = () => {
  const mockData = {
    id: LETTER_TYPE_ID,
    name: LETTER_TYPE_NAME,
    title: LETTER_TYPE_TITLE,
    starts_with: STARTS_WITH,
    ends_with: ENDS_WITH,
    margin_top: MARGIN_TOP,
    margin_bottom: MARGIN_BOTTOM,
    margin_left: MARGIN_LEFT,
    margin_right: MARGIN_RIGHT,
    active: false,
    signature_included: false,
    startsWithLocked: true,
    endsWithLocked: true,
    created_at: '2023-09-05T14:16:39.757Z',
    updated_at: '2023-09-05T14:16:39.757Z',
    vawa: false,
  };
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/${LETTER_TYPE_ID}`).reply(200, mockData);
};

const mockEditLetterType = (responseData) => mockAxios.onPut(`${APP_API_ENDPOINT}/letter_types/${LETTER_TYPE_ID}`).reply(200, responseData);

const mockEditLetterTypeError = (responseData) => mockAxios.onPut(`${APP_API_ENDPOINT}/letter_types/${LETTER_TYPE_ID}`).reply(422, responseData);

const editLetterType = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  const nameInput = screen.getByLabelText('Letter Type Name');
  userInstance.type(nameInput, 'Name');

  const catergoryInput = screen.getByRole('combobox', {
    name: 'Letter Category',
  });
  const catergoryOption = screen.getByRole('option', {
    name: 'Request for Evidence',
  });
  userInstance.selectOptions(catergoryInput, catergoryOption);

  const activeCheckBox = screen.getByLabelText('Letter Type is Active');
  userInstance.click(activeCheckBox);
  const signatureCheckBox = screen.getByLabelText('Signature Included');
  userInstance.click(signatureCheckBox);
  const startsWithInput = document.getElementById('startsWith');
  userInstance.type(startsWithInput, STARTS_WITH);
  const endsWithInput = document.getElementById('endsWith');
  userInstance.type(endsWithInput, ENDS_WITH);
  const vawaCheckBox = document.getElementById('vawa');
  userInstance.click(vawaCheckBox);

  const marginTop = screen.getByLabelText('Margin Top');
  await userInstance.type(marginTop, MARGIN_TOP);
  const marginBottom = screen.getByLabelText('Margin Bottom');
  await userInstance.type(marginBottom, MARGIN_BOTTOM);
  const marginLeft = screen.getByLabelText('Margin Left');
  await userInstance.type(marginLeft, MARGIN_LEFT);
  const marginRight = screen.getByLabelText('Margin Right');
  await userInstance.type(marginRight, MARGIN_RIGHT);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', { name: 'Save Letter Type' });
    await userInstance.click(saveButton);
  }
};

const renderComponent = async () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/lettertypes" element={<LetterTypeWrapper />}>
        <Route index element={<ListLetterTypes />} />
        <Route path="edit/:id" element={<EditLetterType />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/lettertypes/edit/:id'],
    initialIndex: 1,
  });

  await waitFor(() => render(<RouterProvider router={router} />));
};

describe('EditLetterType', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    setupMockFormTypesCall(mockAxios);
    mockGetLetterType();
    mockGetCategories();
  });

  it('displays Letter Type with data', async () => {
    await renderComponent();

    expect(screen.getByTestId('header', { name: /Edit Letter Type/i })).toBeInTheDocument();
    expect(screen.getByTestId('startsWithLocked').checked).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Letter Type Title' })).toHaveValue(LETTER_TYPE_TITLE);
    expect(screen.getByTestId('endsWithLocked').checked).toBe(true);
    expect(screen.getByTestId('signatureIncluded').checked).toBe(false);
    expect(screen.getByTestId('headerIncluded').checked).toBe(true);
    expect(screen.getByTestId('vawa').checked).toBe(false);
  });

  it('displays a successful message', async () => {
    await renderComponent();
    mockEditLetterType({});

    await editLetterType('saveButton');

    expect(await screen.findByText('Letter Type edited successfully!')).toBeInTheDocument();
    expect(mockAxios.history.put.length).toEqual(1);
    const postedData = JSON.parse(mockAxios.history.put[0].data);

    expect(postedData.letter_type.starts_with_locked).toBe(true);
    expect(postedData.letter_type.ends_with_locked).toBe(true);
    expect(postedData.letter_type.signature_included).toBe(true);
    expect(postedData.letter_type.vawa).toBe(true);
  });

  it('displays a successful message with Quick Action Save Buttom', async () => {
    await renderComponent();
    mockEditLetterType({});

    await editLetterType('quickActionSaveButton');

    expect(await screen.findByText('Letter Type edited successfully!')).toBeInTheDocument();
  });

  it('displays a post error duplicate message', async () => {
    await renderComponent();

    const returnError = {
      error: 'Unable to edit Letter type: Name has already been taken',
    };
    mockEditLetterTypeError(returnError);
    await editLetterType('saveButton');

    expect(screen.queryByText(returnError.error)).toBeInTheDocument();
  });
});

describe('HTTP Calls Failing', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('does not blow up if retrieving the letter type fails', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/${LETTER_TYPE_ID}`).reply(400);
    setupMockFormTypesCall(mockAxios);

    await renderComponent();
    expect(await screen.findByText('There was an error retrieving the letter type.')).toBeInTheDocument();
  });

  it('does not blow up if retrieving the form types fails', async () => {
    mockGetLetterType();
    setupMockFormTypesFailureCall(mockAxios);

    await renderComponent();
    expect(await screen.findByText(FORM_TYPE_RETRIEVAL_ERROR)).toBeInTheDocument();
  });
});
