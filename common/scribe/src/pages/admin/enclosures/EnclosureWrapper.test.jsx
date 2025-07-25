import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EnclosureWrapper from './EnclosureWrapper';

let mockedUseLocation = '/admin/enclosures';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <EnclosureWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Enclosure Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Enclosure' })).toHaveAttribute('href', '/admin/enclosures/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/enclosures/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Enclosures' })).toHaveAttribute('href', '/admin/enclosures');
});
