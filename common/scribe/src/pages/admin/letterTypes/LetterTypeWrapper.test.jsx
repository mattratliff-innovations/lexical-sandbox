import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LetterTypeWrapper from './LetterTypeWrapper';

let mockedUseLocation = '/admin/lettertypes';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <LetterTypeWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays the Letter Type Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Letter Type' })).toHaveAttribute('href', '/admin/lettertypes/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/lettertypes/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Letter Types' })).toHaveAttribute('href', '/admin/lettertypes');
});
