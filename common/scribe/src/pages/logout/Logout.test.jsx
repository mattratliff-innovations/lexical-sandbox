import React, { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route, useNavigate } from 'react-router-dom';
import Logout from './Logout';
import TestLayout from '../../../testSetup/admin/TestLayout';
import { startLogin, clearSession } from '../../oidc/Authentication';

function TestComponent() {
  const navigate = useNavigate();
  const handleClick = () => navigate(-1);

  return (
    <div>
      <button type="button" onClick={handleClick}>
        go back
      </button>
      <Logout />
    </div>
  );
}

jest.mock('../../oidc/Authentication');

const renderComponent = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/logout" element={<TestComponent />} />
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/logout'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

describe('Logout Page', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    clearSession.mockImplementation(() => undefined);
    startLogin.mockImplementation(() => undefined);
  });

  it('displays Logout page/modal and logs back in ', async () => {
    renderComponent();
    expect(clearSession.mock.calls).toHaveLength(1);

    const h1Element = screen.getByText("You've Been Logged Out.");
    expect(h1Element).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('signInButton'));

    await waitFor(() => expect(startLogin.mock.calls).toHaveLength(1));
  });

  it('tests to see if trying to navigate away is not successful', async () => {
    const { router } = renderComponent();
    const userInstance = userEvent.setup();
    expect(router.state.location.pathname).toEqual('/logout');

    const h1Element = screen.getByText("You've Been Logged Out.");
    expect(h1Element).toBeInTheDocument();
    await userInstance.click(screen.getByText(/go back/i));

    expect(router.state.location.pathname).toEqual('/logout');
  });
});
