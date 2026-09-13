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
        userSelect: 'none',
        ...sx,
      }}
    >
      {/* 100% MUI Animated Pulsing Dot */}
      <Box
        component="span"
        sx={{
          width: isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
          bgcolor: '#ffffff',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'mui-pulse-live 1.8s infinite',
          '@keyframes mui-pulse-live': {
            '0%': {
              transform: 'scale(0.95)',
              boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.8)',
            },
            '70%': {
              transform: 'scale(1)',
              boxShadow: '0 0 0 6px rgba(255, 255, 255, 0)',
            },
            '100%': {
              transform: 'scale(0.95)',
              boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)',
            },
          },
        }}
      />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 1,
        }}
      >
        LIVE
      </Typography>
    </Box>
  );
}
