import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { AppContext } from '../AppProvider';
import { setCurrentUser, mockCurrentUserData, draftOrganization } from '../../testSetup/currentUserHelper';
import HeaderCurrentUser, { BLANK_ORG_ID } from './HeaderCurrentUser';
import { APP_API_ENDPOINT } from '../http/authenticatedAxios';
import { getRoleNameFromToken } from '../oidc/Authentication';
import waitForLoadingToFinish from '../testUtils/waitForLoadingToFinish';

let mockedUseLocation = '/';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));
jest.mock('../oidc/Authentication');

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

const mockApiCall = (data = mockCurrentUserData) => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/users/current_user_with_organizations`).reply(200, data);
};

const mockApiCallError = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/users/current_user_with_organizations`).reply(422);
};

const mockApiPut = async () => {
  mockAxios.onPut(`${APP_API_ENDPOINT}/users/change_default_organization/${mockCurrentUserData.id}`).reply(200, mockCurrentUserData);
};

const renderComponent = (testCurrentUser = mockCurrentUserData) => {
  render(
    <>
      <ToastContainer />
      <BrowserRouter>
        <AppContext.Provider
          value={{
            currentUser: testCurrentUser,
            setCurrentUser,
            draftOrganization,
          }}>
          <HeaderCurrentUser />
        </AppContext.Provider>
      </BrowserRouter>
    </>
  );
};

describe('HeaderCurrentUser', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
    getRoleNameFromToken.mockImplementation(() => 'SOME_ROLE_NAME');
  });

  it('does not throw errors if the user does not have any organizations', async () => {
    mockApiCall({
      ...mockCurrentUserData,
      user_organization_xrefs: [],
      organizations: [],
    });
    renderComponent(null);
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByTestId('userOrganization').title).toBe('None'));
  });

  it('show the user and role if the user data is already set in the header', async () => {
    mockApiCall({
      ...mockCurrentUserData,
      user_organization_xrefs: [],
      organizations: [],
    });
    renderComponent();
    await waitForLoadingToFinish();

    expect(screen.getByTestId('header-currentuser-name')).toHaveTextContent(`${mockCurrentUserData.firstName} ${mockCurrentUserData.lastName}`);
    expect(screen.getByTestId('header-currentuser-role')).toHaveTextContent('SOME_ROLE_NAME');
    await waitFor(() => expect(screen.getByTestId('userOrganization').title).toBe('None'));
  });

  it('creates a single blank option if there is no selected default org', async () => {
    mockApiCall({ ...mockCurrentUserData, user_organization_xrefs: [] });
    renderComponent(null);
    await waitForLoadingToFinish();

    await waitFor(() => {
      expect(screen.getByTestId(`organizationId_${BLANK_ORG_ID}`)).toBeInTheDocument();
    });
  });

  it('sets the default org in the dropdown list and allows the user to save a new default org', async () => {
    mockApiCall();
    mockApiPut();
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => {
      expect(screen.getByTestId(`organizationId_${mockCurrentUserData.organizations[1].id}`).innerHTML).toBe(
        mockCurrentUserData.organizations[1].name
      );
    });
    expect(screen.getByTestId(`organizationId_${mockCurrentUserData.defaultOrg}`).selected).toBe(true);
    await userEvent.selectOptions(screen.getByTestId('userOrganization'), mockCurrentUserData.organizations[0].name);
    await waitFor(() => expect(screen.getByTestId('userOrganization').title).toBe(mockCurrentUserData.organizations[0].name));
    expect(JSON.parse(mockAxios.history.put[0].data).organization_id).toBe(mockCurrentUserData.organizations[0].id);
  });

  it('shows an error message if the call has an error', async () => {
    mockApiCallError();
    renderComponent();
    await waitForLoadingToFinish();

    expect(await screen.findByText('There was an error retrieving user with organizations.')).toBeInTheDocument();
  });
});

describe('HeaderCurrentUser Dropdown', () => {
  beforeEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
    mockApiCall();
  });

  it('shows disabled dropdown for create-letter', async () => {
    mockedUseLocation = '/createletter';
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByTestId('userOrganization')).toBeDisabled());
  });

  it('shows disabled dropdown for draft with uuid', async () => {
    mockedUseLocation = '/draft/e65aba09-4102-4b51-9b6f-b5527fe40602';
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByTestId('userOrganization')).toBeDisabled());
  });

  it('shows disabled dropdown for contact page', async () => {
    mockedUseLocation = '/contacts/e65aba09-4102-4b51-9b6f-b5527fe40602';
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByTestId('userOrganization')).toBeDisabled());
  });

  it('shows enabled dropdown for any other path', async () => {
    mockedUseLocation = '/any-other-path';
    renderComponent();
    await waitForLoadingToFinish();

    await waitFor(() => expect(screen.getByTestId('userOrganization')).not.toBeDisabled());
  });
});
