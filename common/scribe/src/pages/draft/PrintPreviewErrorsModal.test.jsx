import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrintPreviewErrorModal from './PrintPreviewErrorsModal';

const mockSetShowModal = jest.fn();

const baseProps = { setShowModal: mockSetShowModal };

const renderComponent = async (props) => {
  // eslint-disable-next-line react/jsx-props-no-spreading
  render(<PrintPreviewErrorModal {...props} />);
};
describe('Print Preview Error Modal', () => {
  it('does not show the modal if show is false', async () => {
    await renderComponent({ ...baseProps, ...{ showModal: false } });

    expect(screen.queryByText('Errors Found!')).not.toBeInTheDocument();
  });

  it('shows the errors', async () => {
    const error1 = 'error1';
    const error2 = 'error2';
    const error3 = 'error3';
    const draft = {
      errors: { print: [error1] },
      contacts: [
        {
          errors: { print: [error2] },
          address: { errors: { print: [error3] } },
        },
      ],
    };
    const linguisticErrors = [{ errors: ['one', 'two'] }, { errors: ['three', 'four'] }];
    await renderComponent({
      ...baseProps,
      ...{ showModal: true, draft, linguisticErrors },
    });

    await screen.findByText('Errors Found!');
    expect(screen.getByText(error1)).toBeInTheDocument();
    expect(screen.getByText(error2)).toBeInTheDocument();
    expect(screen.getByText(error3)).toBeInTheDocument();
    expect(screen.getByText('4 Spelling/Grammar Error(s)')).toBeInTheDocument();
  });

  it('closes the modal by clicking yes', async () => {
    await renderComponent({ ...baseProps, ...{ showModal: true } });

    const { shadowRoot } = screen.getByTestId('printPreviewErrorModalYes');
    await userEvent.click(shadowRoot.querySelector('.dr-btn'));

    expect(mockSetShowModal).toHaveBeenCalledWith(false);
  });

  it('closes the modal by clicking the x button', async () => {
    await renderComponent({ ...baseProps, ...{ showModal: true } });
    await userEvent.click(screen.getByTestId('closeButtonModal'));
    expect(mockSetShowModal).toHaveBeenCalledWith(false);
  });
});
