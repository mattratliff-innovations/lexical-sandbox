import * as React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { AppContext } from '../../AppProvider';
import { currentUser, setCurrentUser } from '../../../testSetup/currentUserHelper';
import CreateManualLetter from './CreateManualLetter';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import CreateLetterWithStdParagraphClassPref from './CreateLetterWithStdParagraphClassPrefTest';
import { formTypesData, letterTypesData, classPreferencesData, standardParagraphData } from './CreateLetterTestData';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const RECEIPT_NUMBER = 'WAC1234567890';

const mockFormTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/available_form_types_for_organization`).reply(200, returnData);
};

const mockLetterTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(200, returnData);
};

const mockClassPreferencesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/class_preferences_for_case`).reply(200, returnData);
};

const mockFormTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/`).reply(422);
};

const mockLetterTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(422);
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
        <CreateManualLetter />
      </AppContext.Provider>
    </>
  );
};

const mockUseLocationStateObj = {
  registration: {
    receiptNumber: RECEIPT_NUMBER,
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
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
      mockClassPreferencesApiCall([]);
    });

    it('displays a successful message', async () => {
      renderComponent();

      const userInstance = userEvent.setup();
      mockCreateApiCall({});

      expect(await screen.findByText('Create Letter Manually')).toBeInTheDocument();
      expect(await screen.findByText(`Receipt Number ${mockUseLocationStateObj.registration.receiptNumber}`)).toBeInTheDocument();
      expect(await screen.findByText(formTypesData[0].name)).toBeInTheDocument();

      const alertshadowRoot = screen.getByTestId('druid-alert-container').querySelector('dr-alert').shadowRoot;
      const druidAlert = alertshadowRoot.querySelector('.dr-root-container');
      expect(druidAlert).toHaveTextContent('All fields marked with a red asterisk (*) are required.');

      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Letter Type'), letterTypesData[0].name);

      const { shadowRoot } = screen.getByTestId('createLetterButton');
      userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();

      // Verify Mock API calls
      expect(mockAxios.history.get.length).toEqual(8);
      expect(mockAxios.history.post.length).toEqual(1);
      const postedData = JSON.parse(mockAxios.history.post[0].data);
      const expected = {
        registration_attributes: {
          id: null,
          receipt_number: mockUseLocationStateObj.registration.receiptNumber,
          form_type_name: formTypesData[0].code,
        },
        id: null,
        letter_type_id: letterTypesData[0].id,
        organization_id: currentUser.defaultOrg,
        manual_creation: true,
        standard_paragraph_ids: [],
      };

      expect(postedData).toEqual(expected);
    });

    it('displays an unsuccessful message', async () => {
      renderComponent();

      const userInstance = userEvent.setup();
      const returnData = { error: 'Unable to create Draft Letter: Letter type must exist' };
      mockCreateApiCallError(returnData);

      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Letter Type'), letterTypesData[0].name);

      const { shadowRoot } = screen.getByTestId('createLetterButton');
      userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(async () => {
        expect(screen.getByTestId('post-error')).toHaveTextContent(returnData.error);
      });
    });

    it('redirects on cancel', async () => {
      renderComponent();

      expect(await screen.findByText('Create Letter Manually')).toBeInTheDocument();

      const { shadowRoot } = screen.getByTestId('cancelButton');
      fireEvent.click(shadowRoot.querySelector('.dr-btn'));

      expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
    });
  });

  describe('Form Types List', () => {
    beforeEach(() => {
      mockFormTypesApiCallError();
    });

    it('displays Form Types List error', async () => {
      renderComponent();

      expect(await screen.findByText('There was an error retrieving the Form Types list')).toBeInTheDocument();
    });
  });

  describe('LetterTypesApi & ClassPreferencesApi Error', () => {
    beforeEach(() => {
      mockFormTypesApiCall(formTypesData);
    });

    it('displays Letter Types List error', async () => {
      renderComponent();
      mockLetterTypesApiCallError();

      const userInstance = userEvent.setup();
      expect(await screen.findByText('Create Letter Manually')).toBeInTheDocument();
      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      expect(await screen.findByText('There was an error retrieving the Letter Types list')).toBeInTheDocument();
    });

    it('displays Class Preferences List error', async () => {
      renderComponent();
      mockClassPreferencesApiCallError();

      const userInstance = userEvent.setup();
      expect(await screen.findByText('Create Letter Manually')).toBeInTheDocument();
      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      expect(await screen.findByText('There was an error retrieving the Class Preferences list')).toBeInTheDocument();
    });
  });

  describe('Standard Paragraph', () => {
    beforeEach(() => {
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
    });

    it('displays Standard Paragraphs', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);

      const noParagraphsMessage = 'No Associated Standard Paragraphs';
      expect(screen.queryByText(noParagraphsMessage)).toBeInTheDocument();
      standardParagraphData.forEach((paragraph) => {
        expect(screen.queryByText(paragraph.code)).not.toBeInTheDocument();
      });

      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Letter Type'), letterTypesData[0].name);

      await waitFor(() => {
        expect(screen.queryByText(noParagraphsMessage)).not.toBeInTheDocument();
        standardParagraphData.forEach((paragraph) => {
          expect(screen.getByText(`${paragraph.name} | ${paragraph.code}`)).toBeInTheDocument();
        });
      });
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
    formTypesData,
    mockFormTypesApiCall
  );
});

describe('without location state data', () => {
  beforeEach(() => {
    mockFormTypesApiCall(formTypesData);
    mockLetterTypesApiCall(letterTypesData);
    mockedUseLocation.mockImplementation(() => ({ state: null }));
  });

  it('redirects the user home and does not throw exceptions', async () => {
    renderComponent();

    expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
  });
});
