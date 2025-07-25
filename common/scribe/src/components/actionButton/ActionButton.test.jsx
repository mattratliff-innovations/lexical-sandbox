import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import ActionButton from './ActionButton';
// Mock icon component
function MockIcon() {
  return <svg data-testid="mock-icon" />;
}

describe('ActionButton Component', () => {
  test('renders a button when navLinkURL is not provided', () => {
    render(<ActionButton icon={MockIcon} text="Click Me" />);

    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('action-button__btn');
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('renders a NavLink when navLinkURL is provided', () => {
    render(
      <Router>
        <ActionButton icon={MockIcon} navLinkURL="/home" text="Go Home" />
      </Router>
    );

    const navLinkElement = screen.getByRole('link', { name: /go home/i });
    expect(navLinkElement).toBeInTheDocument();
    expect(navLinkElement).toHaveClass('action-button__link');
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('applies active class to NavLink when it is active', () => {
    render(
      <Router>
        <ActionButton icon={MockIcon} navLinkURL="/" text="Home" />
      </Router>
    );

    const navLinkElement = screen.getByRole('link', { name: /home/i });
    expect(navLinkElement).toBeInTheDocument();
    expect(navLinkElement).toHaveClass('action-button__link active');
  });
});
