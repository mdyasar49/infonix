import React from 'react';
import { Box, Typography } from '@mui/material';

export default function LiveBadge({ size = 'medium', sx = {} }) {
  const isSmall = size === 'small';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 0.4 : 0.6,
        bgcolor: 'rgba(225, 29, 72, 0.9)',
        color: '#ffffff',
        px: isSmall ? 0.6 : 1,
        py: isSmall ? 0.15 : 0.3,
        borderRadius: 1,
        fontWeight: 800,
        fontSize: isSmall ? '0.62rem' : '0.68rem',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        ...sx,
      }}
    >
      <span
        className="live-dot"
        style={{
          width: isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
          backgroundColor: '#ffffff',
        }}
      />
      <span>LIVE</span>
    </Box>
  );
}
