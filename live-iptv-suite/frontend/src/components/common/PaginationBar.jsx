import React from 'react';
import { Box, Typography, Pagination } from '@mui/material';

export default function PaginationBar({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  currentItemsCount = 0,
  itemLabel = 'items',
  onPageChange,
  sx = {},
}) {
  if (totalPages <= 1) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 4,
        mb: 3,
        p: 2,
        bgcolor: '#0d0d10',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        gap: 2,
        ...sx,
      }}
    >
      <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 600 }}>
        Page <span style={{ color: '#ffffff', fontWeight: 800 }}>{currentPage}</span> of{' '}
        <span style={{ color: '#ffffff', fontWeight: 800 }}>{totalPages}</span> • Showing {currentItemsCount} of {totalItems} {itemLabel}
      </Typography>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={onPageChange}
        color="primary"
        size="medium"
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            color: '#ffffff',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            fontWeight: 700,
            borderRadius: 2,
            fontFamily: '"Outfit", sans-serif',
            '&:hover': {
              bgcolor: 'rgba(225, 29, 72, 0.25)',
            },
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 10px rgba(225, 29, 72, 0.4)',
            },
          },
        }}
      />
    </Box>
  );
}
