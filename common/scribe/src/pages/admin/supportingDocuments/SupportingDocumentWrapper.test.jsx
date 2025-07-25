import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SupportingDocumentWrapper from './SupportingDocumentWrapper';

let mockedUseLocation = '/admin/supportingdocuments';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <SupportingDocumentWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Supporting Document Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Supporting Document' })).toHaveAttribute('href', '/admin/supportingdocuments/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/supportingdocuments/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Supporting Documents' })).toHaveAttribute('href', '/admin/supportingdocuments');
});
