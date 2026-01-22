import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ToastContainer } from 'react-toastify';

import CreateLetter from './CreateLetter';
import {
  classPreferencesData,
  formTypesData,
  inPageParagraph1,
  inPageParagraph2,
  inPageParagraph3,
  letterTypesData,
  standardParagraphData,
} from './CreateLetterTestData';
import CreateLetterWithStdParagraphClassPref from './CreateLetterWithStdParagraphClassPrefTest';
import { currentUser, setCurrentUser } from '../../../testSetup/currentUserHelper';
import { AppContext } from '../../AppProvider';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockLetterTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(200, returnData);
};

const mockLetterTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(422);
};

const mockFormTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/form_type_by_code`).reply(200, returnData);
};

const mockFormTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/form_type_by_code`).reply(422);
};

const mockClassPreferencesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/class_preferences_for_case`).reply(200, returnData);
};

const mockClassPreferencesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/class_preferences_for_case`).reply(422);
};

const mockCreateApiCall = (returnData) => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/letters/`).reply(200, returnData);
};

const mockCreateApiCallError = (returnData) => {
  mockAxios.onPost(`${APP_API_ENDPOINT}/letters/`).reply(422, returnData);
};

const mockAvailableStdParagraphsLetterTypeApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_letter_type`).reply(200, returnData);
};

const mockAvailableStdParagraphsClassPrefApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/standard_paragraphs/available_standard_paragraphs_form_class_preference`).reply(200, returnData);
};

const renderComponent = () => {
  render(
    <>
      <ToastContainer />
      <AppContext.Provider value={{ currentUser, setCurrentUser }}>
        <CreateLetter />
      </AppContext.Provider>
    </>
  );
};

const mockUseLocationStateObj = {
  registration: {
    id: null,
    formTypeName: 'I-131',
    receiptNumber: 'WAC1234567890',
    createdAt: null,
    updatedAt: null,
  },
  applicantTypes: [
    {
      firstName: 'David',
      lastName: 'Smith',
      address: {
        id: null,
        street: '188 MAIN ST',
        aptSuiteFloor: null,
        city: 'BAY VIEW',
        state: {
          id: '3b929e74-2307-4288-accc-a725e5d5954c',
          code: 'WI',
          name: 'Wisconsin',
          created_at: '2025-07-23T19:47:52.323Z',
          updated_at: '2025-07-23T19:47:52.323Z',
        },
        zipCode: '53207',
        province: null,
        postalCode: null,
        country: null,
        createdAt: null,
        updatedAt: null,
        preAddress: null,
        nickname: null,
        foreignAddress: false,
        type: 'AddressContactType',
      },
    },
  ],
  petitionerType: {
    firstName: 'Pet',
    address: {
      id: null,
      street: '123 Fake Street',
      type: 'AddressContactType',
    },
  },
  organizationId: null,
  representativeType: {
    firstName: 'Rep',
    address: {
      id: null,
      street: '321 Real Street',
      type: 'AddressContactType',
    },
  },
  filingType: {
    id: null,
    name: 'PAPER',
  },
};

const { registration } = mockUseLocationStateObj;
const applicantType = mockUseLocationStateObj.applicantTypes[0];
const { address } = applicantType;
const { petitionerType } = mockUseLocationStateObj;
const petAddress = petitionerType.address;
const { representativeType } = mockUseLocationStateObj;
const repAddress = representativeType.address;
const organization = currentUser.defaultOrg;
const expected = {
  registration_attributes: {
    id: registration.id,
    form_type_name: registration.formTypeName,
    receipt_number: registration.receiptNumber,
    created_at: registration.createdAt,
    updated_at: registration.updatedAt,
  },
  applicant_types_attributes: [
    {
      first_name: applicantType.firstName,
      last_name: applicantType.lastName,
      address_attributes: {
        id: address.id,
        street: address.street,
        apt_suite_floor: address.aptSuiteFloor,
        city: address.city,
        state: address.state,
        zip_code: address.zipCode,
        province: address.province,
        postal_code: address.postalCode,
        country: address.country,
        created_at: address.createdAt,
        updated_at: address.updatedAt,
        pre_address: address.preAddress,
        nickname: address.nickname,
        foreign_address: address.foreignAddress,
        type: address.type,
      },
    },
  ],
  letter_type_id: letterTypesData[0].id,
  petitioner_type_attributes: {
    first_name: petitionerType.firstName,
    address_attributes: {
      id: petAddress.id,
      street: petAddress.street,
      type: petAddress.type,
    },
  },
  representative_type_attributes: {
    first_name: representativeType.firstName,
    address_attributes: {
      id: repAddress.id,
      street: repAddress.street,
      type: repAddress.type,
    },
  },
  filing_type_attributes: {
    id: null,
    name: 'PAPER',
  },
  organization_id: organization,
  standard_paragraph_ids: [],
  vawa: 'false',
  letter_category_hac_id: '',
};

// Mock navigate
const mockedUseNavigate = jest.fn();
const mockedUseLocation = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockedUseLocation(),
  useNavigate: () => mockedUseNavigate,
}));

describe('With location state', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockedUseLocation.mockImplementation(() => ({
      state: { createLetterObj: mockUseLocationStateObj },
    }));
  });

  describe('CreateLetter', () => {
    beforeEach(() => {
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall(classPreferencesData);
    });

    it('displays Letters', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('Create New Letter')).toBeInTheDocument();
      expect(await screen.findByText(`Form ${mockUseLocationStateObj.registration.formTypeName}`)).toBeInTheDocument();
      expect(await screen.findByText(letterTypesData[0].name)).toBeInTheDocument();
    });

    it('displays a successful message', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();
      mockCreateApiCall({});

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
      const { shadowRoot } = screen.getByTestId('createLetterButton');

      userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();
      expect(mockAxios.history.post.length).toEqual(1);
      const formData = mockAxios.history.post[0].data;
      expect(formData).toEqual(expect.stringContaining('organization_id'));
      expect(formData).toEqual(expect.stringContaining(currentUser.defaultOrg));
    });

    it('displays an unsuccessful message', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();
      const returnData = {
        error: 'Unable to create Draft Letter: Letter type must exist',
      };
      mockCreateApiCallError(returnData);
      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);

      const { shadowRoot } = screen.getByTestId('createLetterButton');
      userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(async () => {
        expect(screen.getByTestId('post-error')).toHaveTextContent(returnData.error);
      });
    });

    it('redirects on cancel', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText(letterTypesData[0].name)).toBeInTheDocument();

      const { shadowRoot } = screen.getByTestId('cancelButton');
      fireEvent.click(shadowRoot.querySelector('.dr-btn'));

      expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
    });
  });

  describe('API List Error', () => {
    it('displays Form Type error', async () => {
      mockFormTypesApiCallError();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('There was an error retrieving the Form Type')).toBeInTheDocument();
    });

    it('displays Letter Types List error', async () => {
      mockLetterTypesApiCallError();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('There was an error retrieving the Letter Types list')).toBeInTheDocument();
    });

    it('displays Letter Types List error', async () => {
      mockClassPreferencesApiCallError();
      renderComponent();
      await waitForLoadingToFinish();

      expect(await screen.findByText('There was an error retrieving the Class Preferences list')).toBeInTheDocument();
    });
  });

  describe('prepFormData', () => {
    beforeEach(() => {
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall([]);
      mockCreateApiCall({});
    });

    it('modifies form data for submittal', async () => {
      const userInstance = userEvent.setup();

      renderComponent();
      await waitForLoadingToFinish();

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
      const { shadowRoot } = screen.getByTestId('createLetterButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();

      const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);

      expect(parsedPostedData).toEqual(expected);
    });
  });

  describe('Vawa FormType and Vawa LetterTypes', () => {
    beforeEach(() => {
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall([]);
      mockCreateApiCall({});
    });

    describe('FormType is VAWA_ONLY', () => {
      beforeEach(() => {
        mockFormTypesApiCall(formTypesData[0]); // first one is VAWA_ONLY
      });

      it('submits vawa as true for VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[0].id,
          vawa: true,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });

      it('does not show the NON_VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.click(screen.getByTestId('vawa-display'));
        const dropdown = await screen.findByLabelText(/Choose Letter Type/);
        expect(within(dropdown).queryByText(letterTypesData[1].name)).not.toBeInTheDocument();
      });

      it('submits vawa as true for VAWA_NON_VAWA letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[2].id,
          vawa: true,
        };

        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[2].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });
    });

    describe('FormType is NON_VAWA_ONLY', () => {
      beforeEach(() => {
        mockFormTypesApiCall(formTypesData[1]); // second one is NON_VAWA_ONLY
      });

      it('does not show the VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.click(screen.getByTestId('vawa-display'));
        const dropdown = await screen.findByLabelText(/Choose Letter Type/);
        expect(within(dropdown).queryByText(letterTypesData[0].name)).not.toBeInTheDocument();
      });

      it('submits vawa as false for NON_VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[1].id,
          vawa: false,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[1].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });

      it('submits vawa as false for VAWA_NON_VAWA letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[2].id,
          vawa: false,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[2].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });
    });

    describe('FormType is VAWA_NON_VAWA and Filter by VAWA not checked', () => {
      beforeEach(() => {
        mockFormTypesApiCall(formTypesData[2]); // third one is VAWA_NON_VAWA
      });

      it('submits vawa as true for VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[0].id,
          vawa: true,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });

      it('submits vawa as false for NON_VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[1].id,
          vawa: false,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[1].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });

      it('submits vawa as false for VAWA_NON_VAWA letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[2].id,
          vawa: false,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[2].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });
    });

    describe('FormType is VAWA_NON_VAWA and Filter by VAWA is checked', () => {
      beforeEach(() => {
        mockFormTypesApiCall(formTypesData[2]); // third one is VAWA_NON_VAWA
      });

      it('submits vawa as true for VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[0].id,
          vawa: true,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.click(screen.getByTestId('vawa-display'));
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });

      it('does not show the NON_VAWA_ONLY letter-type', async () => {
        const userInstance = userEvent.setup();
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.click(screen.getByTestId('vawa-display'));
        const dropdown = await screen.findByLabelText(/Choose Letter Type/);
        expect(within(dropdown).queryByText(letterTypesData[1].name)).not.toBeInTheDocument();
      });

      it('submits vawa as true for VAWA_NON_VAWA letter-type', async () => {
        const userInstance = userEvent.setup();
        const expectedVawa = {
          ...expected,
          letter_type_id: letterTypesData[2].id,
          vawa: true,
        };
        renderComponent();
        await waitForLoadingToFinish();

        await userInstance.click(screen.getByTestId('vawa-display'));
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[2].name);
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedVawa);
      });
    });
  });

  describe('without location state data', () => {
    beforeEach(() => {
      mockedUseLocation.mockImplementation(() => ({ state: null }));
    });

    it('redirects the user home and does not throw exceptions', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
    });
  });

  describe('Standard Paragraph', () => {
    beforeEach(() => {
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
      mockCreateApiCall({});
    });

    it('displays Standard Paragraphs', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      mockAvailableStdParagraphsClassPrefApiCall([]);

      const noParagraphsMessage = 'No Associated Standard Paragraphs';
      expect(screen.getByText(noParagraphsMessage)).toBeInTheDocument();
      standardParagraphData.forEach((paragraph) => {
        expect(screen.queryByText(`${paragraph.name} | ${paragraph.code}`)).not.toBeInTheDocument();
      });

      await userEvent.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);

      await waitFor(() => {
        expect(screen.queryByText(noParagraphsMessage)).not.toBeInTheDocument();
        standardParagraphData.forEach((paragraph) => {
          expect(screen.getByText(`${paragraph.name} | ${paragraph.code}`)).toBeInTheDocument();
        });
      });
    });

    it('submits with Standard Paragraphs', async () => {
      renderComponent();
      await waitForLoadingToFinish();
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      mockAvailableStdParagraphsClassPrefApiCall([]);
      const userInstance = userEvent.setup();

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));
      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));
      const { shadowRoot } = screen.getByTestId('createLetterButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();

      const postedData = JSON.parse(mockAxios.history.post[0].data);
      expect(postedData.standard_paragraph_ids).toEqual([standardParagraphData[0].id, standardParagraphData[2].id]);
    });

    it('shows standard-paragraphs without class preference', async () => {
      renderComponent();
      await waitForLoadingToFinish();
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      mockAvailableStdParagraphsClassPrefApiCall([]);
      const userInstance = userEvent.setup();

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);

      let availableParagraphDiv = screen.queryByTestId('available-standard-paragraphs-div');
      expect(await within(availableParagraphDiv).findByText(inPageParagraph1)).toBeInTheDocument();
      expect(await within(availableParagraphDiv).findByText(inPageParagraph2)).toBeInTheDocument();
      expect(await within(availableParagraphDiv).findByText(inPageParagraph3)).toBeInTheDocument();

      let includedParagraphDiv = screen.queryByTestId('included-standard-paragraphs-div');
      expect(includedParagraphDiv).toBeNull();

      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[0].id}`));
      await userInstance.click(screen.getByTestId(`available-standard-paragraph-${standardParagraphData[2].id}`));

      includedParagraphDiv = screen.getByTestId('included-standard-paragraphs-div');
      expect(await within(includedParagraphDiv).findByText(inPageParagraph1)).toBeInTheDocument();
      expect(within(includedParagraphDiv).queryByText(inPageParagraph2)).not.toBeInTheDocument();
      expect(await within(includedParagraphDiv).findByText(inPageParagraph3)).toBeInTheDocument();

      availableParagraphDiv = screen.getByTestId('available-standard-paragraphs-div');
      expect(within(availableParagraphDiv).queryByText(inPageParagraph1)).not.toBeInTheDocument();
      expect(await within(availableParagraphDiv).findByText(inPageParagraph2)).toBeInTheDocument();
      expect(within(availableParagraphDiv).queryByText(inPageParagraph3)).not.toBeInTheDocument();
    });
  });

  describe('Choose HAC options', () => {
    beforeEach(() => {
      mockLetterTypesApiCall(letterTypesData);
    });

    it('disables the dropdown when isLetterCategoryHacDisabled is true', async () => {
      // Render the component with isLetterCategoryHacDisabled set to true
      renderComponent();

      // Wait for any loading to finish if applicable
      await waitForLoadingToFinish();

      // Get the dropdown element
      const dropdown = screen.getByTestId('letterCategoryHacId');

      // Assert that the dropdown is disabled
      expect(dropdown).toBeDisabled();
    });

    it('enables the dropdown when isLetterCategoryHacIds are present and letter category is reguest for evidence', async () => {
      // Render the component with isLetterCategoryHacDisabled set to true
      renderComponent();

      // Wait for any loading to finish if applicable
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[3].id);

      // Wait for the dropdown to be enabled
      await waitFor(() => {
        const dropdown = screen.getByTestId('letterCategoryHacId');
        expect(dropdown).not.toBeDisabled();
      });
    });

    it('renders no options if letterCategoryHacIds is empty', async () => {
      renderComponent();

      // Wait for any loading to finish if applicable
      await waitForLoadingToFinish();

      const select = screen.getByTestId('letterCategoryHacId');
      // Check that the default option is shown
      expect(select).toHaveValue(''); // The value of the default option is an empty string
      expect(select).toHaveTextContent('--- Select HAC ---'); // The default option text is rendered
    });

    it('disables the dropdown when isLetterCategoryHacDisabled is false and letterCategoryHacIds are not available', async () => {
      // Render the component with isLetterCategoryHacDisabled set to false
      renderComponent();

      // Wait for any loading to finish if applicable
      await waitForLoadingToFinish();

      const dropdown = screen.getByTestId('letterCategoryHacId');

      expect(dropdown).toBeDisabled();
    });
  });

  // Import the reusable tests
  CreateLetterWithStdParagraphClassPref(
    mockLetterTypesApiCall,
    mockClassPreferencesApiCall,
    mockCreateApiCall,
    mockAvailableStdParagraphsLetterTypeApiCall,
    mockAvailableStdParagraphsClassPrefApiCall,
    renderComponent,
    standardParagraphData,
    letterTypesData,
    classPreferencesData,
    null,
    null,
    null,
    mockFormTypesApiCall
  );
});
