import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Footer from './Footer';

jest.mock('../assets/scribe-logo.png', () => 'scribe-logo.png');

describe('Footer', () => {
  it('has helpful text', () => {
    render(<Footer />);

    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
    expect(screen.getByText('Report a Defect')).toBeInTheDocument();
    expect(screen.getByText('USCIS Connect')).toBeInTheDocument();
  });

  it('renders Scribe logo correctly with src, title, and alt', async () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const scribeLogo = await screen.findByAltText('Scribe Home');

    // const scribeLogo = screen.getByAltText('Scribe Home');
    expect(scribeLogo).toBeInTheDocument();
    expect(scribeLogo).toHaveAttribute('src', 'scribe-logo.png');
    expect(scribeLogo).toHaveAttribute('title', 'Scribe Home');
    expect(scribeLogo).toHaveAttribute('alt', 'Scribe Home');
  });

  it('Back to Top works by clicking', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const backToTopLink = screen.getByText(/Back to Top/i);
    expect(backToTopLink).toBeInTheDocument();

    await user.click(backToTopLink);

    expect(window.location.hash).toBe('#content-start');
  });

  it('Back to Top works by tabbing', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const backToTopLink = screen.getByText(/Back to Top/i);
    expect(backToTopLink).toBeInTheDocument();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(window.location.hash).toBe('#content-start');
  });
});
