import * as React from 'react';
import { render, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { createMemoryRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
// import ManageContacts from './SupportingDocumentContent';
import { APP_API_ENDPOINT } from '../../../http/authenticatedAxios';
import TestLayout from '../../../../testSetup/admin/TestLayout';
import SupportingDocumentContent from './SupportingDocumentContent';

const mockAxios = new MockAdapter(axios, { onNoMatch: 'throwException' });
const SUPPORTING_DOCUMENT_ID = '5966c446-51aa-49be-b0db-afcdee71e1ba';

const mockData = {
  id: SUPPORTING_DOCUMENT_ID,
  name: 'bbbbbbbbbb',
  active: true,
  margin_top: '0.65',
  margin_bottom: '1.0',
  margin_left: '1.0',
  margin_right: '1.0',
  created_at: '2025-05-21T16:12:30.129Z',
  updated_at: '2025-05-21T17:23:27.163Z',
  supporting_document_sections: [
    {
      id: '53a335d4-7299-493b-b4bf-d5ed310d9a07',
      supporting_document_id: '0f66c6b5-f5f7-4017-9169-c810090b9c84',
      text: '\u003cp class="editor-paragraph" dir="ltr"\u003e\u003cspan style="white-space: pre-wrap;"\u003ebbbbbbb ffffffff rrrrrr\u003c/span\u003e\u003c/p\u003e',
      order: 0,
      locked: false,
      created_at: '2025-05-21T16:19:10.179Z',
      updated_at: '2025-05-21T17:23:13.038Z',
    },
  ],
  supporting_document_form_letter_xrefs: [],
};
// Mock useParams
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: SUPPORTING_DOCUMENT_ID }),
  useNavigate: () => mockedUseNavigate,
}));

const renderComponent = async () => {
  const routes = createRoutesFromElements(
    <Route path="/" element={<TestLayout />}>
      <Route path="/admin/supportingdocuments/content/:id" element={<SupportingDocumentContent />} />
    </Route>
  );

  const router = createMemoryRouter(routes, {
    initialEntries: ['/', '/admin/supportingdocuments/content/:id'],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
};

const setMockDataAndRenderComponent = async () => {
  mockAxios.onGet(`${APP_API_ENDPOINT}/supporting_documents/${SUPPORTING_DOCUMENT_ID}`).reply(200, mockData);
  await renderComponent();
};

describe('Supporting Document Content', () => {
  afterEach(async () => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  it('displays supporting Document Content', async () => {
    await setMockDataAndRenderComponent();
    expect(screen.getByText('Supporting Document Content')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Back to Document Details')).toBeInTheDocument();
    expect(screen.getByText('Save Supporting Document')).toBeInTheDocument();

    // Verify certain editor values are turned off
    expect(await screen.queryByText('Preview Letter')).not.toBeInTheDocument();
    expect(await screen.queryByText('Review Actions')).not.toBeInTheDocument();
    expect(await screen.queryByText('Letter Recipients')).not.toBeInTheDocument();
    expect(await screen.queryByText('Manage Contacts')).not.toBeInTheDocument();
  });
});
