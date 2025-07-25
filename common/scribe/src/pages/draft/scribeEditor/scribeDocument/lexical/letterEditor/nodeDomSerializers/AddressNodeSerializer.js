import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';
import { RECIPIENT_ADDRESS_SEARCH_TEXT } from '../../../ScribeDocumentConstants';

export const CONTACT_FIRM_NAME_KEY = 'data-contact-firm-name';
export const CONTACT_FIRST_NAME_KEY = 'data-contact-first-name';
export const CONTACT_MIDDLE_NAME_KEY = 'data-contact-middle-name';
export const CONTACT_LAST_NAME_KEY = 'data-contact-last-name';
export const CONTACT_ID_KEY = 'data-contact-id';
export const CONTACT_IN_CARE_OF_KEY = 'data-contact-in-care-of';

const CONTACT_KEY_MAPPING = {
  [CONTACT_FIRM_NAME_KEY]: 'firmName',
  [CONTACT_FIRST_NAME_KEY]: 'firstName',
  [CONTACT_MIDDLE_NAME_KEY]: 'middleName',
  [CONTACT_LAST_NAME_KEY]: 'lastName',
  [CONTACT_ID_KEY]: 'id',
  [CONTACT_IN_CARE_OF_KEY]: 'inCareOf',
};

export const KEY_MAPPING_TYPE = 'recipient-address';
export const FOREIGN_ADDRESS_KEY_MAPPING_VALUE = 'foreignAddress';

export const generateAddressKeyMapping = (type) => ({
  [`data-${type}-nickname`]: 'nickname',
  [`data-${type}-pre-address`]: 'preAddress',
  [`data-${type}-street`]: 'street',
  [`data-${type}-apt-suite-floor`]: 'aptSuiteFloor',
  [`data-${type}-city`]: 'city',
  [`data-${type}-state`]: 'state',
  [`data-${type}-zip-code`]: 'zipCode',
  [`data-${type}-foreign-address`]: FOREIGN_ADDRESS_KEY_MAPPING_VALUE,
  [`data-${type}-postal-code`]: 'postalCode',
  [`data-${type}-country`]: 'country',
  [`data-${type}-province`]: 'province',
});

export const getKeyFromValue = (type, value) => {
  const keyMapping = generateAddressKeyMapping(type);
  return Object.keys(keyMapping).find((k) => keyMapping[k] === value);
};

export const ADDRESS_TYPE = 'addressType';

export const createAddressFromDom = (domNode, keyMappingType) => {
  const address = {};
  const keyMap = generateAddressKeyMapping(keyMappingType);
  Object.entries(keyMap).forEach(([domKey, objectKey]) => {
    address[objectKey] = domNode.getAttribute(domKey);
  });

  const ADDRESS_FOREIGN_ADDRESS_KEY = getKeyFromValue(KEY_MAPPING_TYPE, FOREIGN_ADDRESS_KEY_MAPPING_VALUE);
  address[FOREIGN_ADDRESS_KEY_MAPPING_VALUE] = domNode.getAttribute(ADDRESS_FOREIGN_ADDRESS_KEY) === 'true';

  return address;
};

export const createContactFromDom = (domNode) => {
  const contact = {};
  Object.entries(CONTACT_KEY_MAPPING).forEach(([domKey, objectKey]) => {
    contact[objectKey] = domNode.getAttribute(domKey);
  });

  contact.address = createAddressFromDom(domNode, KEY_MAPPING_TYPE);
  return contact;
};

export const valueWithNewLineOrEmpty = (value, lineBreak) => (value ? value + lineBreak : '');

export const foreignAddressSuffix = (address, lineBreak) => {
  const { city, postalCode, country, province } = address;
  return `${city} ${province || ''} ${postalCode}${lineBreak} ${country}`;
};

export const domesticAddressSuffix = (address) => {
  if (!address) {
    return '';
  }

  const { city, state, zipCode } = address;
  return `${city}, ${state?.code} ${zipCode}`;
};

const serializeAddress = (contact, { lineBreak = null }) => {
  const inCareOfPrefix = 'C/O'.concat(' ');

  if (!contact) {
    return RECIPIENT_ADDRESS_SEARCH_TEXT;
  }

  const { firmName, firstName, middleName, lastName, address, inCareOf } = contact;
  const { preAddress, street, aptSuiteFloor, foreignAddress } = address || {};

  if (!contact.firstName) {
    return RECIPIENT_ADDRESS_SEARCH_TEXT;
  }

  return (
    `${firstName} ${middleName || ''} ${lastName}${lineBreak}${
      inCareOf ? inCareOfPrefix + valueWithNewLineOrEmpty(inCareOf, lineBreak) : ''
    }${valueWithNewLineOrEmpty(firmName, lineBreak)}${valueWithNewLineOrEmpty(preAddress, lineBreak)}${street} ${aptSuiteFloor || ''}${lineBreak}` +
    `${foreignAddress ? foreignAddressSuffix(address, lineBreak) : domesticAddressSuffix(address, lineBreak)}`
  );
};

const contactToHtml = (contact) => serializeAddress(contact, { lineBreak: '<br/>' });

export const contactToText = (contact) => serializeAddress(contact, { lineBreak: '\n' });

export const serializeToHtml = (span, contact) => {
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, ADDRESS_TYPE);
  if (!contact) {
    return;
  }
  Object.entries(CONTACT_KEY_MAPPING).forEach(([domKey, objectKey]) => {
    if (contact[objectKey]) span.setAttribute(domKey, contact[objectKey]);
  });
  const { address } = contact;

  if (!address) return;

  const keyMap = generateAddressKeyMapping(KEY_MAPPING_TYPE);

  Object.entries(keyMap).forEach(([domKey, objectKey]) => {
    if (objectKey === 'state' && address[objectKey]) {
      span.setAttribute(domKey, address[objectKey]?.code);
    } else if (address[objectKey]) span.setAttribute(domKey, address[objectKey]);
  });

  const ADDRESS_FOREIGN_ADDRESS_KEY = getKeyFromValue(KEY_MAPPING_TYPE, FOREIGN_ADDRESS_KEY_MAPPING_VALUE);
  span.setAttribute(ADDRESS_FOREIGN_ADDRESS_KEY, address[FOREIGN_ADDRESS_KEY_MAPPING_VALUE]);

  const innerHtml = contactToHtml(contact);
  // See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
  // eslint-disable-next-line no-param-reassign
  span.innerHTML = innerHtml;
};

export const findDraftContact = (draft, options = {}) => {
  if (options.recipientId) {
    const contactRecipient = draft.contacts.find((contact) => contact.id === options.recipientId);
    if (contactRecipient) return contactRecipient;
  }

  const { representativeType, petitionerType, applicantTypes } = draft;
  // Letter recipients precedence: 1)representative 2)petitioner 3)primary-applicant 4)none-primary-applicant
  const recipient = [representativeType, petitionerType].find((obj) => obj && obj.letterRecipient);
  const primaryApp = applicantTypes.find((app) => app && app.letterRecipient && app.primaryApplicant);
  const nonPrimaryApp = applicantTypes.find((app) => app && app.letterRecipient && !app.primaryApplicant);
  if (recipient) {
    return recipient;
  }
  if (primaryApp) {
    return primaryApp;
  }
  if (nonPrimaryApp) {
    return nonPrimaryApp;
  }
  return null;
};
