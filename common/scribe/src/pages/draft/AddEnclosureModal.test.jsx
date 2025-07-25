import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from 'react-toastify';
import AddEnclosureModal from './AddEnclosureModal';
import { APP_API_ENDPOINT } from '../../http/authenticatedAxios';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockSetDraft = jest.fn();
const mockSetShowModal = jest.fn();

const draftId = '6f3432e7-47bf-48fc-94e6-016838325d0a';
const mockDraft = {
  id: draftId,
  letter_type_id: 'f3229b3c-0892-4d41-9ab4-9f624b4af7ec',
  registration: {
    form_type_name: 'N300',
  },
  enclosures: [
    {
      id: '457f4df4-7c0e-4dc7-91d5-4b622bd2d092',
      name: 'Enclosure 1',
      active: true,
      created_at: '2025-05-05T16:34:23.650Z',
      updated_at: '2025-05-05T16:34:23.650Z',
    },
  ],
  errors: {},
};

const mockDraftAfterPut = {
  id: draftId,
  letter_type_id: 'f3229b3c-0892-4d41-9ab4-9f624b4af7ec',
  registration: {
    form_type_name: 'N300',
  },
  enclosures: [
    {
      id: '457f4df4-7c0e-4dc7-91d5-4b622bd2d092',
      name: 'Enclosure 1',
      active: true,
      created_at: '2025-05-05T16:34:23.650Z',
      updated_at: '2025-05-05T16:34:23.650Z',
    },
    {
      id: 'e13f82f1-4bda-45ca-ac07-a5f3d2677aa2',
      name: 'Enclosure 2',
      active: true,
      created_at: '2025-05-05T16:34:23.653Z',
      updated_at: '2025-05-05T16:34:23.653Z',
    },
  ],
  errors: {},
};

const mockDraftAfterRemove = {
  id: draftId,
  letter_type_id: 'f3229b3c-0892-4d41-9ab4-9f624b4af7ec',
  registration: {
    form_type_name: 'N300',
  },
  enclosures: [
    {
      id: 'e13f82f1-4bda-45ca-ac07-a5f3d2677aa2',
      name: 'Enclosure 2',
      active: true,
      created_at: '2025-05-05T16:34:23.653Z',
      updated_at: '2025-05-05T16:34:23.653Z',
    },
  ],
  errors: {},
};

const mockEnclosuresForLetterTypeFormType = [
  {
    id: '457f4df4-7c0e-4dc7-91d5-4b622bd2d092',
    name: 'Enclosure 1',
    active: true,
    created_at: '2025-05-05T16:34:23.650Z',
    updated_at: '2025-05-05T16:34:23.650Z',
  },
  {
    id: 'e13f82f1-4bda-45ca-ac07-a5f3d2677aa2',
    name: 'Enclosure 2',
    active: true,
    created_at: '2025-05-05T16:34:23.653Z',
    updated_at: '2025-05-05T16:34:23.653Z',
  },
];

const mockEnclosuresGet = (returnData) => {
  mockAxios
    .onGet(`${APP_API_ENDPOINT}/enclosures_for_letter_type_form_type`, {
      enclosure: {
        letter_type_id: mockDraft.letter_type_id,
        form_type_name: mockDraft.registration.form_type_name,
      },
    })
    .reply(200, returnData);
};

const mockDraftPut = (returnData) => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/letters/${mockDraft.id}`).reply(200, returnData);
};

const renderComponent = async () => {
  render(
    <>
      <ToastContainer />
      <AddEnclosureModal showModal setShowModal={mockSetShowModal} setLetter={mockSetDraft} letter={mockDraft} />
    </>
  );
};

describe('AddEnclosureModal', () => {
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('Adds Enclosures to a letter', async () => {
    const userInstance = userEvent.setup();

    mockEnclosuresGet(mockEnclosuresForLetterTypeFormType);
    mockDraftPut(mockDraftAfterPut);
    await renderComponent();

    const enclosure0 = mockEnclosuresForLetterTypeFormType[0];
    const enclosure1 = mockEnclosuresForLetterTypeFormType[1];

    // Modal pops
    expect(await screen.findByText('Check Enclosures to include in this Letter:')).toBeInTheDocument();

    // Data is there
    expect(await screen.findByText(enclosure0.name)).toBeInTheDocument();
    expect(await screen.findByText(enclosure1.name)).toBeInTheDocument();
    expect(screen.getByTestId(`included-enclosure-${enclosure0.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`available-enclosure-${enclosure1.id}`)).toBeInTheDocument();

    // Add enclosure
    await userInstance.click(screen.getByTestId(`available-enclosure-${enclosure1.id}`));
    await waitFor(() => expect(screen.queryByTestId(`available-enclosure-${enclosure1.id}`)).not.toBeInTheDocument());
    await screen.findByTestId(`included-enclosure-${enclosure1.id}`);

    const addButton = screen.getByTestId('modifyEnclosureModalButton').shadowRoot;
    await waitFor(() => expect(addButton.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(addButton.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('.enclosure-modal')).not.toBeInTheDocument());
  });

  it('Removes Enclosures from a letter', async () => {
    const userInstance = userEvent.setup();

    mockEnclosuresGet(mockEnclosuresForLetterTypeFormType);
    mockDraftPut(mockDraftAfterRemove);
    await renderComponent();

    const enclosure0 = mockEnclosuresForLetterTypeFormType[0];
    const enclosure1 = mockEnclosuresForLetterTypeFormType[1];

    expect(await screen.findByText('Check Enclosures to include in this Letter:')).toBeInTheDocument();

    expect(await screen.findByText(enclosure0.name)).toBeInTheDocument();
    expect(await screen.findByText(enclosure1.name)).toBeInTheDocument();
    expect(screen.getByTestId(`included-enclosure-${enclosure0.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`available-enclosure-${enclosure1.id}`)).toBeInTheDocument();

    // Uncheck the included one
    await userInstance.click(screen.getByTestId(`included-enclosure-${enclosure0.id}`));

    expect(screen.queryByTestId(`included-enclosure-${enclosure0.id}`)).not.toBeInTheDocument();
    expect(await screen.findByTestId(`available-enclosure-${enclosure0.id}`)).toBeInTheDocument();

    const addButton = screen.getByTestId('modifyEnclosureModalButton').shadowRoot;
    await waitFor(() => expect(addButton.querySelector('.dr-btn')).toBeDefined());
    await userInstance.click(addButton.querySelector('.dr-btn'));

    await waitFor(() => expect(screen.queryByTestId('.enclosure-modal')).not.toBeInTheDocument());
  });

  it('Shows an error if the enclosures are not retrieved', async () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/enclosures_for_letter_type_form_type`).timeout();

    await renderComponent();

    expect(await screen.findByText('There was an error retrieving the Enclosures list', undefined, { timeout: 5000 })).toBeInTheDocument();
  });

  it('closes the modal by clicking the x button', async () => {
    await renderComponent();
    await userEvent.click(screen.getByTestId('closeButtonModal'));
    expect(mockSetShowModal).toHaveBeenCalledWith(false);
  });
});
