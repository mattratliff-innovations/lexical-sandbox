import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import 'react-toastify/dist/ReactToastify.css';
import { userEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import TestLayout from '../../../testSetup/admin/TestLayout';
import ContactModal from './ContactModal';
import DraftPreview from '../draft/preview/DraftPreview';
import { AdminFormProvider } from '../../contexts/AdminFormContext';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockContactToEdit = {
  id: '990f3807-cecb-4578-9fc3-67776ba492db',
  type: 'ApplicantType',
  letterRecipient: false,
  primaryApplicant: false,
  firstName: 'Jay',
  lastName: 'Smith',
  middleName: null,
  firmName: null,
  aNumber: null,
  ssn: '987654321',
  dateOfBirth: '1980-03-19',
  sex: null,
  email: null,
  contactAddressXref: {
    address: {
      foreignAddress: false,
      street: '911 Emergency Lane',
      aptSuiteFloor: null,
      city: null,
      state: null,
      zipCode: null,
      province: null,
      postalCode: null,
      country: null,
    },
  },
};

const contactInvalidDOB = { ...mockContactToEdit, dateOfBirth: '9999-11-11' };

const renderComponent = (mockData = mockContactToEdit, isCreate = false) => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/draft/preview/:id" element={<DraftPreview />} />

      <Route
        path="/contacts/:id"
        element={
          <AdminFormProvider>
            <ContactModal
              showModal
              setShowModal={() => jest.fn()}
              draftId="5966c446-51aa-49be-b0db-afcdee71e1ba"
              contactToEdit={mockData}
              onSubmit={() => jest.fn()}
              errorMessage=""
              onDelete={() => jest.fn()}
              isCreate={isCreate}
            />
          </AdminFormProvider>
        }
      />
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/contacts/:id'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

const mockStateApiCall = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/states`).reply(200, [{ id: '1', code: 'VA', name: 'Virginia' }]);
};

const mockSexesApiCall = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/sexes`).reply(200, [{ id: '2', code: 'F', name: 'Female' }]);
};

describe('Contact Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
    renderComponent();
  });

  it('displays no validation message for address fields when letter-recipient is unchecked', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.click(screen.getByTestId('submitContactButton'));

    const contactModalBody = screen.getByTestId('contactModalBody');

    await waitFor(() => {
      expect(contactModalBody).not.toHaveTextContent('Street Address is required!');
      expect(contactModalBody).not.toHaveTextContent('Postal Code is required!');
      expect(contactModalBody).not.toHaveTextContent('Country is required!');
      expect(contactModalBody).not.toHaveTextContent('City is required!');
      expect(contactModalBody).not.toHaveTextContent('State is required!');
      expect(contactModalBody).not.toHaveTextContent('A 5-digit ZIP Code is required!');
    });
  });

  it('displays correct validation message for usa address', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.click(screen.getByLabelText('Letter Recipient?'));
    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    let contactModalBody = screen.getByTestId('contactModalBody');
    await waitFor(() => {
      expect(contactModalBody).not.toHaveTextContent('Street Address is required!');

      // provided in mockContactModal
      expect(contactModalBody).not.toHaveTextContent('Postal Code is required!');
      expect(contactModalBody).not.toHaveTextContent('Country is required!');
      expect(contactModalBody).toHaveTextContent('City is required!');

      // always require for letter-recipient
      // TODO - State dropdown is populated with ""
      // expect(contactModalBody).toHaveTextContent('State is required!');
      expect(contactModalBody).toHaveTextContent('A 5-digit ZIP Code is required!');
    });

    // Fill in all required fields and test again.
    await userInstance.type(screen.getByLabelText('City'), 'Takoma Park');
    await userInstance.selectOptions(screen.getByLabelText('State'), '');
    await userInstance.type(screen.getByLabelText('ZIP Code'), '22221');
    const submitContactButton = screen.getByTestId('submitContactButton');
    await userInstance.click(submitContactButton.shadowRoot.querySelector('.dr-btn'));

    contactModalBody = screen.getByTestId('contactModalBody');
    await waitFor(() => {
      expect(contactModalBody).not.toHaveTextContent('City is required!');
      expect(contactModalBody).not.toHaveTextContent('State is required!');
      expect(contactModalBody).not.toHaveTextContent('A 5-digit ZIP Code is required!');
    });
  });

  it('displays correct validation message for foreign address', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.click(screen.getByLabelText('Letter Recipient?'));
    await userInstance.click(screen.getByTestId('foreignAddress'));
    const submitContactButton = screen.getByTestId('submitContactButton');
    await userInstance.click(submitContactButton.shadowRoot.querySelector('.dr-btn'));

    let contactModalBody = screen.getByTestId('contactModalBody');

    await waitFor(() => {
      expect(contactModalBody).not.toHaveTextContent('Street Address is required!');

      // provided in mockContactModal
      expect(contactModalBody).toHaveTextContent('Postal Code is required!');
      expect(contactModalBody).toHaveTextContent('Country is required!');
      expect(contactModalBody).toHaveTextContent('City is required!');

      // always require for letter-recipient
      expect(contactModalBody).not.toHaveTextContent('State is required!');
      expect(contactModalBody).not.toHaveTextContent('A 5-digit ZIP Code is required!');
    });

    // Fill in all required fields and test again.
    await userInstance.type(screen.getByLabelText('City'), 'Saigon');
    await userInstance.type(screen.getByLabelText('Postal Code'), '999911');
    await userInstance.type(screen.getByLabelText('Country'), 'Vietnam');
    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    contactModalBody = screen.getByTestId('contactModalBody');

    await waitFor(() => {
      expect(contactModalBody).not.toHaveTextContent('City is required!');
      expect(contactModalBody).not.toHaveTextContent('Postal Code is required!');
      expect(contactModalBody).not.toHaveTextContent('Country is required!');
    });
  });
});

describe('Contact Modal: Zipcode Field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
    renderComponent();
  });

  it('forces the field value to be 5 digits', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.type(screen.getByLabelText('ZIP Code'), '1234567890');
    await userInstance.click(screen.getByTestId('submitContactButton'));

    const zipFieldValue = screen.getByLabelText('ZIP Code').value;
    await waitFor(() => {
      expect(zipFieldValue).not.toBe('1234567890');
      expect(zipFieldValue).toBe('12345');
    });
  });

  it('displays correct validation message for none digits', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.type(screen.getByLabelText('ZIP Code'), 'ABC@#');
    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('contactModalBody')).toHaveTextContent('A 5-digit ZIP Code is required!');
    });
  });
});

describe('Validate SSN field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
  });

  it('displays validation message to the SSN entered', async () => {
    renderComponent();
    const userInstance = userEvent.setup();
    const ssnField = await screen.findByLabelText('Social Security Number');
    const contactModalBody = screen.getByTestId('contactModalBody');
    const { shadowRoot } = screen.getByTestId('submitContactButton');

    await userInstance.type(ssnField, '{backspace}abcdefgh9');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(contactModalBody).toHaveTextContent('Please provide 9 digits');

    await userInstance.type(ssnField, '{backspace}');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    expect(contactModalBody).not.toHaveTextContent('Please provide 9 digits');
  });

  it('displays a masked SSN for create', async () => {
    renderComponent(mockContactToEdit, true);
    const userInstance = userEvent.setup();
    const ssnField = await screen.findByLabelText('Social Security Number');
    await userInstance.type(ssnField, '{backspace}123456789');
    let ssnFieldValue = screen.getByTestId('ssnMasked').value;
    expect(ssnFieldValue).toBe('123456789');

    await userInstance.tab();
    ssnFieldValue = screen.getByTestId('ssnMasked').value;
    expect(ssnFieldValue).not.toBe('123456789');
    expect(ssnFieldValue).toBe('*****6789');
  });

  it('displays a masked SSN for update', async () => {
    renderComponent(mockContactToEdit, false);
    const userInstance = userEvent.setup();
    const ssnField = await screen.findByLabelText('Social Security Number');
    await userInstance.type(ssnField, '{backspace}123456789');
    let ssnFieldValue = screen.getByTestId('ssnMasked').value;
    expect(ssnFieldValue).toBe('123456789');

    await userInstance.tab();
    ssnFieldValue = screen.getByTestId('ssnMasked').value;
    expect(ssnFieldValue).not.toBe('123456789');
    expect(ssnFieldValue).toBe('*****6789');
  });
});

describe('A-Number field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
    renderComponent();
  });

  describe('Pass validation', () => {
    it('Passes for null string', async () => {
      const userInstance = userEvent.setup();
      await screen.findByLabelText('Role');
      await userInstance.click(screen.getByLabelText('A-Number'));

      await waitFor(() => expect(screen.getByLabelText('A-Number')).toHaveValue(''));

      const { shadowRoot } = screen.getByTestId('submitContactButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(screen.getByTestId('contactModalBody')).not.toHaveTextContent('Format: A-#########'));
    });

    it('Passes for 9 digits', async () => {
      const userInstance = userEvent.setup();
      await screen.findByLabelText('Role');
      await userInstance.type(screen.getByLabelText('A-Number'), '123456789');
      await waitFor(() => expect(screen.getByLabelText('A-Number')).toHaveValue('A-123456789'));

      const { shadowRoot } = screen.getByTestId('submitContactButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(screen.getByTestId('contactModalBody')).not.toHaveTextContent('Format: A-#########'));
    });
  });

  describe('Fail validation', () => {
    it('Does not pass for blank string with spaces', async () => {
      const userInstance = userEvent.setup();
      await screen.findByLabelText('Role');
      await userInstance.type(screen.getByLabelText('A-Number'), ' ');
      const { shadowRoot } = screen.getByTestId('submitContactButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(screen.getByTestId('contactModalBody')).toHaveTextContent('Format: A-#########'));
    });

    it('Does not pass for less than 9 digits', async () => {
      const userInstance = userEvent.setup();
      await screen.findByLabelText('Role');
      await userInstance.type(screen.getByLabelText('A-Number'), '123');
      const { shadowRoot } = screen.getByTestId('submitContactButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(screen.getByTestId('contactModalBody')).toHaveTextContent('Format: A-#########'));
    });

    it('Does not pass for format not A-#########', async () => {
      const userInstance = userEvent.setup();
      await screen.findByLabelText('Role');
      await userInstance.type(screen.getByLabelText('A-Number'), '%E1!@#2$');
      const { shadowRoot } = screen.getByTestId('submitContactButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      await waitFor(() => expect(screen.getByTestId('contactModalBody')).toHaveTextContent('Format: A-#########'));
    });
  });

  // verify backspace can delete everything including the 'A-'.
  it('Allows for backspacing', async () => {
    const aNumberField = await screen.findByLabelText('A-Number');
    await userEvent.type(aNumberField, '12');
    await expect(aNumberField).toHaveValue('A-12');

    await userEvent.type(aNumberField, '{backspace}{backspace}{backspace}');
    await expect(aNumberField).toHaveValue('');
  });
});

describe('Validates date of birth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
    renderComponent(contactInvalidDOB);
  });

  it('displays correct validation message for future date of birth', async () => {
    const userInstance = userEvent.setup();

    await screen.findByLabelText('Role');
    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.getByTestId('contactModalBody')).toHaveTextContent('Please enter past date'));
  });

  it('displays correct no validation message for past date of birth', async () => {
    const userInstance = userEvent.setup();

    await screen.findByLabelText('Role');
    await userInstance.type(screen.getByTestId('dateOfBirth'), '12112002');
    const { shadowRoot } = screen.getByTestId('submitContactButton');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.getByTestId('contactModalBody')).not.toHaveTextContent('Please enter past date'));
  });
});

describe('Alerts user before leaving ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateApiCall();
    mockSexesApiCall();
    renderComponent();
  });

  it('modal when cancel or X is clicked after form has changed', async () => {
    const userInstance = userEvent.setup();
    await screen.findByLabelText('Role');
    await userInstance.type(screen.getByLabelText('First Name'), 'AGENT');
    await userInstance.type(screen.getByLabelText('Last Name'), 'SMITH');

    const { shadowRoot } = screen.getByTestId('cancelSaveContact');
    await userInstance.click(shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).toBeInTheDocument);

    const negativeBtn = screen.getByTestId('negativeBtn');
    await userInstance.click(negativeBtn.shadowRoot.querySelector('.dr-btn'));
    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).not.toBeInTheDocument);

    const modalXBtn = screen.getByTestId('closeButtonModal');
    await userInstance.click(modalXBtn);
    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).toBeInTheDocument);

    const warningXBtn = screen.getByTestId('closeButtonModal');
    await userInstance.click(warningXBtn);
    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).not.toBeInTheDocument);
  });

  it('URL', async () => {
    // This test simulates when the URL changes which is only by the back button of the web browser
    const userInstance = userEvent.setup();
    await waitFor(() => expect(screen.queryByText(/Edit Contact/i)).toBeInTheDocument);
    await userInstance.click(screen.getByText('Test Link'));

    await waitFor(() => expect(screen.queryByText(/Leaving this "contact" form will erase all progress/i)).toBeInTheDocument);
  });
});
