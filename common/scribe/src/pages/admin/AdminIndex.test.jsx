import React, { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AdminIndex from './AdminIndex';

afterEach(cleanup);

beforeEach(async () => {
  render(
    <BrowserRouter>
      <AdminIndex />
    </BrowserRouter>
  );
});

it('displays Enterprise-Wide Correspondence System Administration', async () => {
  const headers = [
    'Form Types',
    'Letter Types',
    'Letter Headers',
    'Users',
    'Organizations',
    'Standard Paragraphs',
    'Manage Standard Placeholder Snippets',
    'Supporting Documents',
    'Enclosures',
    'Class Preferences',
    'Manage Feature Flags',
  ];
  const renderedHeaders = document.querySelectorAll('[slot="heading"]');
  renderedHeaders.forEach((headerEl, index) => expect(headerEl).toHaveTextContent(headers[index]));
});
