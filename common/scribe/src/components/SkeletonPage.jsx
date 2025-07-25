import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

export default function SkeletonPage() {
  return (
    <Box sx={{ width: '100%' }} data-testid="skeleton-page">
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={410} sx={{ borderRadius: 2, mb: 2 }} />
      <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="90%" />
    </Box>
  );
}
