import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { formData, mockData } from './testData';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import EditSupportingDocument from './EditSupportingDocument';
import ListSupportingDocuments from './ListSupportingDocuments';
import SupportingDocumentWrapper from './SupportingDocumentWrapper';
import { APP_API_ENDPOINT, PDF_ENDPOINT } from '../../../http/authenticatedAxios';
import stripHtmlTags from '../../../../testSetup/generalHelper';

const mockAxios = new MockAdapter(axios);
const MODEL_ID = '6e09ca5e-f10e-489a-9158-082d34004868';

// Mock useParams & useNavigate, keep these together or else error
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: MODEL_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const setMockData = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/${MODEL_ID}`).reply(200, mockData);

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setMockDataFail = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/${MODEL_ID}`).reply(400, mockData);
};

const mockEditApiCall = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/supporting_documents/${MODEL_ID}`).reply(200, outData);

const mockEditApiCallError = async (outData) => mockAxios.onPut(`${APP_API_ENDPOINT}/supporting_documents/${MODEL_ID}`).reply(422, outData);

// For PDF tests
const mockSupportingDocumentDataCall = (returnData) =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/supporting_documents_for_lettertype_formtype`).reply(200, returnData);
const mockPdfCall = () => mockAxios.onPost(`${PDF_ENDPOINT}/from_html`);
const mockPdfGenerationCall = () => mockPdfCall().reply(200, Buffer.from('mock_pdf_result_data'));

const updateSupportingDocument = async (saveButtonId) => {
  const userInstance = userEvent.setup();

  await userInstance.click(screen.getByLabelText('Supporting Document is Active')); // Uncheck

  const nameInput = screen.getByLabelText('Supporting Document Name');
  await userInstance.clear(nameInput);
  await userInstance.type(nameInput, formData[0].name);

  const marginTopInput = await screen.findByLabelText('Margin Top');
  await userInstance.clear(marginTopInput);
  await userInstance.type(marginTopInput, formData[0].marginTop);

  const marginBottomInput = await screen.findByLabelText('Margin Bottom');
  await userInstance.clear(marginBottomInput);
  await userInstance.type(marginBottomInput, formData[0].marginBottom);

  const marginLeftInput = await screen.findByLabelText('Margin Left');
  await userInstance.clear(marginLeftInput);
  await userInstance.type(marginLeftInput, formData[0].marginLeft);

  const marginRightInput = await screen.findByLabelText('Margin Right');
  await userInstance.clear(marginRightInput);
  await userInstance.type(marginRightInput, formData[0].marginRight);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId('saveButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Supporting Document',
    });
    await userInstance.click(saveButton);
  }
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/supportingdocuments" element={<SupportingDocumentWrapper />}>
        <Route index element={<ListSupportingDocuments />} />
        <Route path="/admin/supportingdocuments/:id" element={<EditSupportingDocument />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/supportingdocuments/:id'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('EditSupportingDocument', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockFormCall();
    setMockData();
    renderComponent();
  });

  it('displays a successful message', async () => {
    mockEditApiCall({});

    await updateSupportingDocument('saveButton');

    expect(await screen.findByText('Supporting Document edited successfully!')).toBeInTheDocument();

    const updatedData = JSON.parse(mockAxios.history.put[0].data).supporting_document;

    expect(updatedData.name).toEqual(formData[0].name);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.margin_top).toEqual(formData[0].marginTop);
    expect(updatedData.margin_bottom).toEqual(formData[0].marginBottom);
    expect(updatedData.margin_left).toEqual(formData[0].marginLeft);
    expect(updatedData.margin_right).toEqual(formData[0].marginRight);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/supportingdocuments');
  });

  it('displays a successful message for Quick Actions submittal', async () => {
    mockEditApiCall({});

    updateSupportingDocument('quickActionSaveButton');

    expect(await screen.findByText('Supporting Document edited successfully!')).toBeInTheDocument();

    const updatedData = JSON.parse(mockAxios.history.put[0].data).supporting_document;

    expect(updatedData.name).toEqual(formData[0].name);
    expect(updatedData.active).toEqual(false);
    expect(updatedData.margin_top).toEqual(formData[0].marginTop);
    expect(updatedData.margin_bottom).toEqual(formData[0].marginBottom);
    expect(updatedData.margin_left).toEqual(formData[0].marginLeft);
    expect(updatedData.margin_right).toEqual(formData[0].marginRight);
    expect(mockedUseNavigate).toHaveBeenCalledWith('/admin/supportingdocuments');
  });

  it('displays a post error duplicate message', async () => {
    const returnError = {
      error: 'Unable to edit Supporting Document: Name has already been taken',
    };

    mockEditApiCallError(returnError);

    await updateSupportingDocument('saveButton');
    await screen.findByText(returnError.error);
  });
});

describe('EditSupportingDocument Retrieving Axios Data On The Page', () => {
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

describe('Supporting Document Generated PDF', () => {
  beforeEach(() => {
    mockAxios.reset();
    global.URL.createObjectURL = jest.fn();
    global.URL.createObjectURL.mockImplementation(() => mockData);
    global.URL.revokeObjectURL = jest.fn();
    jest.clearAllMocks();
    mockFormCall();
    setMockData();
    mockPdfGenerationCall();
    mockSupportingDocumentDataCall(mockData.supportingDocumentSections);
    renderComponent();
  });

  afterEach(() => {
    global.URL.createObjectURL.mockReset();
    global.URL.revokeObjectURL.mockReset();
  });

  it('generates PDF with supporting document', async () => {
    await screen.findByText('Edit Supporting Document Content');

    const generatePdfPostData = mockAxios.history.post[0].data;
    const generatePdfContent1 = stripHtmlTags(mockData.supportingDocumentSections[0].text);
    const generatePdfContent2 = stripHtmlTags(mockData.supportingDocumentSections[1].text);
    const generatePdfContent3 = stripHtmlTags(mockData.supportingDocumentSections[2].text);

    const indexOfContent1 = generatePdfPostData.indexOf(generatePdfContent1);
    const indexOfContent2 = generatePdfPostData.indexOf(generatePdfContent2);
    const indexOfContent3 = generatePdfPostData.indexOf(generatePdfContent3);

    expect(indexOfContent1 > 0).toBe(true);
    expect(indexOfContent2 > 0).toBe(true);
    expect(indexOfContent3 > 0).toBe(true);
    expect(indexOfContent1 < indexOfContent2 < indexOfContent3).toBe(true);
  });
});
