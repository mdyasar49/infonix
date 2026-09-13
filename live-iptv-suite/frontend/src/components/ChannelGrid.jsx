import React, { useState, useMemo, useCallback } from 'react';
import { Grid, Box, Typography, Skeleton, Pagination, Chip } from '@mui/material';
import TvOffIcon from '@mui/icons-material/TvOff';
import ChannelCard from './ChannelCard';

const CHANNELS_PER_PAGE = 48; // 4 cols x 12 rows - sweet spot for performance

export default function ChannelGrid({
  channels,
  selectedChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  loading,
}) {
  const [page, setPage] = useState(1);

  // Reset page when channels list changes (language/category filter)
  const channelKey = useMemo(() => channels.map(c => c.id).join(',').slice(0, 100), [channels]);
  React.useEffect(() => { setPage(1); }, [channelKey]);

  const totalPages = Math.ceil(channels.length / CHANNELS_PER_PAGE);
  const paginatedChannels = useMemo(() => {
    const start = (page - 1) * CHANNELS_PER_PAGE;
    return channels.slice(start, start + CHANNELS_PER_PAGE);
  }, [channels, page]);

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    window.scrollTo({ top: 280, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
            <Skeleton
              variant="rounded"
              height={140}
              sx={{ borderRadius: 4, backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <TvOffIcon sx={{ fontSize: 60, color: '#475569', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600 }}>
          No Channels Found
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Try clearing search keywords or selecting another category.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page info + quick stats */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Chip
            label={`Page ${page} of ${totalPages} • Showing ${paginatedChannels.length} of ${channels.length}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </Box>
      )}

      <Grid container spacing={2.5}>
        {paginatedChannels.map((ch) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={ch.id}>
            <ChannelCard
              channel={ch}
              isSelected={selectedChannel && selectedChannel.id === ch.id}
              onSelect={onSelectChannel}
              isFavorite={favorites.includes(ch.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 3,
            mb: 1,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#94a3b8',
                fontWeight: 600,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(6, 182, 212, 0.9)',
                  color: '#000',
                  fontWeight: 800,
                  '&:hover': {
                    backgroundColor: '#0891b2',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
