import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserWrapper from './UserWrapper';

let mockedUseLocation = '/admin/users';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <UserWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays the System Admin Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/users/id';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Users' })).toHaveAttribute('href', '/admin/users');
});
