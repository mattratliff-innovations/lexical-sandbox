import {
  ADDRESS_TYPE,
  CONTACT_FIRM_NAME_KEY,
  CONTACT_FIRST_NAME_KEY,
  CONTACT_ID_KEY,
  CONTACT_IN_CARE_OF_KEY,
  CONTACT_LAST_NAME_KEY,
  CONTACT_MIDDLE_NAME_KEY,
  createContactFromDom,
  findDraftContact,
  foreignAddressSuffix,
  getKeyFromValue,
  invalidContact,
  KEY_MAPPING_TYPE,
  resolveCareOf,
  serializeAddress,
  serializeToHtml,
} from './AddressNodeSerializer';
import draft from '../../../../../../../../cypress/fixtures/scribeEditor/draft';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';

const recipientId = '38881ede-5081-45e6-bd4a-ec8028021890';

const ADDRESS_PRE_ADDRESS_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'preAddress');
const ADDRESS_STREET_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'street');
const ADDRESS_APT_SUITE_FLOOR_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'aptSuiteFloor');
const ADDRESS_CITY_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'city');
const ADDRESS_STATE_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'state');
const ADDRESS_ZIP_CODE_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'zipCode');
const ADDRESS_FOREIGN_ADDRESS_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'foreignAddress');
const ADDRESS_POSTAL_CODE_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'postalCode');
const ADDRESS_COUNTRY_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'country');
const ADDRESS_PROVINCE_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'province');

describe('createContactFromDom', () => {
  it('sets contact data from the span', () => {
    const spanHtml =
      `<span ${CONTACT_IN_CARE_OF_KEY}="In Care Of" ${CONTACT_FIRM_NAME_KEY}="Firm Name" ${CONTACT_FIRST_NAME_KEY}="Standard" ` +
      `${CONTACT_MIDDLE_NAME_KEY}="Letter" ${CONTACT_LAST_NAME_KEY}="Recipient" ` +
      `${CONTACT_ID_KEY}="${recipientId}" ${ADDRESS_STREET_KEY}="42 Adams Way" ` +
      `${ADDRESS_CITY_KEY}="San Fernando" ${ADDRESS_STATE_KEY}="CA" ${ADDRESS_ZIP_CODE_KEY}="98765" ` +
      `${CUSTOM_NODE_TYPE_KEY}="addressType" ${ADDRESS_PRE_ADDRESS_KEY}="preAddress" ` +
      `${ADDRESS_APT_SUITE_FLOOR_KEY}="aptSuiteFloor" ${ADDRESS_FOREIGN_ADDRESS_KEY}="false" ` +
      `${ADDRESS_POSTAL_CODE_KEY}="54321" ${ADDRESS_COUNTRY_KEY}="MEX" ` +
      `${ADDRESS_PROVINCE_KEY}="province"/>`;
    const parser = new DOMParser();
    const parsedHtml = parser.parseFromString(spanHtml, 'text/html');
    const spanDom = parsedHtml.getElementsByTagName('span')[0];

    const result = createContactFromDom(spanDom);

    expect(result.inCareOf).toBe('In Care Of');
    expect(result.firmName).toBe('Firm Name');
    expect(result.firstName).toBe('Standard');
    expect(result.middleName).toBe('Letter');
    expect(result.lastName).toBe('Recipient');
    expect(result.id).toBe(recipientId);
    const { address } = result;
    expect(address.street).toBe('42 Adams Way');
    expect(address.city).toBe('San Fernando');
    expect(address.state).toBe('CA');
    expect(address.zipCode).toBe('98765');
    expect(address.preAddress).toBe('preAddress');
    expect(address.aptSuiteFloor).toBe('aptSuiteFloor');
    expect(address.foreignAddress).toBe(false);
    expect(address.postalCode).toBe('54321');
    expect(address.country).toBe('MEX');
    expect(address.province).toBe('province');
  });
});

describe('serializeToHtml', () => {
  it('sets the contact data in the span', () => {
    const contact = findDraftContact(draft);
    const span = document.createElement('span');

    serializeToHtml(span, contact);

    expect(span.getAttribute(CONTACT_IN_CARE_OF_KEY)).toBe(contact.inCareOf);
    expect(span.getAttribute(CONTACT_FIRM_NAME_KEY)).toBe(contact.firmName);
    expect(span.getAttribute(CONTACT_FIRST_NAME_KEY)).toBe(contact.firstName);
    expect(span.getAttribute(CONTACT_MIDDLE_NAME_KEY)).toBe(contact.middleName);
    expect(span.getAttribute(CONTACT_LAST_NAME_KEY)).toBe(contact.lastName);
    expect(span.getAttribute(CONTACT_ID_KEY)).toBe(recipientId);
    expect(span.getAttribute(ADDRESS_STREET_KEY)).toBe(contact.address.street);
    expect(span.getAttribute(ADDRESS_CITY_KEY)).toBe(contact.address.city);
    expect(span.getAttribute(ADDRESS_STATE_KEY)).toBe(contact.address.state.code);
    expect(span.getAttribute(ADDRESS_ZIP_CODE_KEY)).toBe(contact.address.zipCode);
    expect(span.getAttribute(ADDRESS_PRE_ADDRESS_KEY)).toBe(contact.address.preAddress);
    expect(span.getAttribute(ADDRESS_APT_SUITE_FLOOR_KEY)).toBe(contact.address.aptSuiteFloor);
    expect(span.getAttribute(ADDRESS_FOREIGN_ADDRESS_KEY)).toBe(String(contact.address.foreignAddress));
    expect(span.getAttribute(ADDRESS_POSTAL_CODE_KEY)).toBe(contact.address.postalCode);
    expect(span.getAttribute(ADDRESS_COUNTRY_KEY)).toBe(contact.address.country);
    expect(span.getAttribute(ADDRESS_PROVINCE_KEY)).toBe(contact.address.province);
    expect(span.innerHTML.indexOf(contact.firstName) === 0).toBe(true);
  });

  it('returns an empty string if the contact is null', () => {
    const span = document.createElement('span');

    serializeToHtml(span, null);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(ADDRESS_TYPE);
  });
});

describe('findDraftContact', () => {
  it('finds the main copy', () => {
    const result = findDraftContact(draft);

    expect(result.id).toBe(recipientId);
  });
});

describe('foreignAddressSuffix', () => {
  it('returns the full address when all fields are provided', () => {
    const address = { city: 'Montreal', postalCode: 'H3A 1B1', province: 'Quebec', country: { description: 'Canada' } };
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('Montreal Quebec H3A 1B1\nCanada');
  });

  it('handles missing country gracefully', () => {
    // No country provided
    const address = { city: 'Montreal', postalCode: 'H3A 1B1', province: 'Quebec', country: null };
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('Montreal Quebec H3A 1B1\n');
  });

  it('handles missing province gracefully', () => {
    // No province provided
    const address = { city: 'Montreal', postalCode: 'H3A 1B1', province: null, country: { description: 'Canada' } };
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('Montreal  H3A 1B1\nCanada');
  });

  it('handles missing postalCode gracefully', () => {
    // No postal code provided
    const address = { city: 'Montreal', postalCode: null, province: 'Quebec', country: { description: 'Canada' } };
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('Montreal Quebec \nCanada');
  });

  it('handles missing city gracefully', () => {
    // No city provided
    const address = { city: null, postalCode: 'H3A 1B1', province: 'Quebec', country: { description: 'Canada' } };
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe(' Quebec H3A 1B1\nCanada');
  });

  it('returns empty string for completely empty address', () => {
    const address = {};
    const lineBreak = '\n';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('  \n');
  });

  it('handles custom lineBreaks correctly', () => {
    const address = { city: 'Montreal', postalCode: 'H3A 1B1', province: 'Quebec', country: { description: 'Canada' } };
    const lineBreak = ' | ';

    const result = foreignAddressSuffix(address, lineBreak);
    expect(result).toBe('Montreal Quebec H3A 1B1 | Canada');
  });
});

describe('serializeAddress', () => {
  describe('HTML breaks', () => {
    it('foreign address true', () => {
      const contact = {
        firmName: 'firmName',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        address: {
          city: 'city',
          state: { code: 'stateCode' },
          zipCode: 'zipCode',
          postalCode: 'postalCode',
          province: 'province',
          preAddress: 'preAddress',
          street: 'street',
          aptSuiteFloor: 'aptSuiteFloor',
          foreignAddress: true,
          country: { description: 'Country.Description' },
        },
        inCareOf: 'inCareOf',
      };
      const lineBreak = '<br/>';

      const result =
        'firstName middleName lastName<br/>firmName<br/>C/O inCareOf<br/>preAddress<br/>street aptSuiteFloor<br/>city province postalCode<br/>Country.Description';

      expect(serializeAddress(contact, lineBreak)).toEqual(result);
    });

    it('foreign address false', () => {
      const contact = {
        firmName: 'firmName',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        address: {
          city: 'city',
          state: { code: 'stateCode' },
          country: { description: 'Country.Description' },
          zipCode: 'zipCode',
          postalCode: 'postalCode',
          province: 'province',
          preAddress: 'preAddress',
          street: 'street',
          aptSuiteFloor: 'aptSuiteFloor',
          foreignAddress: false,
        },
        inCareOf: 'inCareOf',
      };
      const lineBreak = '<br/>';

      const result =
        'firstName middleName lastName<br/>firmName<br/>C/O inCareOf<br/>preAddress<br/>street aptSuiteFloor<br/>city, stateCode zipCode';

      expect(serializeAddress(contact, lineBreak)).toEqual(result);
    });

    it('returns constant if contact is empty array', () => {
      const contact = {};
      const lineBreak = '<br/>';

      expect(serializeAddress(contact, lineBreak)).toEqual('[[[LETTERHEADER_ADDRESS_BLOCK]]]');
    });

    it('returns constant if contact is null', () => {
      const contact = null;
      const lineBreak = '<br/>';

      expect(serializeAddress(contact, lineBreak)).toEqual('[[[LETTERHEADER_ADDRESS_BLOCK]]]');
    });
  });

  describe('new line escapes', () => {
    it('foreign address true', () => {
      const contact = {
        firmName: 'firmName',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        address: {
          city: 'city',
          state: { code: 'stateCode' },
          zipCode: 'zipCode',
          postalCode: 'postalCode',
          province: 'province',
          preAddress: 'preAddress',
          street: 'street',
          aptSuiteFloor: 'aptSuiteFloor',
          foreignAddress: true,
          country: { description: 'Country.Description' },
        },
        inCareOf: 'inCareOf',
      };
      const lineBreak = '\n';

      const result =
        'firstName middleName lastName\nfirmName\nC/O inCareOf\npreAddress\nstreet aptSuiteFloor\ncity province postalCode\nCountry.Description';

      expect(serializeAddress(contact, lineBreak)).toEqual(result);
    });

    it('foreign address false', () => {
      const contact = {
        firmName: 'firmName',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        address: {
          city: 'city',
          state: { code: 'stateCode' },
          zipCode: 'zipCode',
          postalCode: 'postalCode',
          province: 'province',
          preAddress: 'preAddress',
          street: 'street',
          aptSuiteFloor: 'aptSuiteFloor',
          foreignAddress: false,
          country: { description: 'Country.Description' },
        },
        inCareOf: 'inCareOf',
      };
      const lineBreak = '\n';

      const result = 'firstName middleName lastName\nfirmName\nC/O inCareOf\npreAddress\nstreet aptSuiteFloor\ncity, stateCode zipCode';

      expect(serializeAddress(contact, lineBreak)).toEqual(result);
    });
  });
});

describe('invalidContact', () => {
  it('returns true if contact is null', () => {
    const contact = null;
    expect(invalidContact(contact)).toBe(true);
  });

  it('returns true if contact firstName is null', () => {
    const contact = { firstName: null };
    expect(invalidContact(contact)).toBe(true);
  });

  it('returns false if contact first name is valid', () => {
    const contact = { firstName: 'test' };
    expect(invalidContact(contact)).toBe(false);
  });
});

describe('resolveCareOf', () => {
  it('returns string with C/O and new line escape', () => {
    const inCareOf = 'foo';
    const lineBreak = '\n';

    expect(resolveCareOf(inCareOf, lineBreak)).toEqual('C/O foo\n');
  });

  it('returns string with C/O and html line break', () => {
    const inCareOf = 'foo';
    const lineBreak = '<br/>';
    expect(resolveCareOf(inCareOf, lineBreak)).toEqual('C/O foo<br/>');
  });

  it('returns empty string if inCareOf is null', () => {
    const inCareOf = null;
    const lineBreak = '\n';

    expect(resolveCareOf(inCareOf, lineBreak)).toEqual('');
  });
});
