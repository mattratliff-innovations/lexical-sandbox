import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import React, { render, screen, waitFor } from '@testing-library/react';
import { DISABLE_CREATE_LETTER_PAGE, DISABLE_DRAFT_PAGE, DISABLE_CREATE_MANUAL_LETTER_PAGE } from './constants';
import generateRouter, { routes } from './AppRoutes';
import { APP_API_ENDPOINT } from './http/authenticatedAxios';
import upsertUser from './oidc/SaveUserToken';
import SearchReceipt from './pages/search/SearchReceipt';
import SearchLetters from './pages/search/SearchLetters';
import CreateLetter from './pages/search/CreateLetter';
import CreateManualLetter from './pages/search/CreateManualLetter';
// Admin
import AdminIndex from './pages/admin/AdminIndex';
// LetterType
import ListLetterTypes from './pages/admin/letterTypes/ListLetterTypes';
import CreateLetterType from './pages/admin/letterTypes/CreateLetterType';
import EditLetterType from './pages/admin/letterTypes/EditLetterType';
// Header
import ListHeaders from './pages/admin/headers/ListHeaders';
import CreateHeader from './pages/admin/headers/CreateHeader';
import EditHeader from './pages/admin/headers/EditHeader';
// FormType
import ListFormTypes from './pages/admin/formTypes/ListFormTypes';
import EditFormType from './pages/admin/formTypes/EditFormType';
import CreateFormType from './pages/admin/formTypes/CreateFormType';
// Contact
import ManageContacts from './pages/contacts/ManageContacts';
// Organization
import ListOrganizations from './pages/admin/organizations/ListOrganizations';
import CreateOrganization from './pages/admin/organizations/CreateOrganization';
import EditOrganization from './pages/admin/organizations/EditOrganization';
// Users
import ListUsers from './pages/admin/users/ListUsers';
import EditUser from './pages/admin/users/EditUser';

import Letter from './pages/draft/Letter';
import DraftPreview from './pages/draft/preview/DraftPreview';

import AppProvider from './AppProvider';

// Snippet
import ListSnippets from './pages/admin/snippets/ListSnippets';
import CreateSnippet from './pages/admin/snippets/CreateSnippet';
import EditSnippet from './pages/admin/snippets/EditSnippet';

// Supporting Docs
import ListSupportingDocuments from './pages/admin/supportingDocuments/ListSupportingDocuments';
import CreateSupportingDocument from './pages/admin/supportingDocuments/CreateSupportingDocument';

// Enclosures
import ListEnclosures from './pages/admin/enclosures/ListEnclosures';
import CreateEnclosure from './pages/admin/enclosures/CreateEnclosure';
import EditEnclosure from './pages/admin/enclosures/EditEnclosure';

// Class Preferences
import ListClassPreferences from './pages/admin/classPreferences/ListClassPreferences';

import { adminProtected, isoProtected } from './guards/ScribeRouteGuard';

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
      active: true,
    },
    {
      id: '046d870e-3b13-4700-b6b5-af460933a62b',
      name: 'Nebraska Service Center',
      active: true,
    },
  ],
};

const ISO_PERMISSION_VALUE = 'ISO';
const ADMIN_PERMISSION_VALUE = 'admin';
const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });

jest.mock('./guards/ScribeRouteGuard');
jest.mock('./oidc/SaveUserToken');
function TestPage() {
  return <div>Hello world!</div>;
}

adminProtected.mockImplementation(() => <TestPage />);
isoProtected.mockImplementation(() => <TestPage />);

const renderComponentWithUrl = (url) => {
  const router = createMemoryRouter(routes(), {
    initialEntries: [{ pathname: url }],
  });
  render(
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
};

const createSuccessfulDraftsCall = () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/letters`).reply(200, []);
};

describe('Routes and authorization', () => {
  beforeEach(() => {
    upsertUser.mockImplementation(() => null);
    mockAxios.reset();
    createSuccessfulDraftsCall();
    mockAxios.onGet(`${APP_API_ENDPOINT}/users/current_user_with_organizations`).reply(200, userAndDefaultOrgs);
  });
  [
    { url: '/', permission: ISO_PERMISSION_VALUE, page: SearchReceipt },
    {
      url: '/searchLetters',
      permission: ISO_PERMISSION_VALUE,
      page: SearchLetters,
    },
    {
      url: '/draft/preview/asdf',
      permission: ISO_PERMISSION_VALUE,
      page: DraftPreview,
    },
    {
      url: `/${DISABLE_DRAFT_PAGE}`,
      permission: ISO_PERMISSION_VALUE,
      page: Letter,
    },
    {
      url: `/${DISABLE_DRAFT_PAGE}/asdf`,
      permission: ISO_PERMISSION_VALUE,
      page: Letter,
    },
    {
      url: `/${DISABLE_CREATE_LETTER_PAGE}`,
      permission: ISO_PERMISSION_VALUE,
      page: CreateLetter,
    },
    {
      url: `/${DISABLE_CREATE_MANUAL_LETTER_PAGE}`,
      permission: ISO_PERMISSION_VALUE,
      page: CreateManualLetter,
    },
    {
      url: '/contacts/asdf',
      permission: ISO_PERMISSION_VALUE,
      page: ManageContacts,
    },
    { url: '/admin', permission: ADMIN_PERMISSION_VALUE, page: AdminIndex },

    {
      url: '/admin/lettertypes',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListLetterTypes,
    },
    {
      url: '/admin/lettertypes/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateLetterType,
    },
    {
      url: '/admin/lettertypes/edit/asdf',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditLetterType,
    },

    {
      url: '/admin/headers',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListHeaders,
    },
    {
      url: '/admin/headers/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateHeader,
    },
    {
      url: '/admin/headers/asdf',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditHeader,
    },

    {
      url: '/admin/formtypes',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListFormTypes,
    },
    {
      url: '/admin/formtypes/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateFormType,
    },
    {
      url: '/admin/formtypes/asdf',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditFormType,
    },

    {
      url: '/admin/organizations',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListOrganizations,
    },
    {
      url: '/admin/organizations/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateOrganization,
    },
    {
      url: '/admin/organizations/asdf',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditOrganization,
    },

    {
      url: '/admin/users',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListUsers,
    },
    {
      url: '/admin/users/asdf',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditUser,
    },

    {
      url: '/admin/snippets',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListSnippets,
    },
    {
      url: '/admin/snippets/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateSnippet,
    },
    {
      url: '/admin/snippets/edit',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditSnippet,
    },
    {
      url: '/admin/supportingdocuments',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListSupportingDocuments,
    },
    {
      url: '/admin/supportingdocuments/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateSupportingDocument,
    },
    {
      url: '/admin/enclosures',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListEnclosures,
    },
    {
      url: '/admin/enclosures/create',
      permission: ADMIN_PERMISSION_VALUE,
      page: CreateEnclosure,
    },
    {
      url: '/admin/enclosures/edit',
      permission: ADMIN_PERMISSION_VALUE,
      page: EditEnclosure,
    },
    {
      url: '/admin/classpreferences',
      permission: ADMIN_PERMISSION_VALUE,
      page: ListClassPreferences,
    },
  ].forEach((testCase) => {
    describe(testCase.url, () => {
      it(
        `verifies the ${testCase.permission === ISO_PERMISSION_VALUE ? ISO_PERMISSION_VALUE : ADMIN_PERMISSION_VALUE} permission for ` +
          `the ${testCase.url} route`,
        async () => {
          renderComponentWithUrl(testCase.url);

          waitFor(() => {
            expect(screen.getByText(`${userAndDefaultOrgs.first_name} ${userAndDefaultOrgs.last_name}`)).toBeVisible();
            if (testCase.permission === ISO_PERMISSION_VALUE) {
              expect(isoProtected.mock.calls.find((call) => call[0] === testCase.page)).toBeDefined();
            } else {
              expect(adminProtected.mock.calls.find((call) => call[0] === testCase.page)).toBeDefined();
            }
          });
        }
      );
    });
  });
});

describe('generateRouter', () => {
  it('loads up routes', () => {
    const router = generateRouter();

    expect(router.routes).toHaveLength(routes().length);
  });
});
