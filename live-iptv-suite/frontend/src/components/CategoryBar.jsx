import React, { useRef } from 'react';
import { Box, Chip, IconButton, Skeleton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TranslateIcon from '@mui/icons-material/Translate';

export default function CategoryBar({
  languages = [],
  selectedLanguage = 'all',
  onSelectLanguage,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  loading = false,
  totalChannels = 0,
}) {
  const chipsScrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (chipsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      chipsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading && (!categories || categories.length === 0)) {
    return (
      <Box sx={{ display: 'flex', gap: 1, py: 1.5, overflowX: 'hidden' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} variant="rounded" width={90} height={32} sx={{ borderRadius: 20, bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
        ))}
      </Box>
    );
  }

  // Direct list of specific languages without redundant 'All Languages' chip
  const languageList = languages || [];

  return (
    <Box sx={{ mb: 2 }}>
      {/* 1. YouTube Filter Chips Horizontal Rail */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left Scroll Button */}
        <IconButton
          size="small"
          onClick={() => handleScroll('left')}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#0d0d10',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            mr: 1,
            zIndex: 2,
            '&:hover': { bgcolor: 'rgba(225, 29, 72, 0.2)' },
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        {/* Chips Container */}
        <Box
          ref={chipsScrollRef}
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
          {/* 'All' category chip */}
          <Chip
            label={`All Channels (${totalChannels})`}
            clickable
            onClick={() => onSelectCategory('all')}
            sx={{
              fontWeight: selectedCategory === 'all' ? 700 : 500,
              fontSize: '0.84rem',
              height: 32,
              borderRadius: 20,
              px: 0.5,
              background: selectedCategory === 'all'
                ? 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)'
                : 'rgba(255, 255, 255, 0.07)',
              color: '#ffffff',
              border: selectedCategory === 'all'
                ? '1px solid rgba(249, 115, 22, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: selectedCategory === 'all' ? '0 2px 10px rgba(225, 29, 72, 0.35)' : 'none',
              '&:hover': {
                background: selectedCategory === 'all'
                  ? 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)'
                  : 'rgba(255, 255, 255, 0.12)',
              },
            }}
          />

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <Chip
                key={cat.id || cat.slug}
                label={`${cat.name} ${cat.channel_count ? `(${cat.channel_count})` : ''}`}
                clickable
                onClick={() => onSelectCategory(cat.slug)}
                sx={{
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.84rem',
                  height: 32,
                  borderRadius: 20,
                  px: 0.5,
                  background: isSelected
                    ? 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)'
                    : 'rgba(255, 255, 255, 0.07)',
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  border: isSelected
                    ? '1px solid rgba(249, 115, 22, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isSelected ? '0 2px 10px rgba(225, 29, 72, 0.35)' : 'none',
                  '&:hover': {
                    background: isSelected
                      ? 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)'
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Right Scroll Button */}
        <IconButton
          size="small"
          onClick={() => handleScroll('right')}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#0d0d10',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            ml: 1,
            zIndex: 2,
            '&:hover': { bgcolor: 'rgba(225, 29, 72, 0.2)' },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 2. Compact Language Pill Selector Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.2, overflowX: 'auto', py: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#00e5ff' }}>
          <TranslateIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Lang:
          </Typography>
        </Box>

        {languageList.map((langObj) => {
          const lCode = (langObj.language || '').toLowerCase();
          const isSelected = selectedLanguage.toLowerCase() === lCode;
          const label = langObj.label || langObj.language;

          return (
            <Chip
              key={lCode}
              label={`${label.toUpperCase()} (${langObj.count || 0})`}
              size="small"
              clickable
              onClick={() => onSelectLanguage(isSelected ? 'all' : lCode)}
              sx={{
                height: 24,
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: 1.5,
                bgcolor: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#00e5ff' : '#9ca3af',
                border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.06)',
                '&:hover': {
                  bgcolor: isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#00e5ff' : '#ffffff',
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
