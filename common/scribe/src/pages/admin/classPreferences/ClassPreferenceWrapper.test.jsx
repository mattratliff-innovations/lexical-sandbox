import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ClassPreferenceWrapper from './ClassPreferenceWrapper';

let mockedUseLocation = '/admin/classPreferences';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <ClassPreferenceWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Class Preference Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Class Preference' })).toHaveAttribute('href', '/admin/classPreferences/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/classPreferences/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Class Preferences' })).toHaveAttribute('href', '/admin/classPreferences');
});
