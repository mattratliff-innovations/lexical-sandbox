import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SnippetWrapper from './SnippetWrapper';

let mockedUseLocation = '/admin/snippets';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <SnippetWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Snippet Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Placeholder Snippet' })).toHaveAttribute('href', '/admin/snippets/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/snippets/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Placeholder Snippets' })).toHaveAttribute('href', '/admin/snippets');
});
