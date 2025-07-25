import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingGuard from './LoadingGuard';

// Mock SkeletonPage to keep tests focused
jest.mock(
  '../components/SkeletonPage',
  () =>
    function MockSkeletonPage() {
      return <div data-testid="skeleton-page" />;
    }
);

describe('LoadingGuard', () => {
  test('renders fallback when loading is true (default)', () => {
    render(
      <LoadingGuard loading>
        <div data-testid="content">Content</div>
      </LoadingGuard>
    );
    expect(screen.getByTestId('skeleton-page')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('renders children when loading is false', () => {
    render(
      <LoadingGuard loading={false}>
        <div data-testid="content">Content</div>
      </LoadingGuard>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-page')).not.toBeInTheDocument();
  });

  test('renders blank fallback when blank=true and loading=true', () => {
    render(
      <LoadingGuard loading blank>
        <div data-testid="content">Content</div>
      </LoadingGuard>
    );
    const blankDiv = screen.getByTestId('loading-blank');
    expect(blankDiv).toBeInTheDocument();
    expect(blankDiv).toHaveStyle('display: none');
    expect(blankDiv).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('renders custom fallback when fallback prop is provided and loading=true', () => {
    render(
      <LoadingGuard loading fallback={<div data-testid="custom-fallback">Custom</div>}>
        <div data-testid="content">Content</div>
      </LoadingGuard>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('renders null when no children and loading is false', () => {
    const { container } = render(<LoadingGuard loading={false} />);
    expect(container.firstChild).toBeNull();
  });
});
