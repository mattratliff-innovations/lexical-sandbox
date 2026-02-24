// eslint-disable-next-line import-x/no-namespace
import * as HelperFunctions from './CreateLetterHelperFunctions';
import { FILING_TYPE_DISPLAY_NAMES } from '../../constants/selectOptions';
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import fetchClassPreferencesForCase from '../../http/class_preferences';
import fetchFilingTypes from '../../http/filing_types';
import { fetchFormTypeByCode, fetchFormTypesForOrganization } from '../../http/form_types';
import { fetchHeader } from '../../http/headers';
import { fetchLetterTypesForCase } from '../../http/letter_types';
import fetchSourceSystems from '../../http/source_systems';
import { showToastError } from '../../utils/toastHelpers';

// Mock all HTTP modules
jest.mock('../../http/class_preferences');
jest.mock('../../http/filing_types');
jest.mock('../../http/form_types');
jest.mock('../../http/headers');
jest.mock('../../http/letter_types');
jest.mock('../../http/source_systems');
jest.mock('../../utils/toastHelpers');

HelperFunctions.copyHeaderDataAndHydrate = jest.fn((letter, header) => ({
  // return whatever minimal structure prepLetterFormData expects
  ...letter,
  header,
  headerId: header ? header.id : letter.headerId,
}));

describe('CreateLetterHelperFunctions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filingTypeDisplayName', () => {
    it('returns display name when filing type exists in mapping', () => {
      const firstKey = Object.keys(FILING_TYPE_DISPLAY_NAMES)[0];
      const result = HelperFunctions.filingTypeDisplayName(firstKey);
      expect(result).toBe(FILING_TYPE_DISPLAY_NAMES[firstKey]);
    });

    it('returns original value when filing type not in mapping', () => {
      const unknownType = 'UNKNOWN_TYPE';
      const result = HelperFunctions.filingTypeDisplayName(unknownType);
      expect(result).toBe(unknownType);
    });
  });

  describe('fetchCreateManualLetterInitialData', () => {
    it('calls all three fetch functions with correct parameters', async () => {
      const mockFormTypes = [{ id: 1, name: 'Form Type 1' }];
      const mockSourceSystems = { data: [{ id: 1, name: 'System 1' }] };
      const mockFilingTypes = { data: [{ id: 1, name: 'Filing Type 1' }] };

      fetchFormTypesForOrganization.mockResolvedValue(mockFormTypes);
      fetchSourceSystems.mockResolvedValue(mockSourceSystems);
      fetchFilingTypes.mockResolvedValue(mockFilingTypes);

      const organizationId = 'org-123';
      const parentCode = 'PARENT_CODE';

      const results = await HelperFunctions.fetchCreateManualLetterInitialData(organizationId, parentCode);

      expect(fetchFormTypesForOrganization).toHaveBeenCalledWith(organizationId);
      expect(fetchSourceSystems).toHaveBeenCalledWith(parentCode);
      expect(fetchFilingTypes).toHaveBeenCalled();
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
    });

    it('handles rejected promises gracefully', async () => {
      fetchFormTypesForOrganization.mockRejectedValue(new Error('Form types error'));
      fetchSourceSystems.mockResolvedValue({ data: [] });
      fetchFilingTypes.mockResolvedValue({ data: [] });

      const results = await HelperFunctions.fetchCreateManualLetterInitialData('org-123', 'PARENT_CODE');

      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('fetchCreateLetterInitialData', () => {
    it('calls all three fetch functions with correct parameters', async () => {
      const mockLetterTypes = [{ id: 1, name: 'Letter Type 1' }];
      const mockClassPreferences = [{ id: 1, name: 'Class Pref 1' }];
      const mockFormType = { id: 1, code: 'I-130' };

      fetchLetterTypesForCase.mockResolvedValue(mockLetterTypes);
      fetchClassPreferencesForCase.mockResolvedValue(mockClassPreferences);
      fetchFormTypeByCode.mockResolvedValue(mockFormType);

      const organizationId = 'org-123';
      const formTypeName = 'I-130';

      const results = await HelperFunctions.fetchCreateLetterInitialData(organizationId, formTypeName);

      expect(fetchLetterTypesForCase).toHaveBeenCalledWith(organizationId, formTypeName);
      expect(fetchClassPreferencesForCase).toHaveBeenCalledWith(formTypeName);
      expect(fetchFormTypeByCode).toHaveBeenCalledWith(formTypeName);
      expect(results).toHaveLength(3);
    });
  });

  describe('processLetterInitialDataResults', () => {
    it('processes all fulfilled results correctly', () => {
      const mockLetterTypes = [{ id: 1, name: 'Letter Type 1' }];
      const mockClassPreferences = [{ id: 1, name: 'Class Pref 1' }];
      const mockFormType = { id: 1, code: 'I-130' };

      const results = [
        { status: 'fulfilled', value: mockLetterTypes },
        { status: 'fulfilled', value: mockClassPreferences },
        { status: 'fulfilled', value: mockFormType },
      ];

      const { data, errors } = HelperFunctions.processLetterInitialDataResults(results);

      expect(data.allLetterTypes).toEqual(mockLetterTypes);
      expect(data.classPreferences).toEqual(mockClassPreferences);
      expect(data.formType).toEqual(mockFormType);
      expect(errors).toHaveLength(0);
    });

    it('handles rejected promises and returns appropriate errors', () => {
      const mockClassPreferences = [{ id: 1, name: 'Class Pref 1' }];

      const results = [
        { status: 'rejected', reason: 'Error' },
        { status: 'fulfilled', value: mockClassPreferences },
        { status: 'rejected', reason: 'Error' },
      ];

      const { data, errors } = HelperFunctions.processLetterInitialDataResults(results);

      expect(data.allLetterTypes).toBeNull();
      expect(data.classPreferences).toEqual(mockClassPreferences);
      expect(data.formType).toBeNull();
      expect(errors).toEqual(['Letter Types list', 'Form Type list']);
    });

    it('handles all rejected promises', () => {
      const results = [
        { status: 'rejected', reason: 'Error' },
        { status: 'rejected', reason: 'Error' },
        { status: 'rejected', reason: 'Error' },
      ];

      const { data, errors } = HelperFunctions.processLetterInitialDataResults(results);

      expect(data.allLetterTypes).toBeNull();
      expect(data.classPreferences).toBeNull();
      expect(data.formType).toBeNull();
      expect(errors).toEqual(['Letter Types list', 'Class Preferences list', 'Form Type list']);
    });
  });

  describe('processManualLetterInitialDataResults', () => {
    it('processes all fulfilled results correctly', () => {
      const mockFormTypes = [{ id: 1, name: 'Form Type 1' }];
      const mockSourceSystems = { data: [{ id: 1, name: 'System 1' }] };
      const mockFilingTypes = { data: [{ id: 1, name: 'Filing Type 1' }] };

      const results = [
        { status: 'fulfilled', value: mockFormTypes },
        { status: 'fulfilled', value: mockSourceSystems },
        { status: 'fulfilled', value: mockFilingTypes },
      ];

      const { data, errors } = HelperFunctions.processManualLetterInitialDataResults(results);

      expect(data.formTypes).toEqual(mockFormTypes);
      expect(data.sourceSystems).toEqual(mockSourceSystems);
      expect(data.filingTypes).toEqual(mockFilingTypes);
      expect(errors).toHaveLength(0);
    });

    it('handles rejected promises and returns appropriate errors', () => {
      const mockSourceSystems = { data: [{ id: 1, name: 'System 1' }] };

      const results = [
        { status: 'rejected', reason: 'Error' },
        { status: 'fulfilled', value: mockSourceSystems },
        { status: 'rejected', reason: 'Error' },
      ];

      const { data, errors } = HelperFunctions.processManualLetterInitialDataResults(results);

      expect(data.formTypes).toBeNull();
      expect(data.sourceSystems).toEqual(mockSourceSystems);
      expect(data.filingTypes).toBeNull();
      expect(errors).toEqual(['Form Types list', 'Filing Types list']);
    });
  });

  describe('filterLetterTypesByVawaCheckbox', () => {
    const mockLetterTypes = [
      { id: 1, name: 'Type 1', vawaCategory: { name: VAWA_ONLY } },
      { id: 2, name: 'Type 2', vawaCategory: { name: NON_VAWA_ONLY } },
      { id: 3, name: 'Type 3', vawaCategory: { name: VAWA_NON_VAWA } },
    ];

    it('filters to VAWA types when checkbox is checked', () => {
      const result = HelperFunctions.filterLetterTypesByVawaCheckbox(mockLetterTypes, true);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockLetterTypes[0]);
      expect(result).toContainEqual(mockLetterTypes[2]);
    });

    it('returns all types when checkbox is not checked', () => {
      const result = HelperFunctions.filterLetterTypesByVawaCheckbox(mockLetterTypes, false);
      expect(result).toEqual(mockLetterTypes);
    });
  });

  describe('getHeaderFromOrganization', () => {
    it('returns organization headerId when present', () => {
      const organization = {
        headerId: 'header-123',
        organizationHeaderLetterTypeXrefs: [{ header: { id: 'header-111' }, letterType: { id: 'lettertype-1' } }],
      };

      const result = HelperFunctions.getHeaderFromOrganization(organization, 'lettertype-1');
      expect(result).toBe('header-111');
    });

    it('returns organization headerId when when missing lettertype association', () => {
      const organization = {
        headerId: 'header-123',
        organizationHeaderLetterTypeXrefs: [{}],
      };

      const result = HelperFunctions.getHeaderFromOrganization(organization, null);
      expect(result).toBe('header-123');
    });
  });

  describe('loadLetterTypesHelper', () => {
    it('loads and filters letter types successfully', async () => {
      const mockLetterTypes = [
        { id: 1, name: 'Type 1', vawaCategory: { name: VAWA_ONLY } },
        { id: 2, name: 'Type 2', vawaCategory: { name: NON_VAWA_ONLY } },
      ];

      fetchLetterTypesForCase.mockResolvedValue(mockLetterTypes);

      const result = await HelperFunctions.loadLetterTypesHelper('I-130', 'org-123', false);

      expect(fetchLetterTypesForCase).toHaveBeenCalledWith('I-130', 'org-123');
      expect(result.allLetterTypes).toEqual(mockLetterTypes);
      expect(result.filteredLetterTypes).toEqual(mockLetterTypes);
    });

    it('handles errors and shows toast', async () => {
      fetchLetterTypesForCase.mockRejectedValue(new Error('Network error'));

      const result = await HelperFunctions.loadLetterTypesHelper('I-130', 'org-123', false);

      expect(showToastError).toHaveBeenCalledWith('There was an error retrieving the Letter Types list');
      expect(result.allLetterTypes).toEqual([]);
      expect(result.filteredLetterTypes).toEqual([]);
    });
  });

  describe('changeFormTypeHelper', () => {
    it('fetches and returns all required data', async () => {
      const mockLetterTypes = [{ id: 1, name: 'Type 1' }];
      const mockClassPreferences = [{ id: 1, name: 'Class Pref 1' }];

      fetchLetterTypesForCase.mockResolvedValue(mockLetterTypes);
      fetchClassPreferencesForCase.mockResolvedValue(mockClassPreferences);

      const formTypeValues = 'I-130|VAWA_ONLY';
      const result = await HelperFunctions.changeFormTypeHelper(formTypeValues, 'org-123', false);

      expect(result.selectedFormTypeCode).toBe('I-130');
      expect(result.selectedFormTypeVawa).toBe('VAWA_ONLY');
      expect(result.allLetterTypes).toEqual(mockLetterTypes);
      expect(result.filteredLetterTypes).toEqual(mockLetterTypes);
      expect(result.classPreferences).toEqual(mockClassPreferences);
    });

    it('handles errors gracefully', async () => {
      fetchLetterTypesForCase.mockRejectedValue(new Error('Network error'));

      const formTypeValues = 'I-130|VAWA_ONLY';
      const result = await HelperFunctions.changeFormTypeHelper(formTypeValues, 'org-123', false);

      expect(showToastError).toHaveBeenCalledWith('There was an error retrieving the Letter Types or Class Preferences list');
      expect(result.allLetterTypes).toEqual([]);
      expect(result.filteredLetterTypes).toEqual([]);
      expect(result.classPreferences).toEqual([]);
    });
  });

  describe('filterLetterTypesByFormTypeVawa', () => {
    const mockLetterTypes = [
      { id: 1, name: 'Type 1', vawaCategory: { name: VAWA_ONLY } },
      { id: 2, name: 'Type 2', vawaCategory: { name: NON_VAWA_ONLY } },
      { id: 3, name: 'Type 3', vawaCategory: { name: VAWA_NON_VAWA } },
    ];

    it('filters to VAWA_ONLY and VAWA_NON_VAWA when formTypeVawa is VAWA_ONLY', () => {
      const result = HelperFunctions.filterLetterTypesByFormTypeVawa(mockLetterTypes, VAWA_ONLY);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockLetterTypes[0]);
      expect(result).toContainEqual(mockLetterTypes[2]);
    });

    it('filters to NON_VAWA_ONLY and VAWA_NON_VAWA when formTypeVawa is NON_VAWA_ONLY', () => {
      const result = HelperFunctions.filterLetterTypesByFormTypeVawa(mockLetterTypes, NON_VAWA_ONLY);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockLetterTypes[1]);
      expect(result).toContainEqual(mockLetterTypes[2]);
    });

    it('returns all types when formTypeVawa is neither VAWA_ONLY nor NON_VAWA_ONLY', () => {
      const result = HelperFunctions.filterLetterTypesByFormTypeVawa(mockLetterTypes, VAWA_NON_VAWA);
      expect(result).toEqual(mockLetterTypes);
    });

    it('returns all types when formTypeVawa is undefined', () => {
      const result = HelperFunctions.filterLetterTypesByFormTypeVawa(mockLetterTypes, undefined);
      expect(result).toEqual(mockLetterTypes);
    });
  });

  describe('prepManualLetterFormData', () => {
    it('prepares form data correctly', async () => {
      const mockHeader = { id: 'header-123', content: 'Header content' };
      const mockOrganization = {
        headerId: 'header-123',
        organizationHeaderLetterTypeXrefs: [],
      };

      fetchHeader.mockResolvedValue(mockHeader);

      const data = {
        includedStdParagraphsInput: ['para-1', 'para-2'],
        vawa: 'true',
      };

      const location = {
        state: {
          createLetterObj: {
            registration: {
              receiptNumber: 'RCP123456',
            },
          },
        },
      };

      const currentUser = { defaultOrg: 'org-123' };

      const result = await HelperFunctions.prepManualLetterFormData(
        data,
        mockOrganization,
        location,
        'I-130',
        'letter-type-456',
        currentUser,
        'source-system-789',
        'FILING_TYPE_NAME'
      );

      expect(fetchHeader).toHaveBeenCalledWith('header-123');
      expect(result).toEqual({
        registrationAttributes: {
          id: null,
          receiptNumber: 'RCP123456',
          formTypeName: 'I-130',
        },
        id: null,
        headerId: 'header-123',
        header: mockHeader,
        letterTypeId: 'letter-type-456',
        organizationId: 'org-123',
        manualCreation: true,
        standardParagraphIds: ['para-1', 'para-2'],
        vawa: 'true',
        sourceSystemId: 'source-system-789',
        filingTypeAttributes: {
          name: 'FILING_TYPE_NAME',
        },
      });
    });
  });

  describe('prepLetterFormData', () => {
    it('prepares form data correctly with all transformations', async () => {
      const mockHeader = { id: 'header-123', content: 'Header content' };
      const mockOrganization = {
        headerId: null,
        organizationHeaderLetterTypeXrefs: [
          {
            letterType: { id: 'letter-type-456' },
            header: { id: 'header-from-xref' },
          },
        ],
      };

      fetchHeader.mockResolvedValue(mockHeader);

      const data = {
        letterTypeId: 'letter-type-456',
        includedStdParagraphsInput: ['para-1', 'para-2'],
        vawa: 'true',
        letterCategoryHacId: 'hac-123',
      };

      const location = {
        state: {
          createLetterObj: {
            headerId: null,
            registration: { id: 'reg-123', receiptNumber: 'RCP123456' },
            petitionerType: {
              id: 'pet-123',
              address: { street: '123 Main St' },
            },
            representativeType: {
              id: 'rep-123',
              address: { street: '456 Oak Ave' },
            },
            applicantTypes: [
              { id: 'app-1', address: { street: '789 Elm St' } },
              { id: 'app-2', address: { street: '321 Pine St' } },
            ],
            filingType: { name: 'FILING_TYPE' },
            otherField: 'value',
          },
        },
      };

      const currentUser = { defaultOrg: 'org-123' };

      HelperFunctions.copyHeaderDataAndHydrate = jest.fn((letter, header) => ({
        // return whatever minimal structure prepLetterFormData expects
        ...letter,
        header,
        headerId: header ? header.id : letter.headerId,
      }));

      const result = await HelperFunctions.prepLetterFormData(data, mockOrganization, location, currentUser);

      expect(result.registrationAttributes).toEqual({ id: 'reg-123', receiptNumber: 'RCP123456' });
      expect(result.petitionerTypeAttributes.addressAttributes).toEqual({ street: '123 Main St' });
      expect(result.petitionerTypeAttributes.address).toBeUndefined();
      expect(result.representativeTypeAttributes.addressAttributes).toEqual({ street: '456 Oak Ave' });
      expect(result.representativeTypeAttributes.address).toBeUndefined();
      expect(result.applicantTypesAttributes).toHaveLength(2);
      expect(result.applicantTypesAttributes[0].addressAttributes).toEqual({ street: '789 Elm St' });
      expect(result.applicantTypesAttributes[0].address).toBeUndefined();
      expect(result.letterTypeId).toBe('letter-type-456');
      expect(result.organizationId).toBe('org-123');
      expect(result.vawa).toBe('true');
      expect(result.letterCategoryHacId).toBe('hac-123');
      expect(result.standardParagraphIds).toEqual(['para-1', 'para-2']);
      expect(result.filingTypeAttributes).toEqual({ name: 'FILING_TYPE' });
      expect(result.registration).toBeUndefined();
      expect(result.applicantTypes).toBeUndefined();
      expect(result.petitionerType).toBeUndefined();
      expect(result.representativeType).toBeUndefined();
      expect(result.filingType).toBeUndefined();
    });

    it('handles null petitioner and representative', async () => {
      const mockOrganization = {
        headerId: 'header-123',
        organizationHeaderLetterTypeXrefs: [],
      };

      const data = {
        letterTypeId: 'letter-type-456',
        includedStdParagraphsInput: [],
        vawa: 'false',
      };

      const location = {
        state: {
          createLetterObj: {
            headerId: 'header-123',
            registration: { id: 'reg-123' },
            petitionerType: null,
            representativeType: null,
            applicantTypes: [],
            filingType: {},
          },
        },
      };

      const currentUser = { defaultOrg: 'org-123' };

      const result = await HelperFunctions.prepLetterFormData(data, mockOrganization, location, currentUser);

      expect(result.petitionerTypeAttributes).toBeNull();
      expect(result.representativeTypeAttributes).toBeNull();
      expect(result.applicantTypesAttributes).toHaveLength(0);
    });
  });
});
