import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { userEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import ManageContacts from './ManageContacts';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import { formatContactDate } from './ContactUtils';
import * as contactData from './ManageContactsTestData';
import TestLayout from '../../../testSetup/admin/TestLayout';
import DraftPreview from '../draft/preview/DraftPreview';
import * as Util from './ContactUtils';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const DRAFT_ID = '5966c446-51aa-49be-b0db-afcdee71e1ba';

// Mock useParams
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: DRAFT_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const renderComponent = async () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/draft/preview/:id" element={<DraftPreview />} />
      <Route path="/contacts/:id" element={<ManageContacts />} />
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/contacts/:id'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

const setMockDataAndRenderComponent = async (mockData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/contacts/contacts_for_letter`).reply(200, mockData);
  await renderComponent();
  await waitForLoadingToFinish();
};

const mockEditContactApiCall = async (contactId) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/contacts/${contactId}`).reply(200);
};

const mockDeleteContactApiCall = async (contactId) => {
  mockAxios.onDelete(`${APP_API_ENDPOINT}/contacts/${contactId}`).reply(200);
};

const setErrorMockAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/contacts/contacts_for_letter`).timeout();
  await renderComponent();
  await waitForLoadingToFinish();
};

const mockStateApiCall = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/states`).reply(200, [{ id: '1', code: 'VA', name: 'Virginia' }]);
};

const mockSexesApiCall = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/sexes`).reply(200, [{ id: '2', code: 'F', name: 'Female' }]);
};

const verifyAllContactModalFields = (contactModalBody) => {
  expect(contactModalBody).toHaveTextContent('Role');
  expect(contactModalBody).toHaveTextContent('Letter Recipient?');
  expect(contactModalBody).toHaveTextContent('First Name');
  expect(contactModalBody).toHaveTextContent('Middle Name');
  expect(contactModalBody).toHaveTextContent('Last Name');
  expect(contactModalBody).toHaveTextContent('Street Address');
  expect(contactModalBody).toHaveTextContent('Apartment/Suite/Floor');
};

const verifyApplicantModalFields = (contactModalBody) => {
  expect(contactModalBody).toHaveTextContent('A-Number');
  expect(contactModalBody).toHaveTextContent('Social Security Number');
  expect(contactModalBody).toHaveTextContent('Date of Birth');
  expect(contactModalBody).toHaveTextContent('Email Address');
  expect(contactModalBody).not.toHaveTextContent('Firm Name');
  expect(contactModalBody).toHaveTextContent('In Care Of');
};

const verifyApplicantFields = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/A Number:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Social Security Number:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Date of Birth:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sex:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Firm Name:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/In Care Of:/i)).not.toBeInTheDocument();
  });
};

const verifyModalFieldsUsAddress = (contactModalBody) => {
  expect(contactModalBody).toHaveTextContent('City');
  expect(contactModalBody).toHaveTextContent('State');
  expect(contactModalBody).toHaveTextContent('ZIP Code');
  expect(screen.getByLabelText('Province')).toBeDisabled();
  expect(screen.getByLabelText('Postal Code')).toBeDisabled();
  expect(screen.getByLabelText('Country')).toBeDisabled();
};

const verifyModalFieldsForeignAddress = async (contactModalBody) => {
  await waitFor(() => {
    expect(contactModalBody).toHaveTextContent('Postal Code');
    expect(contactModalBody).toHaveTextContent('Province');
    expect(contactModalBody).toHaveTextContent('Country');
    expect(screen.getByLabelText('City')).not.toBeDisabled();
    expect(screen.getByLabelText('State')).toBeDisabled();
    expect(screen.getByLabelText('ZIP Code')).toBeDisabled();
  });
};

const getTextAcrossNodes = (startNode) => {
  let text = '';

  const traverse = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.childNodes) {
      Array.from(node.childNodes).forEach(traverse);
    }
  };

  traverse(startNode);
  return text;
};

describe('Contacts', () => {
  afterEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays Letter Recipient Representatives', async () => {
    const data = contactData.mockLetterRecipientRepresentativeData;

    await setMockDataAndRenderComponent(data);

    expect(screen.queryByText(/A Number:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Social Security Number:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Date of Birth:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sex:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/In Care Of:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Email Address:/i)).not.toBeInTheDocument();

    const repTypes = await screen.findAllByText(Util.REPRESENTATIVE_DISPLAY_NAME);
    expect(repTypes).toHaveLength(2);

    expect(screen.queryAllByText(/Full Name:/i)).toHaveLength(2);

    const { firstName: firstName1, middleName: middleName1, lastName: lastName1 } = data[0];
    const fullName1 = `${firstName1} ${middleName1} ${lastName1}`;
    expect(await screen.findByText(fullName1)).toBeInTheDocument();

    const { firstName: firstName2, middleName: middleName2, lastName: lastName2 } = data[1];
    const fullName2 = `${firstName2} ${middleName2} ${lastName2}`;
    expect(await screen.findByText(fullName2)).toBeInTheDocument();

    expect(screen.queryAllByText(/Firm Name:/i)).toHaveLength(2);
    expect(await screen.findByText(data[0].firmName)).toBeInTheDocument();
    expect(await screen.findByText(data[1].firmName)).toBeInTheDocument();

    expect(screen.queryAllByText(/Street Address:/i)).toHaveLength(2);
    expect(await screen.findByText(/Richmond, VA 30165/i)).toBeInTheDocument();
    expect(await screen.findByText(/Montreal 99999/i)).toBeInTheDocument();
  });

  it('displays Letter Recipient Petitioner', async () => {
    const data = contactData.mockLetterRecipientPetitionerData;
    await setMockDataAndRenderComponent(data);

    expect(await screen.findByText(Util.PETITIONER_DISPLAY_NAME)).toBeInTheDocument();
    expect(screen.queryByText(/A Number:/i)).toBeInTheDocument();
    expect(await screen.findByText(data[0].aNumber)).toBeInTheDocument();
    expect(screen.queryByText(/Date of Birth:/i)).toBeInTheDocument();
    expect(await screen.findByText(formatContactDate(data[0].dateOfBirth))).toBeInTheDocument();
    expect(screen.queryByText(/Firm Name:/i)).toBeInTheDocument();
    expect(await screen.findByText(data[0].firmName)).toBeInTheDocument();
    expect(screen.queryByText(/In Care Of:/i)).toBeInTheDocument();
    expect(await screen.findByText(data[0].inCareOf)).toBeInTheDocument();
    expect(screen.queryByText(/Street Address:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Montreal 99999/i)).toBeInTheDocument();
    expect(await screen.findByText(data[0].contactAddressXref.address.country)).toBeInTheDocument();

    expect(screen.queryByText(/Email Address:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Social Security Number:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sex:/i)).not.toBeInTheDocument();
  });

  it('displays Letter Recipient Primary Applicant', async () => {
    const data = contactData.mockLetterRecipientPrimaryApplicantData;
    await setMockDataAndRenderComponent(data);

    verifyApplicantFields();

    await waitFor(async () => {
      expect(screen.queryByText(/Email Address:/i)).toBeInTheDocument();
      expect(await screen.findByText(data[0].email)).toBeInTheDocument();
      expect(await screen.findByText(data[0].aNumber)).toBeInTheDocument();
      expect(await screen.findByText(Util.maskedSsn(data[0].ssn))).toBeInTheDocument();
      expect(await screen.findByText(formatContactDate(data[0].dateOfBirth))).toBeInTheDocument();
      expect(await screen.findByText(data[0].sex.name)).toBeInTheDocument();
      expect(screen.queryByText(/Street Address:/i)).toBeInTheDocument();
      expect(await screen.findByText(/Montreal 99999/i)).toBeInTheDocument(); // international address
      expect(await screen.findByText(data[0].contactAddressXref.address.country)).toBeInTheDocument();
      expect(await screen.findByText(/Primary Applicant\/Beneficiary/i)).toBeInTheDocument();

      expect(screen.queryByText(/Firm Name:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/In Care Of:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Make Primary/i)).not.toBeInTheDocument();
    });
  });

  it('displays Letter Recipient Non Primary Applicants', async () => {
    const data = contactData.mockLetterRecipientNonPrimaryApplicantData;
    await setMockDataAndRenderComponent(data);

    await waitFor(() => {
      expect(screen.getAllByText(/A Number:/i)).toHaveLength(2);
      expect(screen.getByText(data[0].aNumber)).toBeInTheDocument();
      expect(screen.getByText(data[1].aNumber)).toBeInTheDocument();

      expect(screen.getAllByText(/Social Security Number:/i)).toHaveLength(2);
      expect(screen.getByText(Util.maskedSsn(data[0].ssn))).toBeInTheDocument();
      expect(screen.getByText(Util.maskedSsn(data[1].ssn))).toBeInTheDocument();

      expect(screen.getAllByText(/Date of Birth:/i)).toHaveLength(2);
      expect(screen.getByText(formatContactDate(data[0].dateOfBirth))).toBeInTheDocument();
      expect(screen.getByText(formatContactDate(data[1].dateOfBirth))).toBeInTheDocument();

      expect(screen.getAllByText(/Sex:/i)).toHaveLength(2);
      expect(screen.getByText(data[0].sex.name)).toBeInTheDocument();
      expect(screen.getByText(data[1].sex.name)).toBeInTheDocument();

      expect(screen.getAllByText(/Street Address:/i)).toHaveLength(2);
      expect(screen.getByText(/Richmond, VA 30165/i)).toBeInTheDocument();
      expect(screen.getByText(/Montreal 99999/i)).toBeInTheDocument();
      expect(screen.getByText(data[1].contactAddressXref.address.country)).toBeInTheDocument();

      expect(screen.getAllByText(/Email Address:/i)).toHaveLength(2);
      expect(screen.getByText(data[0].email)).toBeInTheDocument();
      expect(screen.getByText(data[1].email)).toBeInTheDocument();

      expect(screen.getAllByText(/Applicant\/Beneficiary/i)).toHaveLength(2);

      expect(screen.getAllByText(/Make Primary/i)).toHaveLength(2);
      expect(screen.queryByText(/Firm Name:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/In Care Of:/i)).not.toBeInTheDocument();
    });
  });

  it('displays Other Contacts - Non Primary Applicant', async () => {
    const data = contactData.mockOtherContactNonPrimaryApplicant;
    await setMockDataAndRenderComponent(data);
    verifyApplicantFields();
    expect(await screen.findByText(data[0].aNumber)).toBeInTheDocument();
    expect(await screen.findByText(Util.maskedSsn(data[0].ssn))).toBeInTheDocument();
    expect(await screen.findByText(formatContactDate(data[0].dateOfBirth))).toBeInTheDocument();
    expect(await screen.findByText(data[0].sex.name)).toBeInTheDocument();
    expect(await screen.findByText(/Applicant\/Beneficiary #/i)).toBeInTheDocument();

    expect(screen.queryByText(/Firm Name:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/In Care Of:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Street Address:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Email Address:/i)).not.toBeInTheDocument();
  });

  it('displays an error toast on error', async () => {
    await setErrorMockAndRenderComponent();

    const expected = 'There was an error retrieving the contacts';
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(expected);
  });

  it('displays error alert with errors for each contact', async () => {
    const data = contactData.mockContactNoAddress;
    await setMockDataAndRenderComponent([data]);

    // Top alert header
    await waitFor(async () => expect(await screen.queryByTestId('druid-alert-container').querySelector('dr-alert')).toBeDefined);
    const { shadowRoot } = await screen.queryByTestId('druid-alert-container').querySelector('dr-alert');
    const druidAlert = shadowRoot.querySelector('.dr-root-container');
    expect(druidAlert).toHaveTextContent('Required Fields are Missing');

    // Top alert text
    const text = getTextAcrossNodes(screen.getByTestId('druid-alert-container'));
    const expected = `"${data.type}" "${data.firstName} ${data.lastName}" \
- ${data.errors?.print}`;
    expect(text).toEqual(expected);

    // Card text
    const card = screen.getByTestId(`drCard-${data.id}`);
    expect(card).toHaveTextContent('Recipient does not have an address.');
  });

  it('does not display error alert when errors are not present', async () => {
    const data = contactData.mockLetterRecipientRepresentativeData;
    await setMockDataAndRenderComponent([data]);
    const shadowAlert = screen.queryByTestId('druid-alert-container')?.querySelector('dr-alert');
    expect(shadowAlert).toBeUndefined();
  });
});

describe('Add Contact', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockSexesApiCall();
    mockStateApiCall();
  });

  it('displays create Applicant contact fields', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockLetterRecipientRepresentativeData;

    await setMockDataAndRenderComponent(data);
    await userInstance.click(screen.getByTestId('addContactButton'));

    const contractTypeDropdown = screen.getByTestId('contactTypeSelect');
    fireEvent.change(contractTypeDropdown, {
      target: { value: Util.CONTACT_TYPE_APPLICANT },
    });

    const contactModalHeader = screen.getByTestId('contactModalHeader');
    expect(contactModalHeader).toHaveTextContent('Add Contact');

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    verifyApplicantModalFields(contactModalBody);
    expect(contactModalBody).not.toHaveTextContent('Delete Contact');

    // test foreignAddress checkbox
    const checkbox = screen.getByTestId('foreignAddress');
    expect(checkbox).not.toBeChecked();
    verifyModalFieldsUsAddress(contactModalBody);

    await userInstance.click(checkbox);
    expect(checkbox).toBeChecked();
    verifyModalFieldsForeignAddress(contactModalBody);

    // Verify no masking on create
    const ssnFieldValue = screen.getByTestId('ssnMasked').value;
    expect(ssnFieldValue).toBe('');
  });

  it('displays create Representative contact fields', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockLetterRecipientRepresentativeData;

    await setMockDataAndRenderComponent(data);
    await userInstance.click(screen.getByTestId('addContactButton'));

    const contractTypeDropdown = screen.getByTestId('contactTypeSelect');
    fireEvent.change(contractTypeDropdown, {
      target: { value: Util.CONTACT_TYPE_REPRESENTATIVE },
    });

    const contactModalHeader = screen.getByTestId('contactModalHeader');
    expect(contactModalHeader).toHaveTextContent('Add Contact');

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    expect(contactModalBody).toHaveTextContent('Firm Name');
    expect(contactModalBody).not.toHaveTextContent('In Care Of');
    expect(contactModalBody).not.toHaveTextContent('A-Number');
    expect(contactModalBody).not.toHaveTextContent('Social Security Number');
    expect(contactModalBody).not.toHaveTextContent('Date of Birth');
    expect(contactModalBody).not.toHaveTextContent('Sex');
    expect(contactModalBody).not.toHaveTextContent('Email Address');
    expect(contactModalBody).not.toHaveTextContent('Delete Contact');
  });

  it('displays Create Petitioner Contact fields', async () => {
    const data = contactData.mockLetterRecipientRepresentativeData;
    const userInstance = userEvent.setup();

    await setMockDataAndRenderComponent(data);
    await userInstance.click(screen.getByTestId('addContactButton'));

    const contractTypeDropdown = screen.getByTestId('contactTypeSelect');
    fireEvent.change(contractTypeDropdown, {
      target: { value: Util.CONTACT_TYPE_PETITIONER },
    });

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    expect(contactModalBody).toHaveTextContent('Firm Name');
    expect(contactModalBody).toHaveTextContent('In Care Of');
    expect(contactModalBody).toHaveTextContent('A-Number');
    expect(contactModalBody).toHaveTextContent('Date of Birth');

    expect(contactModalBody).not.toHaveTextContent('Social Security Number');
    expect(contactModalBody).not.toHaveTextContent('Sex');
    expect(contactModalBody).not.toHaveTextContent('Email Address');
    expect(contactModalBody).not.toHaveTextContent('Delete Contact');
  });
});

describe('Update Contact', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockSexesApiCall();
    mockStateApiCall();
  });

  it('display representative (letter recipeint) contact for update', async () => {
    // Validating the Contact Type button for letter recipeints
    // opens the edit contact modal and is in the representative format

    const data = contactData.mockLetterRecipientRepresentativeData;
    const userInstance = userEvent.setup();

    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;

    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    expect(contactModalBody).toHaveTextContent('Firm Name');
    expect(contactModalBody).toHaveTextContent('Delete Contact');

    expect(contactModalBody).not.toHaveTextContent('Social Security Number');
    expect(contactModalBody).not.toHaveTextContent('Sex');
    expect(contactModalBody).not.toHaveTextContent('Email Address');
    expect(contactModalBody).not.toHaveTextContent('In Care Of');
    expect(contactModalBody).not.toHaveTextContent('A-Number');
    expect(contactModalBody).not.toHaveTextContent('Date of Birth');
  });

  it('display applicant (non-letter recipient) for update', async () => {
    // Validating the Contact Type button for other contacts (NOT reps/petioners/primary)
    // opens the edit page and it is in a applicant format
    const data = contactData.mockOtherContactNonPrimaryApplicant;
    const userInstance = userEvent.setup();

    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;

    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    verifyApplicantModalFields(contactModalBody);
  });

  it('display applicant masked SSN and clear', async () => {
    const data = contactData.mockOtherContactNonPrimaryApplicant;
    const userInstance = userEvent.setup();

    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;

    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyApplicantModalFields(contactModalBody);

    const ssnField = document.getElementById('ssn');
    expect(ssnField.value).toContain('6783');

    await userEvent.type(document.getElementById('ssnMasked'), '{backspace}');
    expect(document.getElementById('ssnMasked')).toHaveValue('');
  });

  it('display petitioner (non - letter recipeint) contact for update', async () => {
    // Validating the Contact Type button for other contacts (reps/petioners/primary)
    // opens the edit page and it is in a petitioner format

    const userInstance = userEvent.setup();

    const data = contactData.mockOtherContactPetitionerData;
    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;

    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalBody = screen.getByTestId('contactModalBody');
    verifyAllContactModalFields(contactModalBody);
    expect(contactModalBody).toHaveTextContent('Firm Name');
    expect(contactModalBody).toHaveTextContent('In Care Of');
    expect(contactModalBody).toHaveTextContent('A-Number');
    expect(contactModalBody).toHaveTextContent('Date of Birth');
    expect(contactModalBody).toHaveTextContent('Firm Name');

    expect(contactModalBody).not.toHaveTextContent('Social Security Number');
    expect(contactModalBody).not.toHaveTextContent('Sex');
    expect(contactModalBody).not.toHaveTextContent('Email Address');

    const { shadowRoot } = await screen.findByTestId('cancelSaveContact');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('contactModalBody')).toBeNull());
  });

  // This test simulates when the URL changes which is only by the back button of the web browser
  it('warning message of leaving form from URL change does not appear when modal is not open', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactPetitionerData;
    await setMockDataAndRenderComponent(data);
    expect(screen.queryByText('Letter Recipients')).toBeInTheDocument();

    await userInstance.click(screen.getByText('Test Link'));

    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).not.toBeInTheDocument);
    expect(screen.queryByText(/Letter Recipients/i)).not.toBeInTheDocument();
  });

  it('shows "No Letter Recipents found" message and allows contact to be added', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactPetitionerData;
    await setMockDataAndRenderComponent(data);
    expect(screen.queryByText('No Letter Recipients found.')).toBeInTheDocument();

    const addContactBtn = await screen.findByTestId('addLetterRecip');

    await userInstance.click(addContactBtn.shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.getByTestId('contactModalHeader')).toBeInTheDocument());
  });

  it('shows "No Other Contacts Found" message and allows contact to be added', async () => {
    const userInstance = userEvent.setup();
    await renderComponent();
    await waitForLoadingToFinish();
    expect(screen.queryByText('No Other Contacts Found')).toBeInTheDocument();

    const addContactBtn = await screen.findByTestId('addOther');

    await userInstance.click(addContactBtn.shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.getByTestId('contactModalHeader')).toBeInTheDocument());
  });

  it('cancels edit contact after something is changed and proceeds from Warning message', async () => {
    const userInstance = userEvent.setup();

    const data = contactData.mockOtherContactPetitionerData;
    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;

    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalHeader = screen.getByTestId('contactModalHeader');
    expect(contactModalHeader).toHaveTextContent('Edit Contact');

    await userInstance.type(screen.getByLabelText('First Name'), 'AGENT');
    await userInstance.type(screen.getByLabelText('Last Name'), 'SMITH');
    const { shadowRoot } = await screen.findByTestId('cancelSaveContact');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.queryByTestId('contactModalBody')).toBeNull());

    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).toBeInTheDocument);

    const negativeBtn = screen.getByTestId('positiveBtn');
    await userInstance.click(negativeBtn.shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => {
      expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Edit Contact/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Letter Recipients')).toBeInTheDocument();
    });
  });

  it('edits a contact', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactPetitionerData;
    const contactId = data[0].id;
    mockEditContactApiCall(contactId);

    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalHeader = screen.getByTestId('contactModalHeader');
    expect(contactModalHeader).toHaveTextContent('Edit Contact');

    const { shadowRoot } = await screen.findByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('contactModalBody')).toBeNull());

    const expected = 'The contact was edited successfully!';
    const alert = await screen.findAllByRole('alert');
    expect(alert[0]).toHaveTextContent(expected);
  });

  it('displays a checked Foreign Address checkbox for non-US address', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactPetitionerData;
    const contactId = data[0].id;

    mockEditContactApiCall(contactId);
    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModalBody = screen.getByTestId('contactModalBody');

    const checkbox = screen.getByTestId('foreignAddress');
    expect(checkbox).toBeChecked();
    verifyModalFieldsForeignAddress(contactModalBody);

    await userInstance.click(checkbox);
    expect(checkbox).not.toBeChecked();
    verifyModalFieldsUsAddress(contactModalBody);
  });

  it('displays a non-checked Foreign Address checkbox for US Address', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactNonPrimaryApplicant;
    const contactId = data[0].id;

    mockEditContactApiCall(contactId);
    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));
    const contactModalBody = screen.getByTestId('contactModalBody');

    const checkbox = screen.getByTestId('foreignAddress');
    expect(checkbox).not.toBeChecked();
    verifyModalFieldsUsAddress(contactModalBody);

    await userInstance.click(checkbox);
    expect(checkbox).toBeChecked();
    verifyModalFieldsForeignAddress(contactModalBody);
  });

  it('displays validation messages for Role and Name fields', async () => {
    const userInstance = userEvent.setup();

    const data = contactData.mockBlankContactData;
    const contactId = data[0].id;
    mockEditContactApiCall(contactId);
    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const { shadowRoot } = screen.getByTestId('contactModal').querySelector('dr-alert');
    const druidAlert = shadowRoot.querySelector('.dr-root-container');

    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
    expect(druidAlert).not.toHaveTextContent('Some required fields need to be updated.');

    await userInstance.selectOptions(screen.getByTestId('contactTypeSelect'), '--- Select Role ---');
    const shadowRootButton = screen.getByTestId('submitContactButton').shadowRoot;
    await userInstance.click(shadowRootButton.querySelector('.dr-btn'));

    const contactModalBody = screen.getByTestId('contactModalBody');
    expect(contactModalBody).toHaveTextContent('Role is required!');
    expect(contactModalBody).toHaveTextContent('First Name is required!');
    expect(contactModalBody).toHaveTextContent('Last Name is required!');

    expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');
    expect(druidAlert).toHaveTextContent('Some required fields need to be updated.');
  });

  it('displays no validation message for Role and Name fields', async () => {
    const userInstance = userEvent.setup();

    const data = contactData.mockBlankContactData;
    const contactId = data[0].id;
    mockEditContactApiCall(contactId);
    await setMockDataAndRenderComponent(data);
    await await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    await userInstance.type(screen.getByLabelText('First Name'), 'AGENT');
    await userInstance.type(screen.getByLabelText('Last Name'), 'SMITH');
    await userInstance.click(screen.getByLabelText('Letter Recipient?'));

    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await expect(screen.getByText('The contact was edited successfully!')).toBeInTheDocument();
  });
});

describe('Delete Contact', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockSexesApiCall();
    mockStateApiCall();
  });

  it('deletes a contact', async () => {
    const data = contactData.mockOtherContactPetitionerData;
    const userInstance = userEvent.setup();
    const contactId = data[0].id;
    const { firstName } = data[0];
    const { lastName } = data[0];
    const role = data[0].type;
    mockDeleteContactApiCall(contactId);

    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModal = screen.getByTestId('contactModal');

    expect(contactModal).toHaveTextContent('Delete Contact');
    expect(contactModal).toHaveTextContent('First Name');

    const deleteContact = await screen.findByTestId('deleteContact');
    await userInstance.click(deleteContact.shadowRoot.querySelector('.dr-btn'));

    expect(contactModal).toHaveTextContent('Delete Confirmation');
    expect(contactModal).toHaveTextContent(`Are you sure you want to delete ${role} ${firstName}, ${lastName}?`);
    expect(contactModal).not.toHaveTextContent('First Name');

    const { shadowRoot } = screen.getByTestId('positiveBtn');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('contactModalBody')).toBeNull());

    const expected = 'The contact was deleted successfully!';
    const alert = await screen.findAllByRole('alert');
    expect(alert[0]).toHaveTextContent(expected);

    // Verify mock call
    expect(mockAxios.history.delete.length).toEqual(1);
  });

  it('does not delete a contact when No is selected', async () => {
    const data = contactData.mockOtherContactPetitionerData;
    const userInstance = userEvent.setup();
    const contactId = data[0].id;
    mockDeleteContactApiCall(contactId);

    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    const contactModal = await screen.findByTestId('contactModal');
    await waitFor(() => {
      expect(contactModal).toHaveTextContent('Delete Contact');
      expect(contactModal).toHaveTextContent('First Name');
    });

    const deleteContact = await screen.findByTestId('deleteContact');
    await userInstance.click(deleteContact.shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      expect(contactModal).toHaveTextContent('Delete Confirmation');
      expect(contactModal).not.toHaveTextContent('First Name');
    });

    const { shadowRoot } = screen.getByTestId('negativeBtn');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('contactModal')).not.toBeNull();

      expect(contactModal).not.toHaveTextContent('Delete Confirmation');
      expect(contactModal).toHaveTextContent('First Name');

      // Verify delete mock call is not called
      expect(mockAxios.history.delete.length).toEqual(0);
    });
  });

  it('does not delete a contact when X is selected', async () => {
    const data = contactData.mockOtherContactPetitionerData;
    const userInstance = userEvent.setup();
    const contactId = data[0].id;
    mockDeleteContactApiCall(contactId);

    await setMockDataAndRenderComponent(data);
    await userInstance.click(await screen.findByTestId(`edit-${contactId}`));

    let contactModal;
    await waitFor(() => {
      contactModal = screen.getByTestId('contactModal');
      expect(contactModal).toHaveTextContent('Delete Contact');
      expect(contactModal).toHaveTextContent('Last Name');
    });

    const { shadowRoot } = await screen.findByTestId('deleteContact');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => {
      contactModal = screen.getByTestId('contactModal');

      expect(contactModal).toHaveTextContent('Delete Confirmation');
      expect(contactModal).not.toHaveTextContent('Last Name');
    });

    const closeButtonModal = await screen.findByTestId('closeButtonModal');

    waitFor(() => expect(closeButtonModal).toBeInTheDocument());
    await userInstance.click(closeButtonModal);

    await waitFor(() => {
      expect(screen.queryByTestId(/Delete Confirmation/i)).not.toBeInTheDocument();
      expect(mockAxios.history.delete.length).toEqual(0);
    });
  });
});

describe('Make Primary', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('Makes Applicant Primary', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactNonPrimaryApplicant;

    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;
    const { firstName } = data[0];
    const { lastName } = data[0];

    mockEditContactApiCall(contactId);
    await screen.findByText(/Make Primary/i);

    await userInstance.click(screen.getByTestId('primaryApplicantButton'));

    const primaryApplicantModalBody = screen.getByTestId('defaultModalBody');

    await waitFor(() => {
      expect(primaryApplicantModalBody).toHaveTextContent(`Are you sure you want to make ${firstName} ${lastName} the primary applicant/beneficiary`);
    });

    const { shadowRoot } = screen.getByTestId('YesButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // Verify mock call
    await waitFor(() => {
      expect(mockAxios.history.put.length).toEqual(1);
      const updateUrl = mockAxios.history.put[0].url;
      expect(updateUrl).toEqual(expect.stringContaining(contactId));
      expect(screen.queryByTestId('defaultModalBody')).toBeNull();
    });
  });

  it('Cancels making an Applicant Primary', async () => {
    const userInstance = userEvent.setup();
    const data = contactData.mockOtherContactNonPrimaryApplicant;

    await setMockDataAndRenderComponent(data);
    const contactId = data[0].id;
    const { firstName } = data[0];
    const { lastName } = data[0];

    mockEditContactApiCall(contactId);
    await screen.findByText(/Make Primary/i);

    await userInstance.click(screen.getByTestId('primaryApplicantButton'));

    const primaryApplicantModalBody = screen.getByTestId('defaultModalBody');

    await waitFor(() => {
      expect(primaryApplicantModalBody).toHaveTextContent(`Are you sure you want to make ${firstName} ${lastName} the primary applicant/beneficiary`);
    });

    const { shadowRoot } = screen.getByTestId('noButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    // Verify mock is not called
    await waitFor(() => {
      expect(mockAxios.history.put.length).toEqual(0);
      expect(screen.queryByTestId('defaultModalBody')).toBeNull();
    });
  });
});
