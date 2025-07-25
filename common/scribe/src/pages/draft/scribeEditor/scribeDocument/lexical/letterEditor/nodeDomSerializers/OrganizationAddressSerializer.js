import { CUSTOM_NODE_TYPE_KEY } from '../nodes/NodeUtil';
import {
  createAddressFromDom,
  foreignAddressSuffix,
  domesticAddressSuffix,
  generateAddressKeyMapping,
  getKeyFromValue,
  FOREIGN_ADDRESS_KEY_MAPPING_VALUE,
} from './AddressNodeSerializer';

export const ORGANIZATION_ADDRESS_TYPE = 'organizationAddressType';
export const KEY_MAPPING_TYPE = 'organization-address';

export const createOrganizationAddressFromDom = (domNode) => createAddressFromDom(domNode, KEY_MAPPING_TYPE);

export const valueWithNewLineOrEmpty = (value, lineBreak) => (value ? value + lineBreak : '');

const serializeAddress = (address, { lineBreak = null }) => {
  if (!address) {
    return '';
  }
  const { nickname, preAddress, street, aptSuiteFloor, foreignAddress } = address || {};
  return (
    `${valueWithNewLineOrEmpty(nickname, lineBreak)}${valueWithNewLineOrEmpty(preAddress, lineBreak)}` +
    `${street} ${aptSuiteFloor || ''}${lineBreak}` +
    `${foreignAddress ? foreignAddressSuffix(address, lineBreak) : domesticAddressSuffix(address, lineBreak)}`
  );
};

const orgAddressToHtml = (address) => serializeAddress(address, { lineBreak: '<br/>' });

export const orgAddressToText = (address) => serializeAddress(address, { lineBreak: '\n' });

export const serializeToHtml = (span, address) => {
  span.setAttribute(CUSTOM_NODE_TYPE_KEY, ORGANIZATION_ADDRESS_TYPE);
  if (!address) return;

  const keyMap = generateAddressKeyMapping(KEY_MAPPING_TYPE);
  Object.entries(keyMap).forEach(([domKey, objectKey]) => {
    if (objectKey === 'state' && address[objectKey]) {
      span.setAttribute(domKey, address[objectKey]?.code);
    } else if (address[objectKey]) span.setAttribute(domKey, address[objectKey]);
  });

  const ADDRESS_FOREIGN_ADDRESS_KEY = getKeyFromValue(KEY_MAPPING_TYPE, FOREIGN_ADDRESS_KEY_MAPPING_VALUE);
  span.setAttribute(ADDRESS_FOREIGN_ADDRESS_KEY, address[FOREIGN_ADDRESS_KEY_MAPPING_VALUE]);

  const innerHtml = orgAddressToHtml(address);
  // See this SO discussion: https://stackoverflow.com/questions/35637770/how-to-avoid-no-param-reassign-when-setting-a-property-on-a-dom-object
  // eslint-disable-next-line no-param-reassign
  span.innerHTML = innerHtml;
};

export const findDraftOrganizationAddress = (draft) => {
  let orgAddress = draft.organization?.organizationAddressXrefs?.find((orgXref) => orgXref.addressId === draft.returnAddressOverride);
  orgAddress ||= draft.organization?.organizationAddressXrefs?.find((org) => org.default === true);
  if (orgAddress) return orgAddress.address;
  return null;
};
