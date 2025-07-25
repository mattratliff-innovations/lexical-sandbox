import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import CreateStandardParagraph from './CreateStandardParagraph';
import StandardParagraphWrapper from './StandardParagraphWrapper';
import { formData } from './testData';
import ListStandardParagraphs from './ListStandardParagraphs';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const standardParagraphCode = 'SP123';
const standardParagraphName = 'Name123';
const standardParagraphDescription = 'A witty and funny description.';
const standardParagraphContent = 'We are the world.';

const mockEditData = {
  id: 'c3e32674-09ce-4615-bda6-b30801e77450',
  name: standardParagraphName,
  code: standardParagraphCode,
  description: standardParagraphDescription,
  content: standardParagraphContent,
  standard_paragraph_xrefs_attributes: ['dafdegfsa'],
  active: true,
  locked: false,
  created_at: '2023-09-05T14:16:39.757Z',
  updated_at: '2023-09-05T14:16:39.757Z',
};

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/standardParagraphs" element={<StandardParagraphWrapper />}>
        <Route index element={<ListStandardParagraphs />} />
        <Route path="create" element={<CreateStandardParagraph />} />
      </Route>
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/standardparagraphs/create'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

const mockFormCall = async () => mockAxios.onGet(`${APP_API_ENDPOINT}/form_types`).reply(200, formData);

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/standard_paragraphs/`).reply(422, {
    error: 'Unable to create Standard Paragraph: Code has already been taken',
  });

  renderComponent();
};

const createNewStandardParagraph = async (code, description, saveButtonId, name) => {
  const userInstance = userEvent.setup();
  const codeInput = screen.getByLabelText('Paragraph Code');
  await userInstance.type(codeInput, code);

  const nameInput = screen.getByLabelText('Paragraph Name');
  await userInstance.type(nameInput, name);

  const descriptionInput = screen.getByLabelText('Paragraph Description');
  await userInstance.type(descriptionInput, description);

  const contentInput = document.getElementById('content');
  await userInstance.type(contentInput, standardParagraphContent);

  if (saveButtonId === 'saveButton') {
    const { shadowRoot } = screen.getByTestId(saveButtonId);
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
  } else {
    const saveButton = screen.getByRole('button', {
      name: 'Save Standard Paragraph',
    });
    await userInstance.click(saveButton);
  }
};

describe('CreateStandardParagraph', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('with valid data creates a Standard Paragraph with the active checkbox checked by default', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/standard_paragraphs/`).reply(200, mockEditData);

    const { router } = renderComponent();
    expect(router.state.location.pathname).toEqual('/admin/standardparagraphs/create');

    const activeCheckBox = screen.getByLabelText('Paragraph is Active');
    await waitFor(() => expect(activeCheckBox.checked).toEqual(true));
    const lockedCheckBox = screen.getByTestId('locked');
    await waitFor(() => expect(lockedCheckBox.checked).toEqual(false));
    await createNewStandardParagraph(standardParagraphCode, standardParagraphDescription, 'saveButton', standardParagraphName);

    const expectedMessage = 'Standard Paragraph created successfully!';

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(router.state.location.pathname).toEqual('/admin/standardparagraphs');

    const parsedPostedStandardParagraphData = JSON.parse(mockAxios.history.post[0].data).standard_paragraph;
    expect(parsedPostedStandardParagraphData.code).toEqual(standardParagraphCode);
    expect(parsedPostedStandardParagraphData.description).toEqual(standardParagraphDescription);
    expect(parsedPostedStandardParagraphData.active).toEqual(true);
    expect(parsedPostedStandardParagraphData.locked).toEqual(false);

    expect(parsedPostedStandardParagraphData.name).toEqual(standardParagraphName);
  });

  it('successful create with Quick Actions submittal', async () => {
    mockFormCall();
    mockAxios.onPost(`${APP_API_ENDPOINT}/standard_paragraphs/`).reply(200, mockEditData);
    renderComponent();
    await createNewStandardParagraph(standardParagraphCode, standardParagraphDescription, 'QuickActionSaveButton', standardParagraphName);
    expect(await screen.findByText('Standard Paragraph created successfully!')).toBeInTheDocument();
  });

  it('displays an error toast on error', async () => {
    await mockFormCall();
    await setErrorMockAndRenderComponent();
    await createNewStandardParagraph(standardParagraphCode, standardParagraphDescription, 'saveButton', standardParagraphName);

    const expected = 'Unable to create Standard Paragraph: Code has already been taken';
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

    await createNewStandardParagraph(standardParagraphCode, standardParagraphDescription, 'saveButton', standardParagraphName);
    await userEvent.click(submitButton);
    expect(druidAlert).not.toHaveTextContent(/Some required fields need to be updated/i);
  });

  it('displays validation message for invalid code and no message for valid code', async () => {
    await setErrorMockAndRenderComponent();
    const VALIDATION_MESSAGE_CODE = 'A code is required.';
    const VALIDATION_MESSAGE_NAME = 'A name is required.';
    const VALIDATION_MESSAGE_DESCRIPTION = 'A description is required.';
    const userInstance = userEvent.setup();
    const codeField = screen.getByTestId('standard-paragraph-code');
    const descriptionField = screen.getByTestId('standard-paragraph-description');
    const nameField = screen.getByTestId('standard-paragraph-name');
    const submitButton = screen.getByTestId('saveButton').shadowRoot.querySelector('.dr-btn');

    await userInstance.type(nameField, '{backspace}');
    await userInstance.type(codeField, '{backspace}');
    await userInstance.type(descriptionField, '{backspace}');
    await userInstance.click(submitButton);
    expect(await screen.queryByText(VALIDATION_MESSAGE_CODE)).toBeInTheDocument();
    expect(await screen.queryByText(VALIDATION_MESSAGE_DESCRIPTION)).toBeInTheDocument();

    expect(await screen.queryByText(VALIDATION_MESSAGE_NAME)).toBeInTheDocument();

    await userInstance.clear(codeField);

    await userInstance.type(codeField, 'BOND007');
    await userInstance.clear(nameField);
    await userInstance.type(nameField, 'NAME BOND');
    await userInstance.type(descriptionField, 'For Your Eyes Only');
    await userInstance.click(submitButton);
    expect(await screen.queryByText(VALIDATION_MESSAGE_CODE)).not.toBeInTheDocument();
    expect(await screen.queryByText(VALIDATION_MESSAGE_DESCRIPTION)).not.toBeInTheDocument();
    expect(await screen.queryByText(VALIDATION_MESSAGE_NAME)).not.toBeInTheDocument();
  });

  it('does not accept none alphanumeric for code field', async () => {
    await setErrorMockAndRenderComponent();

    const codeInput = screen.getByLabelText('Paragraph Code');
    await userEvent.type(codeInput, '!@BOND007&^%');

    expect(codeInput.value).toBe('BOND007');
    expect(codeInput.value).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('CreateStandardParagraph Check', () => {
  it('verifies the UtilityModal and does not proceed', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('standardParagraphFormHeading')).toBeInTheDocument();
    const codeInput = screen.getByLabelText('Paragraph Code');
    await userInstance.type(codeInput, 'daniel');

    const cancelFormBtn = screen.getByTestId('cancelButton');
    await waitFor(() => expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    let standardParagraphWarning = await screen.findByText(/Leaving this "Standard Paragraphs" form/);
    await waitFor(() => expect(standardParagraphWarning).toBeInTheDocument());

    const { shadowRoot } = screen.getByTestId('exitModalCancel');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    standardParagraphWarning = screen.queryByText(/Leaving this "Standard Paragraphs" form/);

    await waitFor(() => expect(standardParagraphWarning).not.toBeInTheDocument());
  });

  it('verifies the UtilityModal with a valid form and proceeds', async () => {
    const userInstance = userEvent.setup();

    renderComponent();

    expect(await screen.findByTestId('standardParagraphFormHeading')).toBeInTheDocument();

    const codeInput = screen.getByLabelText('Paragraph Code');
    await userInstance.type(codeInput, 'test name');

    const descriptionInput = screen.getByLabelText('Paragraph Description');
    await userInstance.type(descriptionInput, 'test description');

    const cancelFormBtn = await screen.findByTestId('cancelButton');
    expect(cancelFormBtn.shadowRoot.querySelector('.dr-btn')).toBeInTheDocument();
    await userInstance.click(cancelFormBtn.shadowRoot.querySelector('.dr-btn'));

    await screen.findByText(/Leaving this "Standard Paragraphs" form/);

    const { shadowRoot } = screen.getByText('Leave Page');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(screen.getByTestId('adminListCreateButtonDiv')).toBeInTheDocument();
  });
});
