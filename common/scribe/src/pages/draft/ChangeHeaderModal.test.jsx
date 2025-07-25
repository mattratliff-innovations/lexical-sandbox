import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import ChangeHeaderModal from './ChangeHeaderModal';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const renderComponent = async (mockDraft) => {
  await act(async () => {
    render(<ChangeHeaderModal draft={mockDraft} showModal setShowModal={() => jest.fn()} onSubmit={() => jest.fn()} />);
  });
};

const headerOne = {
  id: '1c7e6aed-f35a-42b3-8807-2c23be3e4a10',
  name: 'Header 1 - Standard Header',
  active: true,
  created_at: '2024-04-12T18:52:01.985Z',
  updated_at: '2024-04-12T18:52:01.985Z',
  row1_col1: '<p>[[[LETTER_DATE]]]</p>',
  row1_col2: '<p>[[[ORGANIZATION_ADDRESS]]]</p>',
  row2_col1: '<p>[[[RECIPIENT_ADDRESS]]]</p>',
  row2_col2: '<p>[[[DHS_SEAL]]]</p>',
  row3_col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
  row3_col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p><p>[[[A_NUMBER_BARCODE]]]</p>',
};

const headerTwo = {
  id: 'b86b3050-9f0b-4321-afb8-73ad759791f3',
  name: 'Header 2 - No DHS Seal',
  active: true,
  created_at: '2024-04-12T18:52:01.998Z',
  updated_at: '2024-04-12T18:52:01.998Z',
  row1_col1: '<p>[[[LETTER_DATE]]]</p>',
  row1_col2: '<p>[[[ORGANIZATION_ADDRESS]]]</p>',
  row2_col1: '<p>[[[RECIPIENT_ADDRESS]]]</p>',
  row2_col2: '',
  row3_col1: '<p>[[[RECEIPT_NUMBER]]] - [[[A_NUMBER]]]</p>',
  row3_col2: '<p>[[[RECEIPT_NUMBER_BARCODE]]]</p><p>[[[A_NUMBER_BARCODE]]]</p>',
};

const headersForCase = [headerOne, headerTwo];

const activeAddress = {
  id: '54a2ec0c-b956-4fb9-922f-74be5f1b74b2',
  preAddress: 'preaddress',
  street: '123 street',
  aptSuiteFloor: 'aptsuitefloor 1',
  city: 'city 1',
  state: { id: 'NJ1', code: 'NJ', name: 'New Jersey' },
  zipCode: '11111',
  postalCode: null,
  country: 'USA',
};

const activeOrgAddress = {
  active: true,
  default: true,
  address: activeAddress,
};

const inactiveAddress = {
  id: '09aac57b-1607-4cad-9c9a-7ac50e662423',
  preAddress: 'a different preaddress',
  street: '321 street',
  aptSuiteFloor: 'aptsuitefloor 2',
  city: 'Twin City',
  state: { id: 'Ok1', code: 'OK', name: 'Oklahoma' },
  zipCode: '22222',
  postalCode: null,
  country: 'USA',
};

const inactiveOrgAddress = {
  active: false,
  default: false,
  address: inactiveAddress,
};

const mockDraft = {
  headerId: headerTwo.id,
  returnAddressOverride: null,
  organization: {
    id: '90089e55-fde3-41d1-9d6d-a417c4731c56',
    organizationAddressXrefs: [activeOrgAddress, inactiveOrgAddress],
  },
  organizationId: activeAddress.id,
};

const mockHeadersCall = (returnData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/organizations/${mockDraft.organizationId}/headers`).reply(200, returnData);
};

describe('ChangeHeaderModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios.reset();
    mockHeadersCall(headersForCase);
    await renderComponent(mockDraft);
  });

  // eslint-disable-next-line max-len
  const expectedAddressFormat = (address) =>
    `${address.street}, ${address.aptSuiteFloor}, ${address.city}, ${address.state.code} ${address.zipCode} ${address.country}`;

  it('has expected elements', () => {
    const h1Element = screen.getByTestId('changeHeaderModalHeader');
    expect(h1Element).toHaveTextContent('Change Header');

    const datePicker = screen.getByLabelText('Change Letter Date');
    expect(datePicker).toBeInTheDocument();

    const returnAddress = screen.getByText('Select Return Address');
    expect(returnAddress).toBeInTheDocument();

    const modifyButton = screen.getByText('Modify Header');
    expect(modifyButton).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
  });

  it('shows active organization addresses', async () => {
    expect(screen.getByText(expectedAddressFormat(activeAddress))).toBeInTheDocument();
  });

  it('does not show inactive organization addresses', async () => {
    expect(screen.queryByText(expectedAddressFormat(inactiveAddress))).not.toBeInTheDocument();
  });

  it('preselects the default organization address', async () => {
    const checkedRadio = await screen.findByRole('radio', {
      id: activeAddress.id,
    });
    expect(checkedRadio).toBeChecked();
  });
});
