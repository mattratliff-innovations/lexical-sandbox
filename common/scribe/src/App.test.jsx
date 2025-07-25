import React, { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createMemoryRouter, Route, createRoutesFromElements } from 'react-router-dom';
import AppProvider from './AppProvider';
import RootLayout from './layouts/RootLayout';
import { processOidcSession, startIdTokenRefreshTimer } from './oidc/Authentication';
import upsertUser from './oidc/SaveUserToken';
import App from './App';
import generateRouter from './AppRoutes';
import { APP_API_ENDPOINT } from './http/authenticatedAxios';

const routes = () => createRoutesFromElements(<Route path="/" element={<RootLayout />} />);

jest.mock('./oidc/Authentication');
jest.mock('./oidc/SaveUserToken');
jest.mock('./AppRoutes');

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const userAndDefaultOrgs = {
  id: '46f4983d-52c2-4fb7-9e2d-b33e8c023461',
  first_name: 'Scribe',
  middle_initial: null,
  last_name: 'Iso',
  user_organization_xrefs: [
    {
      id: '22e97b37-fd36-46d2-916a-1b5a469b04fe',
      organization_id: '4b2bb3c3-bdd7-452e-8d54-e0f1f5e58d14',
      user_id: '46f4983d-52c2-4fb7-9e2d-b33e8c023461',
      default: false,
    },
    {
      id: '0a44cd73-6f8a-4244-8d99-f0efd35626c3',
      organization_id: '046d870e-3b13-4700-b6b5-af460933a62b',
      user_id: '46f4983d-52c2-4fb7-9e2d-b33e8c023461',
      default: true,
    },
  ],
  organizations: [
    {
      id: '4b2bb3c3-bdd7-452e-8d54-e0f1f5e58d14',
      name: 'California Service Center',
      active: false,
    },
    {
      id: '046d870e-3b13-4700-b6b5-af460933a62b',
      name: 'Nebraska Service Center',
      active: true,
    },
  ],
};

const userNoDefaultOrgs = {
  ...userAndDefaultOrgs,
  user_organization_xrefs: [
    {
      id: '0a44cd73-6f8a-4244-8d99-f0efd35626c3',
      organization_id: '046d870e-3b13-4700-b6b5-af460933a62b',
      user_id: '46f4983d-52c2-4fb7-9e2d-b33e8c023461',
      default: false,
    },
  ],
};

const renderComponent = () => {
  render(
    <AppProvider>
      <App />
    </AppProvider>
  );
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generateRouter.mockImplementation(() => createMemoryRouter(routes(), { initialEntries: [{ pathname: '/' }] }));
    mockAxios.reset();
  });

  it('shows the loading gif if the OIDC process call requires loading', () => {
    processOidcSession.mockImplementation(() => ({ showLoading: true }));

    renderComponent();

    expect(processOidcSession.mock.calls).toHaveLength(1);
    expect(screen.getByTestId('loadingIndicator')).toBeInTheDocument();
  });

  const createSuccessfulDraftsCall = () => {
    mockAxios.onGet(`${APP_API_ENDPOINT}/letters`).reply(200, []);
  };

  describe('User is logged in', () => {
    beforeEach(() => {
      processOidcSession.mockImplementation(() => ({ showLoading: false }));
      startIdTokenRefreshTimer.mockImplementation(() => 42);
      upsertUser.mockImplementation(() => null);
      createSuccessfulDraftsCall();
    });

    it('renders the app', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/users/current_user_with_organizations`).reply(200, userAndDefaultOrgs);

      renderComponent();

      waitFor(() => {
        expect(screen.getByText(/a writer or author/i)).toBeVisible();
        expect(screen.getByText(`${userAndDefaultOrgs.first_name} ${userAndDefaultOrgs.last_name}`)).toBeVisible();
        expect(upsertUser.mock.calls).toHaveLength(1);
      });

      expect(document.getElementById('back-to-top-link')).toHaveAttribute('href', '#content-start');
      expect(document.getElementById('content-start')).toBeInTheDocument();
    });

    it('sets the user properly even if there is no default org', async () => {
      mockAxios.onGet(`${APP_API_ENDPOINT}/users/current_user_with_organizations`).reply(200, userNoDefaultOrgs);

      renderComponent();

      waitFor(() => {
        expect(screen.getByText(`${userNoDefaultOrgs.first_name} ${userNoDefaultOrgs.last_name}`)).toBeInTheDocument();
      });
    });
  });
});
