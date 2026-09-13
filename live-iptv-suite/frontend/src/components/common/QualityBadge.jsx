import React from 'react';
import { Chip } from '@mui/material';

export default function QualityBadge({ quality = '1080p FHD', size = 'small', sx = {} }) {
  const is4K = quality?.toUpperCase().includes('4K');

  return (
    <Chip
      label={quality || 'HD'}
      size={size}
      sx={{
        height: size === 'small' ? 20 : 24,
        fontSize: size === 'small' ? '0.65rem' : '0.72rem',
        fontWeight: 800,
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        color: is4K ? '#f97316' : '#00e5ff',
        border: is4K ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(0, 229, 255, 0.4)',
        backdropFilter: 'blur(4px)',
        fontFamily: '"Space Mono", monospace',
        ...sx,
      }}
    />
  );
}
