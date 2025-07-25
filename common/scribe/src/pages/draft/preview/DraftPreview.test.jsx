import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import DraftPreview, { PAGE_BREAK, LOCAL_COMPLETE_STATUS, CONFIRMATION_MESSAGE, DIRECTION_MESSAGE } from './DraftPreview';
import { setDraftOrganization } from '../../../../testSetup/currentUserHelper';
import { APP_API_ENDPOINT, PDF_ENDPOINT } from '../../../http/authenticatedAxios';
import draftData, { STARTS_WITH_TEXT, ENDS_WITH_TEXT, supportingDocumentData } from './draftPreviewTestData';
import { AppContext } from '../../../AppProvider';
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
  useParams: () => ({ id: DRAFT_ID }),
  useLocation: () => ({ tate: { totalPageCount: 1 } }),
  useNavigate: () => mockedUseNavigate,
}));

const mockPdfCall = () => mockAxios.onPost(`${PDF_ENDPOINT}/from_html`);

const mockPdfGenerationCall = () => mockPdfCall().reply(200, Buffer.from(MOCK_PDF_RESULT_DATA));

global.FormData = class {
  constructor() {
    this.data = {};
  }

  append(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key];
  }
};

const mockPdfErrorCall = () => mockPdfCall().timeout();
const mockDraftCall = () => mockAxios.onGet(`${APP_API_ENDPOINT}/letters/${DRAFT_ID}`);
const mockDraftDataCall = (returnData) => mockDraftCall().reply(200, returnData);
const mockDraftErrorCall = () => mockDraftCall().timeout();

const mockSupportingDocumentDataCall = (returnData) =>
  mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/supporting_documents_for_lettertype_formtype`).reply(200, returnData);

const generatedDraftData = draftData({
  sectionText: SECTION_TEXT,
  sectionText2: SECTION_TEXT2,
  draftId: DRAFT_ID,
  applicantId: APP_ID,
  representativeId: REP_ID,
  nonRecipientApplicant: NON_RECIPIENT_APP_ID,
});

const mockStatusUpdateCall = async (returnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${DRAFT_ID}/update_status`).reply(200, returnData);
};

const uploadFinalPdfUrl = `${APP_API_ENDPOINT}/letters/${DRAFT_ID}/upload_pdf`;
const mockOnPostFinalPdf = () => mockAxios.onPost(uploadFinalPdfUrl);
const mockUploadFinalPdfToAws = (returnData) => mockOnPostFinalPdf().reply(200, returnData);
const mockUploadFinalPdfToAwsErrorCall = () => mockOnPostFinalPdf().timeout();

const generatePdfContent1 = stripHtmlTags(supportingDocumentData[0].supporting_document_sections[0].text);
const generatePdfContent2 = stripHtmlTags(supportingDocumentData[1].supporting_document_sections[0].text);
const generatePdfContent3 = stripHtmlTags(supportingDocumentData[1].supporting_document_sections[1].text);

const renderComponent = () => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <AppContext.Provider value={{ setDraftOrganization }}>
          <DraftPreview />
        </AppContext.Provider>
      </BrowserRouter>
    </>
  );
};

describe('DraftPreview', () => {
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
    beforeEach(() => {
      mockDraftDataCall(generatedDraftData);
      mockPdfGenerationCall();
      mockStatusUpdateCall(generatedDraftData);
    });

    it('renders the PDF with the first recipient auto selected', async () => {
      mockSupportingDocumentDataCall(supportingDocumentData);
      renderComponent();
      await waitForLoadingToFinish();

      const repCard = await screen.findByTestId(`recipient-card-${REP_ID}`);
      expect(repCard.querySelector(`svg[data-testid="eye-icon-${REP_ID}"]`)).toBeInTheDocument();
      const appCard = screen.getByTestId(`recipient-card-${APP_ID}`);
      expect(appCard.querySelector(`svg[data-testid="eye-slash-icon-${APP_ID}"]`)).toBeInTheDocument();
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
      const indexOfEnclosures = html.indexOf(generatedDraftData.enclosures.name);
      expect(indexOfEnclosures > 0 && indexOfEnclosures > indexOfSignatoryName);
      expect(html).toContain(generatedDraftData.locator_code);
      expect(html).toContain(USCIS_WEB_ADDRESS);
      const pageNumberRegex = /Page.+ of/i;
      expect(html).toMatch(pageNumberRegex);
      expect(html).toContain(OCC_MESSAGE);
    });

    it('swaps the PDF after clicking the second recipient', async () => {
      mockSupportingDocumentDataCall([]);
      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = await screen.findByTestId(`dr-card-${APP_ID}`);
      await userEvent.click(shadowRoot.querySelector('div'));

      expect(global.URL.revokeObjectURL.mock.calls[0][0]).toBe(MOCK_PDF_DATA);

      const appCard = screen.getByTestId(`recipient-card-${APP_ID}`);
      expect(appCard.querySelector(`svg[data-testid="eye-icon-${APP_ID}"]`)).toBeInTheDocument();
      const repCard = screen.getByTestId(`recipient-card-${REP_ID}`);
      expect(repCard.querySelector(`svg[data-testid="eye-slash-icon-${REP_ID}"]`)).toBeInTheDocument();
      const appHtml = mockAxios.history.post[0].data;
      expect(appHtml).toContain(generatedDraftData.representative_type.address.street);
    });

    it('does not render non-letter recipient cards', () => {
      renderComponent();

      const nonExistentCard = screen.queryByTestId(`dr-card-${NON_RECIPIENT_APP_ID}`);
      expect(nonExistentCard).toBe(null);
    });

    it('generates 3 formData keys without supporting document', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall([]);
      mockUploadFinalPdfToAws(generatedDraftData);
      renderComponent();
      await waitForLoadingToFinish();

      // When the print button is clicked it will submit a form with all the PDF data to AWS. This includes a PDF for the rep, app,
      // and one with both.
      const printButton = screen.getByTestId('printMergedPdf');
      await userEvent.click(printButton);

      await waitFor(() => {
        const contactModalBody = screen.getByTestId('defaultModalBody');
        expect(contactModalBody).toHaveTextContent(CONFIRMATION_MESSAGE);
      });

      const { shadowRoot } = await screen.findByTestId('YesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      let indexOfRepData;
      let indexOfAppData;

      // There are a number of post to the PDF generator. This is the last.
      const formDataPost = mockAxios.history.post[2].data;

      // Representative is the first document. The found index should be greater than zero.
      const formDataRep = formDataPost.get(`html_letter[${REP_ID}]`);
      indexOfRepData = formDataRep.indexOf(generatedDraftData.representative_type.address.street);
      expect(indexOfRepData > 0).toBe(true);

      // The second document is for the applicant. The found index should be greater than zero.
      const formDataApp = formDataPost.get(`html_letter[${APP_ID}]`);
      indexOfAppData = formDataApp.indexOf(generatedDraftData.applicant_types[0].address.street);
      expect(indexOfAppData > 0).toBe(true);

      // The third document is the concatenation of the two seperated by a page-break.
      const formDataAll = formDataPost.get('html_letter[all]');
      indexOfRepData = formDataAll.indexOf(generatedDraftData.representative_type.address.street);
      indexOfAppData = formDataAll.indexOf(generatedDraftData.applicant_types[0].address.street);
      expect(indexOfRepData > 0).toBe(true); // should be found
      expect(indexOfAppData > 0).toBe(true); // should be found
      expect(indexOfRepData > 0 && indexOfRepData < indexOfAppData).toBe(true); // Rep is before App.
      const indexOfPageBreak = formDataAll.indexOf(PAGE_BREAK);

      // A page-break separates the two.
      expect(indexOfRepData < indexOfPageBreak).toBe(true);
      expect(indexOfAppData > indexOfPageBreak).toBe(true);

      const successMessage = await screen.findAllByText('PDF Letter Generated Successfully!');
      expect(successMessage).toHaveLength(1);
    });

    it('generates PDF with prepending and appending supporting documents', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall(supportingDocumentData);
      mockUploadFinalPdfToAws(generatedDraftData);
      renderComponent();
      await waitForLoadingToFinish();

      const printButton = screen.getByTestId('printMergedPdf');
      await userEvent.click(printButton);

      const { shadowRoot } = await screen.findByTestId('YesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      const formDataPost = mockAxios.history.post[2].data;

      const formDataAll = formDataPost.get('html_letter[all]');

      const indexOfRepData = formDataAll.indexOf(generatedDraftData.representative_type.address.street);
      const indexOfAppData = formDataAll.indexOf(generatedDraftData.applicant_types[0].address.street);

      const pageBreakCounts = formDataAll.split(PAGE_BREAK).length - 1;
      expect(pageBreakCounts).toEqual(3);

      const indexOfSupDoc1Section1 = formDataAll.indexOf(generatePdfContent1); // supporting doc with append=false
      const indexOfPageBreak1 = formDataAll.indexOf(PAGE_BREAK); // page break dividing sup-doc #1 & Rep Letter
      const indexOfPageBreak2 = formDataAll.indexOf(PAGE_BREAK, indexOfPageBreak1 + 1); // page break dividing Rep & App letters
      const indexOfPageBreak3 = formDataAll.indexOf(PAGE_BREAK, indexOfPageBreak2 + 1); // page break dividing App letter & sup-docs #2
      const indexOfSupDoc2Section1 = formDataAll.indexOf(generatePdfContent2); // supporting doc with append=true, section 1
      const indexOfSupDoc2Section2 = formDataAll.indexOf(generatePdfContent3); // supporting doc with append=true, section 2

      expect(
        indexOfSupDoc1Section1 < indexOfPageBreak1 &&
          indexOfPageBreak1 < indexOfRepData &&
          indexOfRepData < indexOfPageBreak2 &&
          indexOfPageBreak2 < indexOfAppData &&
          indexOfAppData < indexOfPageBreak3 &&
          indexOfPageBreak3 < indexOfSupDoc2Section1 &&
          indexOfSupDoc2Section1 < indexOfSupDoc2Section2
      ).toBe(true);

      const successMessage = await screen.findAllByText('PDF Letter Generated Successfully!');
      expect(successMessage).toHaveLength(1);
    });

    it('generates PDF with a courtsey copy of supporting documents for representative', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall(supportingDocumentData);
      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = await screen.findByTestId(`dr-card-${REP_ID}`);
      await userInstance.click(shadowRoot.querySelector('div'));

      const formDataRep = mockAxios.history.post[0].data;
      const indexOfRepData = formDataRep.indexOf(generatedDraftData.representative_type.address.street);

      const indexOfSupDoc1Section1 = formDataRep.indexOf(generatePdfContent1); // supporting doc with append=false (this test is -1)
      const indexOfPageBreak1 = formDataRep.indexOf(PAGE_BREAK); // page break dividing sup-doc from selected Rep Letter
      const indexOfPageBreak2 = formDataRep.indexOf(PAGE_BREAK, indexOfPageBreak1 + 1); // page break dividing selected Rep Letter from courtsey sup-doc
      const indexOfSupDoc2Section1 = formDataRep.indexOf(generatePdfContent2); // supporting doc with append=true, section 1
      const indexOfSupDoc2Section2 = formDataRep.indexOf(generatePdfContent3); // supporting doc with append=true, section 2

      expect(
        indexOfSupDoc1Section1 < indexOfPageBreak1 &&
          indexOfPageBreak1 < indexOfRepData &&
          indexOfRepData < indexOfPageBreak2 &&
          indexOfPageBreak2 < indexOfSupDoc2Section1 &&
          indexOfSupDoc2Section1 < indexOfSupDoc2Section2
      ).toBe(true);
    });

    it('generates PDF with a courtsey copy of supporting documents for toggling to applicant', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall(supportingDocumentData);
      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = await screen.findByTestId(`dr-card-${APP_ID}`);
      await userInstance.click(shadowRoot.querySelector('div'));

      const formDataApp = mockAxios.history.post[1].data;
      const indexOfAppData = formDataApp.indexOf(generatedDraftData.applicant_types[0].address.street);

      const indexOfSupDoc1Section1 = formDataApp.indexOf(generatePdfContent1); // supporting doc with append=false (this test is -1)
      const indexOfPageBreak1 = formDataApp.indexOf(PAGE_BREAK); // page break dividing selected App Letter from courtsey sup-doc
      const indexOfSupDoc2Section1 = formDataApp.indexOf(generatePdfContent2); // supporting doc with append=true, section 1
      const indexOfSupDoc2Section2 = formDataApp.indexOf(generatePdfContent3); // supporting doc with append=true, section 2

      expect(
        indexOfSupDoc1Section1 < indexOfAppData &&
          indexOfAppData < indexOfPageBreak1 &&
          indexOfPageBreak1 < indexOfSupDoc2Section1 &&
          indexOfSupDoc2Section1 < indexOfSupDoc2Section2
      ).toBe(true);
    });

    it('generates PDF without a courtsey copy of sup-doc for applicant', async () => {
      const userInstance = userEvent.setup();
      supportingDocumentData.find((doc) => doc.id === 'f6dd44d2-7887-4119-86d0-5eaee438c918').courtesy = false;

      mockSupportingDocumentDataCall(supportingDocumentData);
      renderComponent();
      await waitForLoadingToFinish();

      const { shadowRoot } = await screen.findByTestId(`dr-card-${APP_ID}`);
      await userInstance.click(shadowRoot.querySelector('div'));

      const formDataApp = mockAxios.history.post[1].data;
      const indexOfAppData = formDataApp.indexOf(generatedDraftData.applicant_types[0].address.street);

      const indexOfSupDoc1Section1 = formDataApp.indexOf(generatePdfContent1); // supporting doc with append=false (this test is -1)
      const indexOfPageBreak1 = formDataApp.indexOf(PAGE_BREAK); // page break dividing selected App Letter from courtsey sup-doc
      const indexOfSupDoc2Section1 = formDataApp.indexOf(generatePdfContent2); // supporting doc with append=true, section 1
      const indexOfSupDoc2Section2 = formDataApp.indexOf(generatePdfContent3); // supporting doc with append=true, section 2

      // no sup-doc, no page-break, just applicant info
      expect(indexOfSupDoc1Section1).toEqual(-1);
      expect(indexOfPageBreak1).toEqual(-1);
      expect(indexOfSupDoc2Section1).toEqual(-1);
      expect(indexOfSupDoc2Section2).toEqual(-1);
      expect(indexOfAppData > 0).toBe(true);
    });

    it('updates Status call', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall([]);
      mockUploadFinalPdfToAws(generatedDraftData);
      renderComponent();
      await waitForLoadingToFinish();

      const printButton = screen.getByTestId('printMergedPdf');
      await userEvent.click(printButton);

      await waitFor(() => {
        const contactModalBody = screen.getByTestId('defaultModalBody');
        expect(contactModalBody).toHaveTextContent(CONFIRMATION_MESSAGE);
      });

      const { shadowRoot } = await screen.findByTestId('YesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(mockAxios.history.put.length).toEqual(1);
      const putData = JSON.parse(mockAxios.history.put[0].data);
      expect(putData.letter.status_id).toEqual(LOCAL_COMPLETE_STATUS);

      await waitFor(() => {
        const contactModalBody = screen.getByTestId('decisionModalBody');
        expect(contactModalBody).toHaveTextContent(DIRECTION_MESSAGE);
      });
    });

    it('shows an error on the PDF Upload POST', async () => {
      const userInstance = userEvent.setup();
      mockSupportingDocumentDataCall([]);
      mockUploadFinalPdfToAwsErrorCall();
      renderComponent();
      await waitForLoadingToFinish();

      const printButton = screen.getByTestId('printMergedPdf');
      await userEvent.click(printButton);

      await waitFor(() => {
        const contactModalBody = screen.getByTestId('defaultModalBody');
        expect(contactModalBody).toHaveTextContent(CONFIRMATION_MESSAGE);
      });

      const { shadowRoot } = await screen.findByTestId('YesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      const errorMessages = await screen.findAllByText('Encountered an unknown error finalizing the PDF.');
      expect(errorMessages).toHaveLength(1);
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
      mockSupportingDocumentDataCall([]);
      mockDraftDataCall(generatedDraftData);
      mockPdfErrorCall();
      renderComponent();
      await waitForLoadingToFinish();
      expect(await screen.findByText('Encountered an unknown error generating the PDF.')).toBeInTheDocument();
    });
  });
});
