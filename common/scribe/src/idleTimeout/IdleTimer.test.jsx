import React, { render, screen, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { createMocks } from 'react-idle-timer';
import userEvent from '@testing-library/user-event';
import TestLayout from '../../testSetup/admin/TestLayout';
import Logout from '../pages/logout/Logout';
import IdleTimer from './IdleTimer';
import { clearSession } from '../oidc/Authentication';

jest.mock('../oidc/Authentication');

const timeout = 20 * 60 * 1000; // 20 minutes
const promptBeforeIdle = 2 * 60 * 1000; // 2 minutes

const renderIdleTimer = () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/logout" element={<Logout />} />
      <Route path="/idletimer" element={<IdleTimer />} />
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/idletimer', '/logout'],
    initialIndex: [1],
  });

  render(<RouterProvider router={router} />);
  return { router };
};

describe('IdleTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    createMocks();
    clearSession.mockImplementation(() => undefined);
  });

  afterEach(() => jest.useRealTimers());

  it('does not display the idle modal if the user is not idle', async () => {
    renderIdleTimer();
    expect(screen.queryByTestId('idleModal')).not.toBeInTheDocument();
  });

  it('displays the idle modal if the user is idle', async () => {
    renderIdleTimer();
    await act(async () => jest.advanceTimersByTime(timeout - promptBeforeIdle + 1));
    expect(screen.getByTestId('idleModal')).toBeVisible();
  });

  it('clicking the extend session button extends the session and does not logout the user', async () => {
    const userInstance = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    renderIdleTimer();

    await act(async () => jest.advanceTimersByTime(timeout - promptBeforeIdle + 1));
    expect(await screen.findByTestId('idleModal')).toBeInTheDocument();

    const extendBtn = await screen.findByTestId('extendSession');

    await userInstance.click(extendBtn);
    await waitFor(() => expect(screen.queryByTestId('idleModal')).not.toBeInTheDocument());
    expect(clearSession.mock.calls).toHaveLength(0);
  });

  it('logs out the user when the user clicks the logout button', async () => {
    const userInstance = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    const { router } = renderIdleTimer();
    expect(router.state.location.pathname).toEqual('/idletimer');
    await act(async () => jest.advanceTimersByTime(timeout - promptBeforeIdle + 1));
    await waitFor(() => expect(screen.getByTestId('idleModal')).toBeVisible());

    await userInstance.click(screen.getByTestId('logout'));

    await waitFor(async () => {
      expect(screen.queryByTestId('idleModal')).not.toBeInTheDocument();
      expect(router.state.location.pathname).toEqual('/logout');
      expect(screen.queryByText("You've Been Logged Out.").toBeInTheDocument);
    });
  });

  it('logs out the user when the user is idle', async () => {
    const { router } = renderIdleTimer();
    await act(async () => jest.advanceTimersByTime(timeout + 1));

    await waitFor(() => {
      expect(screen.queryByTestId('idleModal')).not.toBeInTheDocument();
      expect(router.state.location.pathname).toEqual('/logout');
      expect(screen.queryByText("You've Been Logged Out.").toBeInTheDocument);
    });
  });

  it('tab thru the two button without going outside the modal', async () => {
    const userInstance = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    renderIdleTimer();

    await act(async () => jest.advanceTimersByTime(timeout - promptBeforeIdle + 1));

    const logoutBtn = screen.getByTestId('logout');

    // Must simulate a focus to set activeElement. userInstance.tab() doesn't work by itself.
    logoutBtn.focus();
    userInstance.tab();
    expect(document.activeElement).toBe(screen.getByTestId('logout'));
  });

  it('shift+tab thru the two button without going outside the modal', async () => {
    const userInstance = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    renderIdleTimer();

    await act(async () => jest.advanceTimersByTime(timeout - promptBeforeIdle + 1));

    const extendSessionBtn = screen.getByTestId('extendSession');

    // Must simulate a focus to set activeElement. userInstance.tab() doesn't work by itself.
    extendSessionBtn.focus();
    userInstance.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByTestId('extendSession'));
  });
});
