/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import { FILING_TYPE_DISPLAY_NAMES } from '../../constants/selectOptions';
import { NON_VAWA_ONLY, VAWA_NON_VAWA, VAWA_ONLY } from '../../constants/vawa';
import fetchClassPreferencesForCase from '../../http/class_preferences';
import fetchFilingTypes from '../../http/filing_types';
import { fetchFormTypeByCode, fetchFormTypesForOrganization } from '../../http/form_types';
import { fetchHeader } from '../../http/headers';
import { fetchLetterTypesForCase } from '../../http/letter_types';
import fetchSourceSystems from '../../http/source_systems';
import { showToastError } from '../../utils/toastHelpers';
import { copyHeaderDataAndHydrate } from '../draft/LetterUtil';

/**
 * Retrieves the filing type display name
 * @param {filingtype} value
 * @returns filing type display name
 */
export const filingTypeDisplayName = (value) => {
  const expectedFilingType = Object.keys(FILING_TYPE_DISPLAY_NAMES).find((type) => type === value);
  if (expectedFilingType) {
    return FILING_TYPE_DISPLAY_NAMES[value];
  }
  return value;
};

/**
 * CreateManualLetter: Fetches all initial data needed for manual letter creation
 * Gets form types for the org, source systems, and filing types
 * Returns individual results with status for error handling
 */
export const fetchCreateManualLetterInitialData = async (organizationId, parentCode) =>
  Promise.allSettled([fetchFormTypesForOrganization(organizationId), fetchSourceSystems(parentCode), fetchFilingTypes()]);

/**
 * CreateLetter: Fetches all initial data needed for letter creation
 * Gets the letter types for the form, class preferences, and form type
 * Returns individual results with status for error handling
 */
export const fetchCreateLetterInitialData = async (organizationId, formTypeName) =>
  Promise.allSettled([
    fetchLetterTypesForCase(organizationId, formTypeName),
    fetchClassPreferencesForCase(formTypeName),
    fetchFormTypeByCode(formTypeName),
  ]);

/**
 * Processes the results from fetchCreateLetterInitialData
 * Returns data and any errors that occurred
 */
export const processLetterInitialDataResults = (results) => {
  const data = {
    allLetterTypes: null,
    classPreferences: null,
    formType: null,
  };

  const errors = [];

  if (results[0].status === 'fulfilled') {
    data.allLetterTypes = results[0].value;
  } else {
    errors.push('Letter Types list');
  }
  if (results[1].status === 'fulfilled') {
    data.classPreferences = results[1].value;
  } else {
    errors.push('Class Preferences list');
  }
  if (results[2].status === 'fulfilled') {
    data.formType = results[2].value;
  } else {
    errors.push('Form Type list');
  }

  return { data, errors };
};

/**
 * Processes the results from fetchCreateManualLetterInitialData
 * Returns data and any errors that occurred
 */
export const processManualLetterInitialDataResults = (results) => {
  const data = {
    formTypes: null,
    sourceSystems: null,
    filingTypes: null,
  };

  const errors = [];

  if (results[0].status === 'fulfilled') {
    data.formTypes = results[0].value;
  } else {
    errors.push('Form Types list');
  }
  if (results[1].status === 'fulfilled') {
    data.sourceSystems = results[1].value;
  } else {
    errors.push('Source Systems list');
  }
  if (results[2].status === 'fulfilled') {
    data.filingTypes = results[2].value;
  } else {
    errors.push('Filing Types list');
  }

  return { data, errors };
};

/**
 * Filters letter types based on VAWA category and checkbox state
 */
export const filterLetterTypesByVawaCheckbox = (allLetterTypes, isVawaChecked) => {
  if (isVawaChecked) {
    return allLetterTypes.filter((item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA);
  }
  return allLetterTypes;
};

/**
 * Gets the header for the organization
 * Uses default if available otherwise gets the header form the chosen letter type
 * @param {*} organization
 * @returns header id
 */
export const getHeaderFromOrganization = (organization, letterTypeId) => {
  let { headerId } = organization;

  const xrefs = organization.organizationHeaderLetterTypeXrefs.find((xref) => xref.letterType?.id === letterTypeId);
  if (xrefs) {
    headerId = xrefs.header.id;
  }
  return headerId;
};

/**
 * Gets the list of letter types
 * @param {*} formType
 * @param {*} organizationId
 * @param {*} isVawaChecked
 * @returns array of all letter types and filtered letter types
 */
export async function loadLetterTypesHelper(formType, organizationId, isVawaChecked) {
  try {
    const data = await fetchLetterTypesForCase(formType, organizationId);
    const filtered = filterLetterTypesByVawaCheckbox(data, isVawaChecked);
    return { allLetterTypes: data, filteredLetterTypes: filtered };
  } catch (error) {
    showToastError('There was an error retrieving the Letter Types list');
    return { allLetterTypes: [], filteredLetterTypes: [] };
  }
}

export async function changeFormTypeHelper(formTypeValues, currentUserDefaultOrg, isVawaChecked) {
  const [selectedFormTypeCode, selectedFormTypeVawa] = formTypeValues.split('|');
  let allLetterTypes = [];
  let filteredLetterTypes = [];
  let classPreferences = [];
  try {
    allLetterTypes = await fetchLetterTypesForCase(currentUserDefaultOrg, selectedFormTypeCode);
    filteredLetterTypes = filterLetterTypesByVawaCheckbox(allLetterTypes, isVawaChecked);
    classPreferences = await fetchClassPreferencesForCase(selectedFormTypeCode);
  } catch (error) {
    showToastError('There was an error retrieving the Letter Types or Class Preferences list');
  }
  return {
    selectedFormTypeCode,
    selectedFormTypeVawa,
    allLetterTypes,
    filteredLetterTypes,
    classPreferences,
  };
}

/**
 * Filters the letter types by VAWA status
 * @param {*} allLetterTypesList
 * @param {*} formTypeVawa
 * @returns letter types
 */
export function filterLetterTypesByFormTypeVawa(allLetterTypesList, formTypeVawa) {
  if (formTypeVawa === VAWA_ONLY) {
    return allLetterTypesList.filter((item) => item.vawaCategory?.name === VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA);
  }
  if (formTypeVawa === NON_VAWA_ONLY) {
    return allLetterTypesList.filter((item) => item.vawaCategory?.name === NON_VAWA_ONLY || item.vawaCategory?.name === VAWA_NON_VAWA);
  }
  return allLetterTypesList;
}

/**
 * Creates a data object for CreateManualLetter
 * @param {*} data
 * @param {*} organization
 * @param {*} location
 * @param {*} formTypeCode
 * @param {*} letterTypeIdSelected
 * @param {*} currentUser
 * @param {*} sourceSystemId
 * @param {*} filingTypeName
 * @returns formatted data object for letter
 */
export async function prepManualLetterFormData(
  draft,
  organization,
  location,
  formTypeCode,
  letterTypeIdSelected,
  currentUser,
  sourceSystemId,
  filingTypeName,
  letterCategoryHacId,
  classPreferenceIdSelected
) {
  draft.headerId = getHeaderFromOrganization(organization, letterTypeIdSelected);
  draft.header = await fetchHeader(draft.headerId);
  draft = copyHeaderDataAndHydrate(draft);

  return {
    registrationAttributes: {
      id: null,
      receiptNumber: location.state.createLetterObj.registration.receiptNumber,
      formTypeName: formTypeCode,
    },
    id: null,
    headerId: draft.headerId,
    header: draft.header,
    letterTypeId: letterTypeIdSelected,
    organizationId: currentUser.defaultOrg,
    classPreferenceId: classPreferenceIdSelected,
    manualCreation: true,
    standardParagraphIds: draft.includedStdParagraphsInput,
    vawa: draft.vawa,
    sourceSystemId,
    letterCategoryHacId,
    filingTypeAttributes: {
      name: filingTypeName,
    },
  };
}

/**
 * Creates a data object for CreateLetter
 * @param {*} data
 * @param {*} organization
 * @param {*} location
 * @param {*} currentUser
 * @returns formatted data object for letter
 */
export async function prepLetterFormData(data, organization, location, currentUser) {
  // Deep clone the createLetterObj from location.state
  let draft = JSON.parse(JSON.stringify(location.state.createLetterObj));

  // Assign the header based on the header used in the organization
  if (draft.headerId === null) {
    draft.headerId = getHeaderFromOrganization(organization, data.letterTypeId); // assumes getHeaderFromOrganization is imported
    draft.header = await fetchHeader(draft.headerId); // assumes fetchHeader is imported
  }
  draft = copyHeaderDataAndHydrate(draft);

  // Transform petitioner address
  const newPetitioner = draft.petitionerType;
  if (newPetitioner) {
    newPetitioner.addressAttributes = draft.petitionerType?.address;
    delete newPetitioner.address;
  }

  // Transform representative address
  const newRepresentative = draft.representativeType;
  if (newRepresentative) {
    newRepresentative.addressAttributes = draft.representativeType?.address;
    delete newRepresentative.address;
  }

  // Transform applicant addresses
  const applicantTypesAttributes = draft.applicantTypes.map((applicant) => {
    const newApplicant = { ...applicant };
    newApplicant.addressAttributes = newApplicant.address;
    delete newApplicant.address;
    return newApplicant;
  });

  // Build the API-friendly object
  const apiFriendlyHash = {
    registrationAttributes: draft.registration,
    applicantTypesAttributes,
    petitionerTypeAttributes: newPetitioner,
    representativeTypeAttributes: newRepresentative,
    standardParagraphIds: data.includedStdParagraphsInput,
    filingTypeAttributes: draft.filingType,
    ...draft,
  };

  // Remove unnecessary properties
  ['registration', 'applicantTypes', 'petitionerType', 'representativeType', 'filingType'].forEach((prop) => {
    delete apiFriendlyHash[prop];
  });

  // Add/override required properties
  apiFriendlyHash.letterTypeId = data.letterTypeId;
  apiFriendlyHash.organizationId = currentUser.defaultOrg;
  apiFriendlyHash.vawa = data.vawa;
  apiFriendlyHash.letterCategoryHacId = data.letterCategoryHacId;

  return apiFriendlyHash;
}
