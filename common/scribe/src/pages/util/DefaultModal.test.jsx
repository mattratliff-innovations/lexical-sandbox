import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DefaultModal from './DefaultModal';

describe('defaultModal', () => {
  describe('handleConfirmClick', () => {
    it('does not submit when informationalOnly is true', async () => {
      const userInstance = userEvent.setup();
      const spyFunction = jest.fn();
      render(
        <DefaultModal
          informationalOnly
          defaultMessage="Are you sure you want to click this button? This action can not be undone. O__O"
          onSubmit={() => false}
          showModal
          setShowModal={spyFunction}
        />,
        { wrapper: MemoryRouter }
      );

      const { shadowRoot } = await screen.findByTestId('YesButton');
      await userInstance.click(shadowRoot.querySelector('.dr-btn'));

      await waitFor(() => expect(spyFunction).toHaveBeenCalledWith(false));
    });
  });
});
