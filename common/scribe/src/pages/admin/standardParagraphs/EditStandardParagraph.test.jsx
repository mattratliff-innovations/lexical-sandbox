import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { formData, mockData } from './testData';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import EditStandardParagraph from './EditStandardParagraph';
import ListStandardParagraphs from './ListStandardParagraphs';
import StandardParagraphWrapper from './StandardParagraphWrapper';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios);
const codeUpdate = '0';
const nameUpdate = '1';
const descriptionUpdate = 'description update';
const contentUpdate = 'content update';
const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';

// Mock useParams & useNavigate, keep these together or else error
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: MODEL_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const setMockData = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/${MODEL_ID}`).reply(200, mockData);

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setMockDataFail = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/${MODEL_ID}`).reply(400, mockData);
};
const mockEditApiCall = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/standard_paragraphs/${MODEL_ID}`).reply(200, outData);
const mockEditApiCallError = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/standard_paragraphs/${MODEL_ID}`).reply(422, outData);

const updateStandardParagraph = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  await userInstance.click(screen.getByLabelText('Paragraph is Active'));
  await userInstance.click(screen.getByLabelText('Paragraph is Locked'));
  await userInstance.type(screen.getByLabelText('Paragraph Code'), codeUpdate);
  await userInstance.type(screen.getByLabelText('Paragraph Name'), nameUpdate);
  await userInstance.type(screen.getByLabelText('Paragraph Description'), descriptionUpdate);
  await userInstance.type(document.getElementById('content'), contentUpdate);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Standard Paragraph',
    });
    await userInstance.click(saveButton);
  }
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/standardparagraphs" element={<StandardParagraphWrapper />}>
        <Route index element={<ListStandardParagraphs />} />
        <Route path="/admin/standardparagraphs/:id" element={<EditStandardParagraph />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/standardparagraphs/:id'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('EditStandardParagraph', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockFormCall();
    setMockData();
    renderComponent();
  });

  it('displays a successful message', async () => {
    mockEditApiCall({});

    await updateStandardParagraph('saveButton');

    expect(await screen.findByText('Standard Paragraph edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).standard_paragraph;
    expect(updatedData.code).toEqual(mockData.code + codeUpdate);
    expect(updatedData.name).toEqual(mockData.name + nameUpdate);
    expect(updatedData.description).toEqual(mockData.description + descriptionUpdate);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.locked).toEqual(true);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/standardparagraphs');
  });

  it('displays a successful message for Quick Actions submittal', async () => {
    mockEditApiCall({});

    await updateStandardParagraph('quickActionSaveButton');

    expect(await screen.findByText('Standard Paragraph edited successfully!')).toBeInTheDocument();
    const updatedData = JSON.parse(mockAxios.history.put[0].data).standard_paragraph;
    expect(updatedData.code).toEqual(mockData.code + codeUpdate);
    expect(updatedData.name).toEqual(mockData.name + nameUpdate);
    expect(updatedData.description).toEqual(mockData.description + descriptionUpdate);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.locked).toEqual(true);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/standardparagraphs');
  });

  it('displays a post error duplicate message', async () => {
    const returnError = {
      error: 'Unable to edit Standard Paragraph: Code has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateStandardParagraph('saveButton');
    await screen.findByText(returnError.error);
  });
});

describe('EditStandardParagraph Retrieving Axios Data On The Page', () => {
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
