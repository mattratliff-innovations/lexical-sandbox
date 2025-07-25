import React from 'react';

import { Route, Navigate, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { adminProtected, isoProtected } from './guards/ScribeRouteGuard';
import RootLayout from './layouts/RootLayout';

import { DISABLE_CREATE_LETTER_PAGE, DISABLE_CREATE_MANUAL_LETTER_PAGE } from './constants';

// Routes
import SearchReceipt from './pages/search/SearchReceipt';
import CorHistory from './pages/correspondenceHistory';

import SearchLetters from './pages/search/SearchLetters';
import CreateLetter from './pages/search/CreateLetter';
import CreateManualLetter from './pages/search/CreateManualLetter';
// Admin
import AdminIndex from './pages/admin/AdminIndex';
// Feature Flags
import FlagWrapper from './pages/admin/flag/FlagWrapper';
import ListFlag from './pages/admin/flag/ListFlag';
// LetterType
import LetterTypeWrapper from './pages/admin/letterTypes/LetterTypeWrapper';
import ListLetterTypes from './pages/admin/letterTypes/ListLetterTypes';
import CreateLetterType from './pages/admin/letterTypes/CreateLetterType';
import EditLetterType from './pages/admin/letterTypes/EditLetterType';
// Header
import HeaderWrapper from './pages/admin/headers/HeaderWrapper';
import ListHeaders from './pages/admin/headers/ListHeaders';
import CreateHeader from './pages/admin/headers/CreateHeader';
import EditHeader from './pages/admin/headers/EditHeader';
// FormType
import FormTypeWrapper from './pages/admin/formTypes/FormTypeWrapper';
import ListFormTypes from './pages/admin/formTypes/ListFormTypes';
import EditFormType from './pages/admin/formTypes/EditFormType';
import CreateFormType from './pages/admin/formTypes/CreateFormType';
// Contact
import ManageContacts from './pages/contacts/ManageContacts';
// Organization
import OrganizationWrapper from './pages/admin/organizations/OrganizationWrapper';
import ListOrganizations from './pages/admin/organizations/ListOrganizations';
import CreateOrganization from './pages/admin/organizations/CreateOrganization';
import EditOrganization from './pages/admin/organizations/EditOrganization';
// Users
import UserWrapper from './pages/admin/users/UserWrapper';
import ListUsers from './pages/admin/users/ListUsers';
import EditUser from './pages/admin/users/EditUser';
// StandardParagraph
import StandardParagraphWrapper from './pages/admin/standardParagraphs/StandardParagraphWrapper';
import ListStandardParagraphs from './pages/admin/standardParagraphs/ListStandardParagraphs';
import EditStandardParagraph from './pages/admin/standardParagraphs/EditStandardParagraph';
import CreateStandardParagraph from './pages/admin/standardParagraphs/CreateStandardParagraph';
// Snippet
import SnippetWrapper from './pages/admin/snippets/SnippetWrapper';
import ListSnippets from './pages/admin/snippets/ListSnippets';
import EditSnippet from './pages/admin/snippets/EditSnippet';
import CreateSnippet from './pages/admin/snippets/CreateSnippet';
// SupportingDocument
import SupportingDocumentWrapper from './pages/admin/supportingDocuments/SupportingDocumentWrapper';
import ListSupportingDocuments from './pages/admin/supportingDocuments/ListSupportingDocuments';
import EditSupportingDocument from './pages/admin/supportingDocuments/EditSupportingDocument';
import CreateSupportingDocument from './pages/admin/supportingDocuments/CreateSupportingDocument';
import SupportingDocumentContent from './pages/admin/supportingDocuments/SupportingDocumentContent';
// Enclosures
import EnclosureWrapper from './pages/admin/enclosures/EnclosureWrapper';
import ListEnclosures from './pages/admin/enclosures/ListEnclosures';
import EditEnclosure from './pages/admin/enclosures/EditEnclosure';
import CreateEnclosure from './pages/admin/enclosures/CreateEnclosure';
// Class Preferences
import ClassPreferenceWrapper from './pages/admin/classPreferences/ClassPreferenceWrapper';
import ListClassPreferences from './pages/admin/classPreferences/ListClassPreferences';
import EditClassPreference from './pages/admin/classPreferences/EditClassPreference';
import CreateClassPreference from './pages/admin/classPreferences/CreateClassPreference';

import Letter from './pages/draft/Letter';
import DraftPreview from './pages/draft/preview/DraftPreview';
import LetterPreview from './pages/draft/preview/LetterPreview';
import Logout from './pages/logout/Logout';
import Terms from './pages/Terms';
import PageTitle from './components/PageTitle';

const routes = () =>
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/" element={isoProtected(SearchReceipt, { title: 'Scribe Home' })} />
      <Route
        path="/searchLetters"
        element={isoProtected(SearchLetters, {
          title: 'Search Letters | Scribe',
        })}
      />
      <Route
        path="/correspondenceHistory"
        element={isoProtected(CorHistory, {
          title: 'Correspondence History | Scribe',
        })}
      />
      <Route
        path="/draft/preview/:id"
        element={isoProtected(DraftPreview, {
          title: 'Letter Editor Print Preview | Scribe',
        })}
      />
      <Route
        path="/letter/preview/:id"
        element={isoProtected(LetterPreview, {
          title: 'Letter Preview | Scribe',
        })}
      />
      <Route path="/draft/:id" element={isoProtected(Letter, { title: 'Letter Editor | Scribe' })} />
      <Route
        path={`/${DISABLE_CREATE_LETTER_PAGE}`}
        element={isoProtected(CreateLetter, {
          title: 'Create Letter | Scribe',
        })}
      />
      <Route
        path={`/${DISABLE_CREATE_MANUAL_LETTER_PAGE}`}
        element={isoProtected(CreateManualLetter, {
          title: 'Create Letter Manually | Scribe',
        })}
      />
      <Route
        path="/contacts/:id"
        element={isoProtected(ManageContacts, {
          title: 'Manage Contacts | Scribe',
        })}
      />
      <Route path="/admin" element={adminProtected(AdminIndex, { title: 'Admin | Scribe' })} />
      <Route
        path="/admin/supportingdocuments/content/:id"
        element={adminProtected(SupportingDocumentContent, {
          title: 'Create Supporting Document Content | Scribe',
        })}
      />

      <Route
        path="/admin/lettertypes"
        element={adminProtected(LetterTypeWrapper, {
          title: 'Letter Types | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListLetterTypes, {
            title: 'Letter Types | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateLetterType, {
            title: 'Create Letter Type | Scribe',
          })}
        />
        <Route
          path="edit/:id"
          element={adminProtected(EditLetterType, {
            title: 'Edit Letter Type | Scribe',
          })}
        />
      </Route>

      <Route path="/admin/headers" element={adminProtected(HeaderWrapper, { title: 'Headers | Scribe' })}>
        <Route index element={adminProtected(ListHeaders, { title: 'Headers | Scribe' })} />
        <Route
          path="create"
          element={adminProtected(CreateHeader, {
            title: 'Create Header | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditHeader, {
            title: 'Edit Header | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/formtypes"
        element={adminProtected(FormTypeWrapper, {
          title: 'Form Types | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListFormTypes, {
            title: 'Form Types | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateFormType, {
            title: 'Create Form Type | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditFormType, {
            title: 'Edit Form Type | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/organizations"
        element={adminProtected(OrganizationWrapper, {
          title: 'Organizations | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListOrganizations, {
            title: 'Organizations | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateOrganization, {
            title: 'Create Organization | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditOrganization, {
            title: 'Edit Organization | Scribe',
          })}
        />
      </Route>

      <Route path="/admin/users" element={adminProtected(UserWrapper, { title: 'Users | Scribe' })}>
        <Route index element={adminProtected(ListUsers, { title: 'Users | Scribe' })} />
        <Route path=":id" element={adminProtected(EditUser, { title: 'Edit User | Scribe' })} />
      </Route>

      <Route
        path="/admin/flags"
        element={adminProtected(FlagWrapper, {
          title: 'Feature Flags | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListFlag, {
            title: 'Feature Flags | Scribe',
          })}
        />
        {/* <Route
          path=":id"
          element={adminProtected(EditUser, { title: 'Edit User | Scribe' })}
        /> */}
      </Route>

      <Route
        path="/admin/standardparagraphs"
        element={adminProtected(StandardParagraphWrapper, {
          title: 'Standard Paragraphs | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListStandardParagraphs, {
            title: 'Standard Paragraphs | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateStandardParagraph, {
            title: 'Create Standard Paragraph | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditStandardParagraph, {
            title: 'Edit Standard Paragraph | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/snippets"
        element={adminProtected(SnippetWrapper, {
          title: 'Snippets | Scribe',
        })}>
        <Route index element={adminProtected(ListSnippets, { title: 'Snippets | Scribe' })} />
        <Route
          path="create"
          element={adminProtected(CreateSnippet, {
            title: 'Create Snippet | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditSnippet, {
            title: 'Edit Snippet | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/supportingdocuments"
        element={adminProtected(SupportingDocumentWrapper, {
          title: 'Supporting Documents | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListSupportingDocuments, {
            title: 'Supporting Documents | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateSupportingDocument, {
            title: 'Create Supporting Document | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditSupportingDocument, {
            title: 'Edit Supporting Document | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/enclosures"
        element={adminProtected(EnclosureWrapper, {
          title: 'Enclosures | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListEnclosures, {
            title: 'Enclosures | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateEnclosure, {
            title: 'Create Enclosure | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditEnclosure, {
            title: 'Edit Enclosures | Scribe',
          })}
        />
      </Route>

      <Route
        path="/admin/classPreferences"
        element={adminProtected(ClassPreferenceWrapper, {
          title: 'Class Preferences | Scribe',
        })}>
        <Route
          index
          element={adminProtected(ListClassPreferences, {
            title: 'Class Preferences | Scribe',
          })}
        />
        <Route
          path="create"
          element={adminProtected(CreateClassPreference, {
            title: 'Create Class Preferences | Scribe',
          })}
        />
        <Route
          path=":id"
          element={adminProtected(EditClassPreference, {
            title: 'Edit Class Preferences | Scribe',
          })}
        />
      </Route>

      <Route
        path="/logout"
        element={
          <PageTitle title="Logout | Scribe">
            <Logout />
          </PageTitle>
        }
      />
      <Route
        path="/terms"
        element={
          <PageTitle title="Terms | Scribe">
            <Terms />
          </PageTitle>
        }
      />
    </Route>
  );

const generateRouter = () => createBrowserRouter(routes());

export default generateRouter;
export { routes };
