import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ToastContainer } from 'react-toastify';

import {
  classPreferencesData,
  filingTypesData,
  formTypesData,
  letterTypesData,
  sourceSystemsData,
  standardParagraphData,
} from './CreateLetterTestData';
import CreateLetterWithStdParagraphClassPref from './CreateLetterWithStdParagraphClassPrefTest';
import CreateManualLetter from './CreateManualLetter';
import { currentUser, setCurrentUser } from '../../../testSetup/currentUserHelper';
import { AppContext } from '../../AppProvider';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';
import waitForLoadingToFinish from '../../testUtils/waitForLoadingToFinish';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const RECEIPT_NUMBER = 'WAC1234567890';

const mockSourceSystemsApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/source_systems?parent_code=SCRIBE-API`).reply(200, returnData);
};

const mockFilingTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/filing_types`).reply(200, returnData);
};

const mockFormTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/form_types/available_form_types_for_organization`).reply(200, returnData);
};

const mockLetterTypesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letter_types/letter_types_for_case`).reply(200, returnData);
};

const mockClassPreferencesApiCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/class_preferences/class_preferences_for_case`).reply(200, returnData);
};

const mockSourceSystemsApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/source_systems`).reply(422);
};

const mockFilingTypesApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/filing_types`).reply(422);
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
  vawa: true,
  source_system_id: sourceSystemsData.data[1].id,
  filing_type_attributes: {
    name: filingTypesData.data[0].attributes.name,
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
      mockSourceSystemsApiCall(sourceSystemsData);
      mockFilingTypesApiCall(filingTypesData);
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

      await userInstance.selectOptions(
        await screen.findByLabelText('Select Source System'),
        `${sourceSystemsData.data[1].id}|${sourceSystemsData.data[1].attributes.child_code}`
      );
      await userInstance.selectOptions(await screen.findByLabelText('Select Filing Type'), filingTypesData.data[0].attributes.name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Letter Type'), letterTypesData[0].name);

      const { shadowRoot } = screen.getByTestId('createLetterButton');
      userInstance.click(shadowRoot.querySelector('.dr-btn'));

      expect(await screen.findByText('The draft letter was created successfully!')).toBeInTheDocument();

      // Verify Mock API calls
      expect(mockAxios.history.get.length).toEqual(10);
      expect(mockAxios.history.post.length).toEqual(1);
      const postedData = JSON.parse(mockAxios.history.post[0].data);

      expect(postedData).toEqual(expected);
    });

    it('displays an unsuccessful message', async () => {
      renderComponent();

      const userInstance = userEvent.setup();
      const returnData = { error: 'Unable to create Draft Letter: Letter type must exist' };
      mockCreateApiCallError(returnData);

      await userInstance.selectOptions(
        await screen.findByLabelText('Select Source System'),
        `${sourceSystemsData.data[1].id}|${sourceSystemsData.data[1].attributes.child_code}`
      );
      await userInstance.selectOptions(await screen.findByLabelText('Select Filing Type'), filingTypesData.data[0].attributes.name);
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

  describe('Source Systems List', () => {
    beforeEach(() => {
      mockSourceSystemsApiCallError();
    });

    it('displays Source Systems List error', async () => {
      renderComponent();

      expect(await screen.findByText('There was an error retrieving the Source Systems list')).toBeInTheDocument();
    });
  });

  describe('Filing Types List', () => {
    beforeEach(() => {
      mockSourceSystemsApiCall(sourceSystemsData);
    });

    it('displays Filing Types List error', async () => {
      mockFilingTypesApiCallError();
      renderComponent();
      const userInstance = userEvent.setup();

      await userInstance.selectOptions(
        await screen.findByLabelText('Select Source System'),
        `${sourceSystemsData.data[1].id}|${sourceSystemsData.data[1].attributes.child_code}`
      );

      expect(await screen.findByText('There was an error retrieving the Filing Types list')).toBeInTheDocument();
    });

    describe('behavior', () => {
      beforeEach(() => {
        mockFilingTypesApiCall(filingTypesData);
      });

      it('disabled when selected Source System is ELIS', async () => {
        renderComponent();
        const userInstance = userEvent.setup();
        const printOnlyFilingTypeValue = 'PAPER';

        // Select ELIS from the Source Systems list
        await userInstance.selectOptions(
          await screen.findByLabelText('Select Source System'),
          `${sourceSystemsData.data[0].id}|${sourceSystemsData.data[0].attributes.child_code}`
        );
        const filingTypeSelect = screen.getByTestId('filingTypeId');
        expect(filingTypeSelect).toBeDisabled();
        expect(filingTypeSelect.value).toEqual(printOnlyFilingTypeValue);
      });

      it('enabled when select Source System is not ELIS', async () => {
        renderComponent();
        const userInstance = userEvent.setup();

        // Select C3 (non ELIS source system) from the Source Systems list
        await userInstance.selectOptions(
          await screen.findByLabelText('Select Source System'),
          `${sourceSystemsData.data[1].id}|${sourceSystemsData.data[1].attributes.child_code}`
        );
        const filingTypeSelect = screen.getByTestId('filingTypeId');
        expect(filingTypeSelect).not.toBeDisabled();
      });
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
      mockSourceSystemsApiCall(sourceSystemsData);
      mockFilingTypesApiCall(filingTypesData);
      mockFormTypesApiCall(formTypesData);
      mockLetterTypesApiCall(letterTypesData);
    });

    it('displays Standard Paragraphs', async () => {
      renderComponent();
      await waitForLoadingToFinish();

      const userInstance = userEvent.setup();
      mockAvailableStdParagraphsLetterTypeApiCall(standardParagraphData);

      const noParagraphsMessage = 'No Associated Standard Paragraphs';
      expect(screen.getByText(noParagraphsMessage)).toBeInTheDocument();
      standardParagraphData.forEach((paragraph) => {
        expect(screen.queryByText(paragraph.code)).not.toBeInTheDocument();
      });

      await userInstance.selectOptions(
        await screen.findByLabelText('Select Source System'),
        `${sourceSystemsData.data[1].id}|${sourceSystemsData.data[1].attributes.child_code}`
      );
      await userInstance.selectOptions(await screen.findByLabelText('Select Filing Type'), filingTypesData.data[0].attributes.name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Form Type'), formTypesData[0].name);
      await userInstance.selectOptions(await screen.findByLabelText('Choose Letter Type'), letterTypesData[0].name);

      await waitFor(() => {
        expect(screen.queryByText(noParagraphsMessage)).not.toBeInTheDocument();
        standardParagraphData.forEach((paragraph) => {
          expect(screen.getByText(`${paragraph.name} | ${paragraph.code}`)).toBeInTheDocument();
        });
      });
    });

    describe('VAWA TESTS', () => {
      beforeEach(() => {
        mockSourceSystemsApiCall(sourceSystemsData);
        mockFilingTypesApiCall(filingTypesData);
        mockFormTypesApiCall(formTypesData);
        mockLetterTypesApiCall(letterTypesData);
        renderComponent();
      });

      const selectSourceSystem = async (sourceSystemIndex) => {
        const userInstance = userEvent.setup();
        const sourceSystem = sourceSystemsData.data[sourceSystemIndex];
        const selectedSourceSystemValue = `${sourceSystem.id}|${sourceSystem.attributes.child_code}`;
        await userInstance.selectOptions(await screen.findByLabelText(/Select Source System/i), selectedSourceSystemValue);
      };

      const selectFilingType = async (filingTypeIndex) => {
        const userInstance = userEvent.setup();
        await userInstance.selectOptions(await screen.findByLabelText(/Select Filing Type/i), filingTypesData.data[filingTypeIndex].attributes.name);
      };

      const selectFormType = async (formTypeIndex) => {
        const userInstance = userEvent.setup();
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Form Type/i), formTypesData[formTypeIndex].name);
      };

      const selectLetterType = async (letterTypeIndex) => {
        const userInstance = userEvent.setup();
        await userInstance.selectOptions(await screen.findByLabelText(/Choose Letter Type/i), letterTypesData[letterTypeIndex].name);
      };

      const clickCreateLetterButton = async () => {
        const userInstance = userEvent.setup();
        const { shadowRoot } = screen.getByTestId('createLetterButton');
        await userInstance.click(shadowRoot.querySelector('.dr-btn'));
      };

      const assertPostedData = (expectedData) => {
        const parsedPostedData = JSON.parse(mockAxios.history.post[0].data);
        expect(parsedPostedData).toEqual(expectedData);
      };

      const createExpectedVawaData = (formTypeIndex, letterTypeIndex, vawaValue) => ({
        ...expected,
        registration_attributes: {
          form_type_name: formTypesData[formTypeIndex].code,
          id: null,
          receipt_number: 'WAC1234567890',
        },
        letter_type_id: letterTypesData[letterTypeIndex].id,
        vawa: vawaValue,
      });

      const selectSourceFilingAndFormOnly = async (indexes) => {
        const [system, filing, form] = indexes;

        await waitForLoadingToFinish();
        await selectSourceSystem(system);
        await selectFilingType(filing);
        await selectFormType(form);
      };

      const selectAllFieldsAndClickButton = async (indexes) => {
        const [system, filing, form, letter] = indexes;

        await selectSourceFilingAndFormOnly([system, filing, form]);
        await selectLetterType(letter);
        await clickCreateLetterButton();
      };

      describe('FormType is VAWA_ONLY', () => {
        const sourceSystemIndex = 1;
        const filingTypeIndex = 0;
        const formTypeIndex = 0; // VAWA_ONLY

        it('submits vawa as true for VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 0; // VAWA_ONLY letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, true);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('does not show the NON_VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 1; // 2nd letterTypesData is NON_VAWA_ONLY
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const dropdown = await screen.findByLabelText(/Choose Letter Type/i);
          expect(within(dropdown).queryByText(letterTypesData[letterTypeIndex].name)).not.toBeInTheDocument();
        });

        it('submits vawa as true for VAWA_NON_VAWA letter-type', async () => {
          const letterTypeIndex = 2; // 3rd letterTypesData is VAWA_NON_VAWA
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, true);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('shows the vawa checkbox as checked & disabled', async () => {
          // 1st formTypesData is VAWA_ONLY
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const checkbox = screen.getByTestId('vawa-display');
          expect(checkbox).toBeChecked();
          expect(checkbox).toBeDisabled();
        });
      });

      describe('FormType is NON_VAWA_ONLY', () => {
        const sourceSystemIndex = 1;
        const filingTypeIndex = 0;
        const formTypeIndex = 1; // NON_VAWA_ONLY

        it('submits vawa as false for NON_VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 1; // NON_VAWA_ONLY letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, false);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('does not show the VAWA_ONLY letter-type', async () => {
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const dropdown = await screen.findByLabelText(/Choose Letter Type/i);
          expect(within(dropdown).queryByText(letterTypesData[0].name)).not.toBeInTheDocument(); // VAWA_ONLY letter type
        });

        it('submits vawa as false for VAWA_NON_VAWA letter-type', async () => {
          const letterTypeIndex = 2; // VAWA_NON_VAWA letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, false);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('shows the vawa checkbox as unchecked & disabled', async () => {
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const checkbox = screen.getByTestId('vawa-display');
          expect(checkbox).not.toBeChecked();
          expect(checkbox).toBeDisabled();
        });
      });

      describe('FormType is VAWA_NON_VAWA and Filter by VAWA not checked', () => {
        const sourceSystemIndex = 1;
        const filingTypeIndex = 0;
        const formTypeIndex = 2; // VAWA_NON_VAWA

        it('submits vawa as true for VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 0; // VAWA_ONLY letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, true);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('submits vawa as false for NON_VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 1; // NON_VAWA_ONLY letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, false);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('submits vawa as false for VAWA_NON_VAWA letter-type', async () => {
          const letterTypeIndex = 2; // VAWA_NON_VAWA letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, false);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('shows the vawa checkbox as unchecked & enabled', async () => {
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const checkbox = screen.getByTestId('vawa-display');
          expect(checkbox).not.toBeChecked();
          expect(checkbox).not.toBeDisabled();
        });
      });

      describe('FormType is VAWA_NON_VAWA and Filter by VAWA is checked', () => {
        const sourceSystemIndex = 1;
        const filingTypeIndex = 0;
        const formTypeIndex = 2; // VAWA_NON_VAWA

        const selectAllFieldsCheckVAWAFilterAndClickButton = async (indexes) => {
          const [source, filing, form, letter] = indexes;

          await selectSourceFilingAndFormOnly([source, filing, form]);
          await userEvent.click(screen.getByTestId('vawa-display'));
          await selectLetterType(letter);
          await clickCreateLetterButton();
        };

        it('submits vawa as true for VAWA_ONLY letter-type', async () => {
          const letterTypeIndex = 0; // VAWA_ONLY letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, true);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsCheckVAWAFilterAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('does not show the NON_VAWA_ONLY letter-type', async () => {
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          await userEvent.click(screen.getByTestId('vawa-display'));
          const dropdown = await screen.findByLabelText(/Choose Letter Type/i);
          expect(within(dropdown).queryByText(letterTypesData[1].name)).not.toBeInTheDocument(); // NON_VAWA_ONLY letter type
        });

        it('submits vawa as true for VAWA_NON_VAWA letter-type', async () => {
          const letterTypeIndex = 2; // VAWA_NON_VAWA letter type
          const expectedVawa = createExpectedVawaData(formTypeIndex, letterTypeIndex, true);
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex, letterTypeIndex];

          await selectAllFieldsCheckVAWAFilterAndClickButton(listIndexes);
          assertPostedData(expectedVawa);
        });

        it('shows the vawa checkbox as unchecked & enabled', async () => {
          const listIndexes = [sourceSystemIndex, filingTypeIndex, formTypeIndex];

          await selectSourceFilingAndFormOnly(listIndexes);
          const checkbox = screen.getByTestId('vawa-display');
          expect(checkbox).not.toBeChecked();
          expect(checkbox).not.toBeDisabled();
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
    sourceSystemsData,
    filingTypesData,
    mockFormTypesApiCall,
    mockSourceSystemsApiCall,
    mockFilingTypesApiCall
  );
});

describe('without location state data', () => {
  beforeEach(() => {
    mockSourceSystemsApiCall(sourceSystemsData);
    mockFilingTypesApiCall(filingTypesData);
    mockFormTypesApiCall(formTypesData);
    mockLetterTypesApiCall(letterTypesData);
    mockedUseLocation.mockImplementation(() => ({ state: null }));
  });

  it('redirects the user home and does not throw exceptions', async () => {
    renderComponent();

    expect(mockedUseNavigate).toHaveBeenCalledWith('/search');
  });
});
