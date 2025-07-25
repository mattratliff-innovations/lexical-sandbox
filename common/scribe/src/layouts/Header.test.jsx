import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { idTokenHasAdminPrivileges } from '../oidc/Authentication';

// Mock the assets, component, and environment variables
jest.mock('../assets/uscis-seal.svg', () => 'uscis-seal.svg');
jest.mock('../assets/didit-logo-header.png', () => 'didit-logo-header.png');
jest.mock('../assets/scribe-logo.png', () => 'scribe-logo.png');
jest.mock('../oidc/Authentication');
jest.mock(
  './HeaderCurrentUser',
  () =>
    function MockedHeaderCurrentUser() {
      return <div data-testid="header-current-user">Mocked HeaderCurrentUser</div>;
    }
);

describe('Header', () => {
  it('renders navigation links correctly if the user is an admin', () => {
    idTokenHasAdminPrivileges.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const homeLink = screen.getByText('Home');
    const adminLink = screen.getByText('Administration');
    const searchLink = screen.getByText('Search');

    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute('href', '/searchLetters');
  });

  it('renders Scribe logo correctly with src, title, and alt', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const scribeLogo = screen.getByAltText('Scribe Home');
    expect(scribeLogo).toBeInTheDocument();
    expect(scribeLogo).toHaveAttribute('src', 'scribe-logo.png');
    expect(scribeLogo).toHaveAttribute('title', 'Scribe Home');
    expect(scribeLogo).toHaveAttribute('alt', 'Scribe Home');
  });

  it('renders Mocked HeaderCurrentUser', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByTestId('header-current-user')).toHaveTextContent('Mocked HeaderCurrentUser');
  });

  it('does not show the admin link if the user is not an admin', () => {
    idTokenHasAdminPrivileges.mockImplementation(() => false);

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const adminLink = screen.queryByText('Administration');
    expect(adminLink).toBeNull();
  });

  it('Skip navigation works correctly', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // Verify the skip link is in the document
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();

    // Start tabbing through the page
    await user.tab();
    expect(skipLink).toHaveFocus();

    // Activate via Enter key
    await user.keyboard('{Enter}');

    // Verify url hash
    expect(window.location.hash).toBe('#content-start');

    // NOT SURE IF JSDOM CAN HANDLE BELOW TEST
    // Verify focus moves to the main content.
    // expect(await screen.getByTestId("content-start")).toHaveFocus();
  });
});
