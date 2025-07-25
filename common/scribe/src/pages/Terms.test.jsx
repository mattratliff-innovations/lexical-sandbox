import React, { act, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Terms from './Terms';

const renderComponent = async () => {
  await act(async () => {
    render(
      <BrowserRouter>
        <Terms />
      </BrowserRouter>
    );
  });
};

describe('Terms Page', () => {
  beforeEach(async () => {
    await renderComponent();
  });

  it('displays Terms page', async () => {
    const h1Element = screen.getByTestId('termsHeader');
    expect(h1Element).toHaveTextContent('Terms');

    expect(screen.getByTestId('page-content')).toHaveTextContent('This page explains the terms and conditions');
  });
});
