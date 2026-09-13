import React, { useState, useMemo } from 'react';
import { Grid, Box, Typography, Skeleton } from '@mui/material';
import TvOffIcon from '@mui/icons-material/TvOff';
import ChannelCard from './ChannelCard';
import PaginationBar from './common/PaginationBar';

const ITEMS_PER_PAGE = 48;

export default function ChannelGrid({
  channels = [],
  selectedChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite,
  loading = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(channels.length / ITEMS_PER_PAGE);

  const paginatedChannels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return channels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [channels, currentPage]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        {Array.from(new Array(12)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Box sx={{ bgcolor: '#0d0d10', borderRadius: 3.5, overflow: 'hidden', p: 0 }}>
              <Skeleton variant="rectangular" width="100%" sx={{ pt: '56.25%', bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
              <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
                <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton width="80%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 0.5 }} />
                  <Skeleton width="50%" height={16} sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (channels.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 3,
          textAlign: 'center',
          bgcolor: '#0d0d10',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            bgcolor: 'rgba(225, 29, 72, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <TvOffIcon sx={{ fontSize: 36, color: '#e11d48' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>
          No Channels Found
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 420 }}>
          Try clearing your search query or selecting a different language / genre category.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2.5}>
        {paginatedChannels.map((channel) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={channel.id}>
            <ChannelCard
              channel={channel}
              isSelected={selectedChannel?.id === channel.id}
              onSelect={onSelectChannel}
              isFavorite={favorites.includes(channel.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </Grid>
        ))}
      </Grid>

      {/* Reusable YouTube Pagination Bar */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={channels.length}
        currentItemsCount={paginatedChannels.length}
        itemLabel="channels"
        onPageChange={handlePageChange}
      />
    </Box>
  );
}
