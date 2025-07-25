import React, { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import StandardParagraphWrapper from './StandardParagraphWrapper';

let mockedUseLocation = '/admin/standardparagraphs';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: mockedUseLocation,
  }),
}));

const renderComponent = () => {
  render(
    <BrowserRouter>
      <StandardParagraphWrapper />
    </BrowserRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('displays Standard Paragraph Menu', () => {
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to System Admin' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Create Standard Paragraph' })).toHaveAttribute('href', '/admin/standardparagraphs/create');
});

it('displays the Back to Menu Item', () => {
  mockedUseLocation = '/admin/standardparagraphs/create';
  renderComponent();
  expect(screen.getByRole('link', { name: 'Back to All Standard Paragraphs' })).toHaveAttribute('href', '/admin/standardparagraphs');
});
