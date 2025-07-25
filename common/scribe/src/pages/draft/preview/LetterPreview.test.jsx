import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LetterPreview from './LetterPreview';
import { setDraftOrganization } from '../../../../testSetup/currentUserHelper';
import { APP_API_ENDPOINT, PDF_ENDPOINT } from '../../../http/authenticatedAxios';
import draftData, { STARTS_WITH_TEXT, ENDS_WITH_TEXT, supportingDocumentData } from './draftPreviewTestData';
import { AppContext } from '../../../AppProvider';
import { PAGE_BREAK } from './DraftPreview';
import stripHtmlTags from '../../../../testSetup/generalHelper';
import { USCIS_WEB_ADDRESS, OCC_MESSAGE } from '../PrintedFooter';
import waitForLoadingToFinish from '../../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const SECTION_TEXT = 'Hello';
const SECTION_TEXT2 = 'World';
const DRAFT_ID = 'a433d51b-7e03-4569-be85-0aca400aaacb';
const REP_ID = 'c2e996a7-847d-4b0a-9fc5-590f83613dfa';
const APP_ID = '33491ec5-cddc-40a2-93b5-d33363143ea0';
const NON_RECIPIENT_APP_ID = `${APP_ID}a`;
const MOCK_PDF_RESULT_DATA = 'mock_pdf_result_data';
const MOCK_PDF_DATA = 'mock_pdf_data';

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: DRAFT_ID,
  }),
  useNavigate: () => mockedUseNavigate,
}));

const mockPdfCall = () => mockAxios.onPost(`${PDF_ENDPOINT}/from_html`);

const mockPdfGenerationCall = () => {
  mockPdfCall().reply(200, Buffer.from(MOCK_PDF_RESULT_DATA));
};

const mockPdfErrorCall = () => mockPdfCall().timeout();

const mockDraftCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/letters/${DRAFT_ID}`);

const mockDraftDataCall = (returnData) => {
  mockDraftCall().reply(200, returnData);
};

const mockSupportingDocumentDataCall = (returnData) =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/supporting_documents_for_lettertype_formtype`).reply(200, returnData);

const mockDraftErrorCall = () => mockDraftCall().timeout();

const mockChangeStatusCall = () =>
  mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${DRAFT_ID}/update_status`).reply(200, {
    statusId: 'draft',
  });

const generatedDraftData = draftData({
  sectionText: SECTION_TEXT,
  sectionText2: SECTION_TEXT2,
  draftId: DRAFT_ID,
  applicantId: APP_ID,
  representativeId: REP_ID,
  nonRecipientApplicant: NON_RECIPIENT_APP_ID,
  registration: { receiptNumber: 'receiptNumber' },
  statusId: 'completed-local',
});

const generatePdfContent1 = stripHtmlTags(supportingDocumentData[0].supporting_document_sections[0].text);
const generatePdfContent2 = stripHtmlTags(supportingDocumentData[1].supporting_document_sections[0].text);
const generatePdfContent3 = stripHtmlTags(supportingDocumentData[1].supporting_document_sections[1].text);

const renderComponent = () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <AppContext.Provider value={{ setDraftOrganization }}>
          <LetterPreview />
        </AppContext.Provider>
      </BrowserRouter>
    </>
  );
};

describe('LetterPreview', () => {
  beforeEach(() => {
    mockAxios.reset();
    global.URL.createObjectURL = jest.fn();
    global.URL.createObjectURL.mockImplementation(() => MOCK_PDF_DATA);
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    global.URL.createObjectURL.mockReset();
    global.URL.revokeObjectURL.mockReset();
  });

  describe('with 200 OKs from APIs', () => {
    it('renders the PDF with the first recipient auto selected', async () => {
      mockDraftDataCall(generatedDraftData);
      mockSupportingDocumentDataCall(supportingDocumentData);
      mockPdfGenerationCall();

      renderComponent();
      await waitForLoadingToFinish();

      const draftLetterHeader = `View Completed-local Letter | ${generatedDraftData.registration.receipt_number}`;
      expect(await screen.findByTestId('header')).toHaveTextContent(draftLetterHeader);
      const pdfObject = screen.getByTestId('inline-pdf');
      expect(pdfObject.data).toContain(MOCK_PDF_DATA);
      const html = mockAxios.history.post[0].data;
      expect(html).toContain(generatedDraftData.representative_type.address.street);
      const indexOfText1 = html.indexOf(SECTION_TEXT);
      const indexOfText2 = html.indexOf(SECTION_TEXT2);
      expect(indexOfText1 > 0 && indexOfText1 < indexOfText2).toBe(true);
      const indexOfStartsWith = html.indexOf(STARTS_WITH_TEXT);
      const indexOfEndsWith = html.indexOf(ENDS_WITH_TEXT);
      expect(indexOfStartsWith > 0 && indexOfStartsWith < indexOfText1).toBe(true);
      expect(indexOfText2 < indexOfEndsWith).toBe(true);
      const indexOfSignatoryName = html.indexOf(generatedDraftData.organization_signature.signatory_name);
      expect(indexOfEndsWith < indexOfSignatoryName).toBe(true);
      expect(html).toContain(USCIS_WEB_ADDRESS);
      const pageNumberRegex = /Page.+ of/i;
      expect(html).toMatch(pageNumberRegex);
      expect(html).toContain(OCC_MESSAGE);
    });

    it('renders the PDF with prepending supporting documents', async () => {
      mockDraftDataCall(generatedDraftData);
      mockSupportingDocumentDataCall(supportingDocumentData);
      mockPdfGenerationCall();

      renderComponent();
      await waitForLoadingToFinish();

      const draftLetterHeader = `View Completed-local Letter | ${generatedDraftData.registration.receipt_number}`;
      expect(await screen.findByTestId('header')).toHaveTextContent(draftLetterHeader);

      const html = mockAxios.history.post[0].data;

      const indexOfSupDoc1 = html.indexOf(generatePdfContent1); // sup-doc #1
      const indexOfPageBreak1 = html.indexOf(PAGE_BREAK); // page break dividing sup-doc #1 & 'Hello World'
      const indexOfText1 = html.indexOf(SECTION_TEXT); // Hello
      const indexOfText2 = html.indexOf(SECTION_TEXT2); // World
      const indexOfPageBreak2 = html.indexOf(PAGE_BREAK, indexOfPageBreak1 + 1); // page break dividing 'Hello World' & sup-doc #2
      const indexOfSupDoc2 = html.indexOf(generatePdfContent2); // sup-doc #2, section 1
      const indexOfSupDoc3 = html.indexOf(generatePdfContent3); // sup-doc #2, section 2

      expect(
        indexOfSupDoc1 < indexOfPageBreak1 &&
          indexOfPageBreak1 < indexOfText1 &&
          indexOfText1 < indexOfText2 &&
          indexOfText2 < indexOfPageBreak2 &&
          indexOfPageBreak2 < indexOfSupDoc2 &&
          indexOfSupDoc2 < indexOfSupDoc3
      ).toBe(true);
    });

    it('renders the PDF without courtsey supporting documents', async () => {
      const userInstance = userEvent.setup();
      mockDraftDataCall(generatedDraftData);
      supportingDocumentData.find((doc) => doc.id === 'f6dd44d2-7887-4119-86d0-5eaee438c918').courtesy = false;
      mockSupportingDocumentDataCall(supportingDocumentData);
      mockPdfGenerationCall();

      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = await screen.findByTestId(`dr-card-${APP_ID}`);
      await userInstance.click(shadowRoot.querySelector('div'));

      const html = mockAxios.history.post[2].data;

      const indexOfSupDoc1Section1 = html.indexOf(generatePdfContent1); // sup-doc #1
      const indexOfPageBreak1 = html.indexOf(PAGE_BREAK); // page break dividing sup-doc #1 & 'Hello World'
      const indexOfAppData = html.indexOf(SECTION_TEXT); // Hello (without World)
      const indexOfSupDoc2Section1 = html.indexOf(generatePdfContent2); // sup-doc #2, section 1
      const indexOfSupDoc2Section2 = html.indexOf(generatePdfContent3); // sup-doc #2, section 2

      // no sup-doc, no page-break, just applicant info
      expect(indexOfSupDoc1Section1).toEqual(-1);
      expect(indexOfPageBreak1).toEqual(-1);
      expect(indexOfSupDoc2Section1).toEqual(-1);
      expect(indexOfSupDoc2Section2).toEqual(-1);
      expect(indexOfAppData > 0).toBe(true);
    });
  });

  describe('with API errors', () => {
    it('shows an error on the API GET', async () => {
      mockDraftErrorCall();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('Encountered an unknown error retrieving the draft.')).toBeInTheDocument();
    });

    it('shows an error on the API POST', async () => {
      mockDraftDataCall(generatedDraftData);
      mockSupportingDocumentDataCall(supportingDocumentData);
      mockPdfErrorCall();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('Encountered an unknown error generating the PDF.')).toBeInTheDocument();
    });
  });
});

describe('quick actions', () => {
  it('goes back to search', async () => {
    const userInstance = userEvent.setup();

    mockDraftDataCall(generatedDraftData);
    mockSupportingDocumentDataCall(supportingDocumentData);
    mockPdfGenerationCall();

    renderComponent();
    await waitForLoadingToFinish();

    const button = await screen.findByTestId('backToSearch');

    await userInstance.click(button);

    expect(mockedUseNavigate).toHaveBeenCalledWith('/searchLetters');
  });

  it('downloads a pdf', async () => {
    const userInstance = userEvent.setup();

    mockDraftDataCall(generatedDraftData);
    mockPdfGenerationCall();

    // window.URL functions not yet supported by JSDOM (which Jest uses under the hood)
    URL.revokeObjectURL = jest.fn();
    URL.createObjectURL = jest.fn();
    URL.createObjectURL.mockImplementation(() => MOCK_PDF_DATA);

    renderComponent();
    await waitForLoadingToFinish();

    const button = await screen.findByRole('button', { name: 'Download PDF' });

    await userInstance.click(button);

    expect(await screen.findByText('PDF Letter Generating!')).toBeInTheDocument();

    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('revert the deletion', async () => {
    const userInstance = userEvent.setup();
    generatedDraftData.statusId = 'deleted';

    mockDraftDataCall(generatedDraftData);
    mockChangeStatusCall();

    renderComponent();
    await waitForLoadingToFinish();

    const button = await screen.findByTestId('changeStatusButton');
    await userInstance.click(button);

    expect(await screen.findByText('Confirmation Required!')).toBeInTheDocument();

    // first, cancel
    const cancelButton = screen.getByTestId('cancelChangeStatus').shadowRoot;
    await userInstance.click(cancelButton.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.queryByText('Confirmation Required!')).not.toBeInTheDocument());

    // next, start over
    await userInstance.click(button);

    // now, revert the deletion
    const confirmButton = screen.getByTestId('changeStatus').shadowRoot;
    await userInstance.click(confirmButton.querySelector('.dr-btn'));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/');
  });
});
