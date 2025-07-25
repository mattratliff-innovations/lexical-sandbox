import * as React from 'react';
import { render, waitFor, within, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { AppContext } from '../../AppProvider';
import { currentUser, setCurrentUser } from '../../../testSetup/currentUserHelper';
import CreateLetter from './CreateLetter';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import CreateLetterWithStdParagraphClassPref from './CreateLetterWithStdParagraphClassPrefTest';
import {
  letterTypesData,
  classPreferencesData,
  standardParagraphData,
  inPageParagraph1,
  inPageParagraph2,
  inPageParagraph3,
} from './CreateLetterTestData';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockLetterTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(200, returnData);
};

const mockLetterTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(422);
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
        state: 'WI',
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
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall([]);
      mockCreateApiCall({});
    });

    it('modifies form data for submittal', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();

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
        organization_id: organization,
        standard_paragraph_ids: [],
      };

      await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/), letterTypesData[0].name);
      const { shadowRoot } = screen.getByTestId('createLetterButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();

      const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);

      expect(parsedPostedData).toEqual(expected);
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
      mockLetterTypesApiCall(letterTypesData);
      mockCreateApiCall({});
    });

    it('displays Standard Paragraphs', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);
      mockAvailableStdParagraphsClassPrefApiCall([]);

      const noParagraphsMessage = 'No Associated Standard Paragraphs';
      expect(screen.queryByText(noParagraphsMessage)).toBeInTheDocument();
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
    null
  );
});
