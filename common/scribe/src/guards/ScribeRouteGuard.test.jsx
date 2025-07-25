import React, { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import { adminProtected, isoProtected } from './ScribeRouteGuard';
import { idTokenHasAdminPrivileges, idTokenHasIsoPrivileges } from '../oidc/Authentication';
import { AppContext } from '../AppProvider';
import { currentUser } from '../../testSetup/currentUserHelper';

jest.mock('../oidc/Authentication');

const AUTHED_MESSAGE = 'Page is viewable!';
function Page() {
  return <div>{AUTHED_MESSAGE}</div>;
}

const renderComponent = (protectedFunction, user) => {
  const protectedFunctionWithProvider = (
    <AppContext.Provider value={{ currentUser: user }}>
      {protectedFunction(Page, {
        title: 'A title so annoying warnings are not in the console',
      })}
    </AppContext.Provider>
  );
  const routes = createRoutesFromElements(<Route path="/" element={protectedFunctionWithProvider} />);

  const router = createMemoryRouter(routes, {
    initialEntries: ['/'],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);
};

describe('adminProtected', () => {
  it('displays the page if the user is an admin', async () => {
    idTokenHasAdminPrivileges.mockImplementation(() => true);

    renderComponent(adminProtected, currentUser);

    expect(await screen.findByText(AUTHED_MESSAGE)).toBeVisible();
  });

  it('does not display the page if the user is an admin', async () => {
    idTokenHasAdminPrivileges.mockImplementation(() => false);

    renderComponent(adminProtected, currentUser);

    expect(screen.getByTestId('messageContainer')).toHaveTextContent("We're sorry, but it appears that you");
  });

  it('shows a warning message if the user does not have organizations', async () => {
    idTokenHasAdminPrivileges.mockImplementation(() => true);

    renderComponent(adminProtected, { ...currentUser, organizations: [] });

    expect(screen.getByTestId('messageContainer')).toHaveTextContent('You are not assigned to any organizations.');
  });

  it('allows an admin user to view an admin page if they do not have orgs', async () => {
    idTokenHasAdminPrivileges.mockImplementation(() => true);
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/admin/some_admin_page',
      },
      writable: true,
    });

    renderComponent(adminProtected, { ...currentUser, organizations: [] });

    expect(await screen.findByText(AUTHED_MESSAGE)).toBeVisible();
  });
});

describe('isoProtected', () => {
  it('displays the page if the user is an ISO', async () => {
    idTokenHasIsoPrivileges.mockImplementation(() => true);

    renderComponent(isoProtected, currentUser);

    expect(await screen.findByText(AUTHED_MESSAGE)).toBeVisible();
  });

  it('does not display the page if the user is an admin', async () => {
    idTokenHasIsoPrivileges.mockImplementation(() => false);

    renderComponent(isoProtected, currentUser);

    expect(await screen.findByText("You Don't Have Access To That")).toBeVisible();
  });

  it('shows a warning message if the user does not have organizations', async () => {
    idTokenHasIsoPrivileges.mockImplementation(() => true);

    renderComponent(isoProtected, { ...currentUser, organizations: [] });

    expect(screen.getByTestId('messageContainer')).toHaveTextContent('You are not assigned to any organizations.');
  });
});
