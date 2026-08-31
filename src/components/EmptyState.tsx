import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export default function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ textAlign: 'center', py: 7, px: 3 }}>
      <Typography sx={{ fontSize: 56, lineHeight: 1, mb: 1.5 }}>{emoji}</Typography>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {body ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 340, mx: 'auto' }}>
          {body}
        </Typography>
      ) : null}
      {action}
    </Box>
  );
}
