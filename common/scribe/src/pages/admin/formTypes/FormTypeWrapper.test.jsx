import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import FormTypeWrapper from './FormTypeWrapper';

let mockedUseLocation = '/admin/formtypes';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <FormTypeWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Form Type Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Form Type' })).toHaveAttribute('href', '/admin/formtypes/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/formtypes/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Form Types' })).toHaveAttribute('href', '/admin/formtypes');
});
