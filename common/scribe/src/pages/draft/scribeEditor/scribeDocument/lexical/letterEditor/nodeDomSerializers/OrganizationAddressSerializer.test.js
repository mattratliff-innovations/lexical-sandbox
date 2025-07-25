import {
  createOrganizationAddressFromDom,
  serializeToHtml,
  findDraftOrganizationAddress,
  ORGANIZATION_ADDRESS_TYPE,
  KEY_MAPPING_TYPE,
} from './OrganizationAddressSerializer';
import { getKeyFromValue } from './AddressNodeSerializer';
import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';
import { draft } from '../../../../../../../../cypress/fixtures/scribeEditor/draft';

const ADDRESS_NICKNAME_KEY = getKeyFromValue(KEY_MAPPING_TYPE, 'nickname');
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

describe('createOrganizationAddressFromDom', () => {
  it('sets contact data from the span', () => {
    const orgAddress = findDraftOrganizationAddress(draft);
    const spanHtml =
      `<span ${ADDRESS_NICKNAME_KEY}="${orgAddress.nickname}" ${ADDRESS_STREET_KEY}="${orgAddress.street}" ` +
      `${ADDRESS_CITY_KEY}="${orgAddress.city}" ${ADDRESS_STATE_KEY}="${orgAddress.state.code}" ${ADDRESS_ZIP_CODE_KEY}="${orgAddress.zipCode}" ` +
      `${CUSTOM_NODE_TYPE_KEY}="${orgAddress.addressType}" ${ADDRESS_PRE_ADDRESS_KEY}="${orgAddress.preAddress}" ` +
      `${ADDRESS_APT_SUITE_FLOOR_KEY}="${orgAddress.aptSuiteFloor}" ${ADDRESS_FOREIGN_ADDRESS_KEY}="${orgAddress.foreignAddress}" ` +
      `${ADDRESS_POSTAL_CODE_KEY}="${orgAddress.postalCode}" ${ADDRESS_COUNTRY_KEY}="${orgAddress.country}" ` +
      `${ADDRESS_PROVINCE_KEY}="${orgAddress.province}"/>`;

    const parser = new DOMParser();
    const parsedHtml = parser.parseFromString(spanHtml, 'text/html');
    const spanDom = parsedHtml.getElementsByTagName('span')[0];
    const address = createOrganizationAddressFromDom(spanDom);

    expect(address.nickname).toBe(orgAddress.nickname);
    expect(address.street).toBe(orgAddress.street);
    expect(address.city).toBe(orgAddress.city);
    expect(address.state).toBe(orgAddress.state.code);
    expect(address.zipCode).toBe(orgAddress.zipCode);
    expect(address.preAddress).toBe(orgAddress.preAddress);
    expect(address.aptSuiteFloor).toBe(orgAddress.aptSuiteFloor);
    expect(address.foreignAddress).toBe(orgAddress.foreignAddress);
    expect(address.postalCode).toBe(String(orgAddress.postalCode));
    expect(address.country).toBe(orgAddress.country);
    expect(address.province).toBe(String(orgAddress.province));
  });
});

describe('serializeToHtml', () => {
  it('sets the address data in the span', () => {
    const address = findDraftOrganizationAddress(draft);
    const span = document.createElement('span');

    serializeToHtml(span, address);

    expect(span.getAttribute(ADDRESS_NICKNAME_KEY)).toBe(address.nickname);
    expect(span.getAttribute(ADDRESS_STREET_KEY)).toBe(address.street);
    expect(span.getAttribute(ADDRESS_CITY_KEY)).toBe(address.city);

    expect(span.getAttribute(ADDRESS_STATE_KEY)).toBe(address.state?.code);
    expect(span.getAttribute(ADDRESS_ZIP_CODE_KEY)).toBe(address.zipCode);

    expect(span.getAttribute(ADDRESS_PRE_ADDRESS_KEY)).toBe(address.preAddress);
    expect(span.getAttribute(ADDRESS_APT_SUITE_FLOOR_KEY)).toBe(address.aptSuiteFloor);
    expect(span.getAttribute(ADDRESS_FOREIGN_ADDRESS_KEY)).toBe(String(address.foreignAddress));
    expect(span.getAttribute(ADDRESS_POSTAL_CODE_KEY)).toBe(address.postalCode);
    expect(span.getAttribute(ADDRESS_COUNTRY_KEY)).toBe(address.country);
    expect(span.getAttribute(ADDRESS_PROVINCE_KEY)).toBe(address.province);
  });

  it('renders foreign address', () => {
    const foreignAddressDraft = {
      ...draft,
      organization: {
        organizationAddressXrefs: [
          {
            default: true,
            address: {
              city: 'Saigon',
              state: null,
              zipCode: '',
              province: 'Northern Territory',
              postalCode: '888999000',
              country: 'VIETNAM',
              foreignAddress: 'true',
              type: 'AddressOrganizationType',
            },
          },
        ],
      },
    };

    const address = findDraftOrganizationAddress(foreignAddressDraft);
    const span = document.createElement('span');

    serializeToHtml(span, address);

    expect(address).toEqual(foreignAddressDraft.organization.organizationAddressXrefs[0].address);
  });

  it('returns an empty string if the address is null', () => {
    const span = document.createElement('span');

    serializeToHtml(span, null);

    expect(span.getAttribute(CUSTOM_NODE_TYPE_KEY)).toBe(ORGANIZATION_ADDRESS_TYPE);
  });
});

describe('findDraftOrganizationAddress', () => {
  it('finds default org address', () => {
    const defaultOrgAddress = draft.organization.organizationAddressXrefs.find((org) => org.default === true);
    const address = findDraftOrganizationAddress(draft);

    expect(address).toEqual(defaultOrgAddress.address);
  });

  it('does not finds non-default org address', () => {
    const defaultOrgAddress = draft.organization.organizationAddressXrefs.find((org) => org.default !== true);
    const address = findDraftOrganizationAddress(draft);

    expect(address).not.toEqual(defaultOrgAddress.address);
  });

  it('overrides the default org if there is an override set', () => {
    const overrideId = '1e46914b-0853-4625-9843-3f866e031490';
    const draftWithOverride = { ...draft, returnAddressOverride: overrideId };

    const address = findDraftOrganizationAddress(draftWithOverride);

    expect(address.id).toEqual(overrideId);
  });

  it('renders null for no organization', () => {
    const draftNullOrg = {
      ...draft,
      organization: { organizationAddressXrefs: [] },
    };

    const address = findDraftOrganizationAddress(draftNullOrg);

    expect(address).toBe(null);
  });
});
