import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import CreateSupportingDocument from './CreateSupportingDocument';
import SupportingDocumentWrapper from './SupportingDocumentWrapper';
import { formData } from './testData';
import ListSupportingDocuments from './ListSupportingDocuments';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const supportingDocumentName = 'Name123';
const supportingDocumentActive = true;
const supportingDocumentMarginTop = '0.66';
const supportingDocumentMarginBottom = '1.1';
const supportingDocumentMarginLeft = '1.2';
const supportingDocumentMarginRight = '1.3';

const mockEditData = {
  id: 'c3e32674-09ce-4615-bda6-b30801e77450',
  name: supportingDocumentName,
  supporting_document_xrefs_attributes: ['dafdegfsa'],
  active: true,
  marginTop: supportingDocumentMarginTop,
  marginBottom: supportingDocumentMarginBottom,
  marginLeft: supportingDocumentMarginLeft,
  marginRight: supportingDocumentMarginRight,
  created_at: '2023-09-05T14:16:39.757Z',
  updated_at: '2023-09-05T14:16:39.757Z',
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/supportingDocuments" element={<SupportingDocumentWrapper />}>
        <Route index element={<ListSupportingDocuments />} />
        <Route path="create" element={<CreateSupportingDocument />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/supportingdocuments/create'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/supporting_documents/`).reply(422, {
    error: 'Unable to create Supporting Document: Name has already been taken',
  });

  renderComponent();
};

const createNewSupportingDocument = async (name, active, marginTop, marginBottom, marginLeft, marginRight, saveButtonId = 'saveButton') => {
  const userInstance = userEvent.setup();
  const nameInput = await screen.findByLabelText('Supporting Document Name');
  await userInstance.type(nameInput, name);

  const activeInput = await screen.findByLabelText('Supporting Document is Active');
  if (!active) await userInstance.check(activeInput); // This should be checked by default

  const marginTopInput = await screen.findByLabelText('Margin Top');
  await userInstance.clear(marginTopInput);
  await userInstance.type(marginTopInput, marginTop);

  const marginBottomInput = await screen.findByLabelText('Margin Bottom');
  await userInstance.clear(marginBottomInput);
  await userInstance.type(marginBottomInput, marginBottom);

  const marginLeftInput = await screen.findByLabelText('Margin Left');
  await userInstance.clear(marginLeftInput);
  await userInstance.type(marginLeftInput, marginLeft);

  const marginRightInput = await screen.findByLabelText('Margin Right');
  await userInstance.clear(marginRightInput);
  await userInstance.type(marginRightInput, marginRight);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = await screen.findByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = await screen.findByRole('button', {
      name: 'Save Supporting Document',
    });
    await userInstance.click(saveButton);
  }
};

describe('CreateSupportingDocument', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Supporting Document with the active checkbox checked by default', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/supporting_documents/`).reply(200, mockEditData);

    const { router } = renderComponent();
    expect(router.state.location.pathname).toEqual('/admin/supportingdocuments/create');

    const activeCheckBox = screen.getByLabelText('Supporting Document is Active');
    await waitFor(() => expect(activeCheckBox.checked).toEqual(true));
    await createNewSupportingDocument(
      supportingDocumentName,
      supportingDocumentActive,
      supportingDocumentMarginTop,
      supportingDocumentMarginBottom,
      supportingDocumentMarginLeft,
      supportingDocumentMarginRight,
      'saveButton'
    );

    const parsedPostedSupportingDocumentData = JSON.parse(mockAxios.history.post[0].data).supporting_document;

    expect(parsedPostedSupportingDocumentData.name).toEqual(supportingDocumentName);
    expect(parsedPostedSupportingDocumentData.active).toEqual(supportingDocumentActive);
    expect(parsedPostedSupportingDocumentData.margin_top).toEqual(supportingDocumentMarginTop);
    expect(parsedPostedSupportingDocumentData.margin_bottom).toEqual(supportingDocumentMarginBottom);
    expect(parsedPostedSupportingDocumentData.margin_left).toEqual(supportingDocumentMarginLeft);
    expect(parsedPostedSupportingDocumentData.margin_right).toEqual(supportingDocumentMarginRight);

    await waitFor(() => {
      const modalHeader = screen.getByTestId('addToDocumentModalHeader');
      expect(modalHeader).toHaveTextContent(/Confirmation Required/i);

      const modalBody = screen.getByTestId('addToContentModalBody');
      expect(modalBody).toHaveTextContent(/Would you like to add content to this document?/i);
    });
  });

  it('successful create with Quick Actions submittal', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/supporting_documents/`).reply(200, mockEditData);
    renderComponent();
    await createNewSupportingDocument(
      supportingDocumentName,
      supportingDocumentActive,
      supportingDocumentMarginTop,
      supportingDocumentMarginBottom,
      supportingDocumentMarginLeft,
      supportingDocumentMarginRight,
      'QuickActionSaveButton'
    );

    await waitFor(() => {
      const modalHeader = screen.getByTestId('addToDocumentModalHeader');
      expect(modalHeader).toHaveTextContent(/Confirmation Required/i);

      const modalBody = screen.getByTestId('addToContentModalBody');
      expect(modalBody).toHaveTextContent(/Would you like to add content to this document?/i);
    });
  });

  it('displays an error on duplicate', async () => {
    await mockFormCall();
    await setErrorMockAndRenderComponent();
    await createNewSupportingDocument(
      supportingDocumentName,
      supportingDocumentActive,
      supportingDocumentMarginTop,
      supportingDocumentMarginBottom,
      supportingDocumentMarginLeft,
      supportingDocumentMarginRight,
      'saveButton'
    );

    const expected = 'Unable to create Supporting Document: Name has already been taken';
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
  });

  it('displays validation message for missing name and no message for valid name', async () => {
    const userInstance = userEvent.setup();

    await setErrorMockAndRenderComponent();
    const VALIDATION_MESSAGE_NAME = 'A name is required.';
    const nameField = screen.getByTestId('supporting-document-name');
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

describe('CreateSupportingDocument Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('supportingDocumentFormHeading')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Supporting Document Name');
    await userInstance.type(nameInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let supportingDocumentWarning = await screen.findByText(/Leaving this "Supporting Documents" form/);
    await waitFor(() => expect(supportingDocumentWarning).toBeInTheDocument());

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    supportingDocumentWarning = screen.queryByText(/Leaving this "Supporting Documents" form/);

    await waitFor(() => expect(supportingDocumentWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal with a valid form and proceeds', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('supportingDocumentFormHeading')).toBeInTheDocument();

    const codeInput = screen.getByLabelText('Supporting Document Name');
    await userInstance.type(codeInput, 'test name');

    const descriptionInput = screen.getByLabelText('Margin Top');
    await userInstance.type(descriptionInput, '2.0');

    const cancelFormBtn = await screen.findByTestId('cancelButton');
    expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeInTheDocument();
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    await screen.findByText(/Leaving this "Supporting Documents" form/);

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
