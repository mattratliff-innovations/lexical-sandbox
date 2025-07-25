import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import OrganizationWrapper from './OrganizationWrapper';

let mockedUseLocation = '/admin/organizations';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <OrganizationWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays the Organization Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Organization' })).toHaveAttribute('href', '/admin/organizations/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/organizations/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Organizations' })).toHaveAttribute('href', '/admin/organizations');
});
