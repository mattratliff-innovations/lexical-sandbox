import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingFallback from './LoadingFallback';

jest.mock(
  '../components/SkeletonPage',
  () =>
    function MockSkeletonPage() {
      return <div data-testid="skeleton-page" />;
    }
);

describe('LoadingFallback', () => {
  it('renders default SkeletonPage fallback', () => {
    render(<LoadingFallback />);
    expect(screen.getByTestId('skeleton-page')).toBeInTheDocument();
  });

  it('renders blank fallback when blank=true', () => {
    render(<LoadingFallback blank />);
    expect(screen.getByTestId('loading-blank')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(<LoadingFallback fallback={<div data-testid="custom-fallback" />} />);
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('prefers custom fallback over blank=true', () => {
    render(<LoadingFallback fallback={<div data-testid="custom-fallback" />} blank />);
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-blank')).not.toBeInTheDocument();
  });
});
