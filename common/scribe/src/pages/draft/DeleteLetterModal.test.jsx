import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import DeleteLetterModal from './DeleteLetterModal';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const renderComponent = async (mockSetShowModal, mockConfirmDeleteLetter) => {
  await act(async () => {
    render(<DeleteLetterModal showModal setShowModal={mockSetShowModal} confirmDeleteLetter={mockConfirmDeleteLetter} />);
  });
};

describe('DeleteLetterModal', () => {
  const mockSetShowModal = jest.fn();
  const mockConfirmDeleteLetter = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios.reset();
    await renderComponent(mockSetShowModal, mockConfirmDeleteLetter);
  });

  it('shows delete confirmation message', async () => {
    const returnHeader = screen.getByTestId('deleteLetterModalHeader');
    expect(returnHeader).toHaveTextContent('Confirmation Required!');

    expect(
      screen.getByText('Deleting this draft will also delete any edits to the contact information. Are you sure you want to delete this draft?')
    ).toBeInTheDocument();
  });

  it('can click the Cancel button', async () => {
    const { shadowRoot } = await screen.getByText('Cancel');
    const cancelButton = within(shadowRoot).getByRole('button', {
      name: /cancel/i,
    });
    await userEvent.click(cancelButton);
    expect(mockSetShowModal).toHaveBeenCalledWith(false);
  });

  it('can click the Delete button', async () => {
    const { shadowRoot } = await screen.getByTestId('confirmDelete');
    const deleteButton = within(shadowRoot).getByRole('button', {
      name: /delete/i,
    });
    await userEvent.click(deleteButton);
    expect(mockConfirmDeleteLetter).toHaveBeenCalled();
  });
});
