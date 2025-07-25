import { waitFor, screen } from '@testing-library/react';

export default async function waitForLoadingToFinish() {
  await waitFor(() => {
    // Works for both SkeletonPage and blank fallbacks
    const stillLoading = screen.queryByTestId('skeleton-page') || screen.queryByTestId('loading-blank');
    if (stillLoading) {
      throw new Error('Still loading...');
    }
  });
}
