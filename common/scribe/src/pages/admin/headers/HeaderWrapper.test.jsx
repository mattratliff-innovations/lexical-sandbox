import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import HeaderWrapper from './HeaderWrapper';

let mockedUseLocation = '/admin/headers';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <HeaderWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays the Header Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Letter Header' })).toHaveAttribute('href', '/admin/headers/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/headers/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Headers' })).toHaveAttribute('href', '/admin/headers');
});
