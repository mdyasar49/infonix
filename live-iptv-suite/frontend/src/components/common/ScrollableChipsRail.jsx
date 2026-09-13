import React, { useRef } from 'react';
import { Box, Chip, IconButton, Skeleton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function ScrollableChipsRail({
  items = [],
  selectedId = 'all',
  onSelect,
  showAllOption = false,
  allOptionLabel = 'All',
  allOptionCount = null,
  activeGradient = 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
  loading = false,
  sx = {},
}) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, py: 1, overflowX: 'hidden' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={90}
            height={32}
            sx={{ borderRadius: 20, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', ...sx }}>
      {/* Left Chevron */}
      <IconButton
        size="small"
        onClick={() => handleScroll('left')}
        sx={{
          display: { xs: 'none', sm: 'inline-flex' },
          bgcolor: '#0d0d10',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          mr: 1,
          flexShrink: 0,
          zIndex: 2,
          '&:hover': { bgcolor: 'rgba(225, 29, 72, 0.2)' },
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      {/* Scrolling Chips Container */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          py: 0.5,
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          flexGrow: 1,
        }}
      >
        {/* Optional 'All' chip */}
        {showAllOption && (
          <Chip
            label={`${allOptionLabel}${allOptionCount !== null && allOptionCount !== undefined ? ` (${allOptionCount})` : ''}`}
            clickable
            onClick={() => onSelect('all')}
            sx={{
              fontWeight: selectedId === 'all' ? 700 : 500,
              fontSize: '0.84rem',
              height: 32,
              borderRadius: 20,
              px: 0.5,
              background: selectedId === 'all' ? activeGradient : 'rgba(255, 255, 255, 0.07)',
              color: '#ffffff',
              border: selectedId === 'all' ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: selectedId === 'all' ? '0 2px 10px rgba(225, 29, 72, 0.35)' : 'none',
              '&:hover': {
                background: selectedId === 'all' ? activeGradient : 'rgba(255, 255, 255, 0.12)',
              },
            }}
          />
        )}

        {/* Dynamic Items */}
        {items.map((item) => {
          const id = item.id || item.slug || item.key;
          const isSelected = selectedId === id;
          const label = item.label || item.name || id;
          const count = item.count !== undefined ? item.count : (item.channel_count !== undefined ? item.channel_count : null);

          const chipIcon = React.isValidElement(item.icon) ? item.icon : undefined;

          return (
            <Chip
              key={id}
              icon={chipIcon}
              label={`${label}${count !== null && count !== undefined ? ` (${count})` : ''}`}
              clickable
              onClick={() => onSelect(id)}
              sx={{
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.84rem',
                height: 32,
                borderRadius: 20,
                px: 0.5,
                background: isSelected ? activeGradient : 'rgba(255, 255, 255, 0.07)',
                color: isSelected ? '#ffffff' : '#e2e8f0',
                border: isSelected ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? '0 2px 10px rgba(225, 29, 72, 0.35)' : 'none',
                '& .MuiChip-icon': {
                  color: isSelected ? '#ffffff' : '#9ca3af',
                },
                '&:hover': {
                  background: isSelected ? activeGradient : 'rgba(255, 255, 255, 0.12)',
                },
              }}
            />
          );
        })}
      </Box>

      {/* Right Chevron */}
      <IconButton
        size="small"
        onClick={() => handleScroll('right')}
        sx={{
          display: { xs: 'none', sm: 'inline-flex' },
          bgcolor: '#0d0d10',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          ml: 1,
          flexShrink: 0,
          zIndex: 2,
          '&:hover': { bgcolor: 'rgba(225, 29, 72, 0.2)' },
        }}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
