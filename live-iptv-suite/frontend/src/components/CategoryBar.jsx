import React from 'react';
import { Box, Chip, Skeleton, Typography } from '@mui/material';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PublicIcon from '@mui/icons-material/Public';
import AppsIcon from '@mui/icons-material/Apps';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import MovieIcon from '@mui/icons-material/Movie';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import TranslateIcon from '@mui/icons-material/Translate';
import CategoryIcon from '@mui/icons-material/Category';

const iconMap = {
  'live_tv': <LiveTvIcon fontSize="small" />,
  'child_care': <ChildCareIcon fontSize="small" />,
  'newspaper': <NewspaperIcon fontSize="small" />,
  'music_note': <MusicNoteIcon fontSize="small" />,
  'public': <PublicIcon fontSize="small" />,
  'sports_cricket': <SportsCricketIcon fontSize="small" />,
  'movie': <MovieIcon fontSize="small" />,
  'self_improvement': <SelfImprovementIcon fontSize="small" />,
};

const languageDisplay = {
  'all': { label: 'All Languages', flag: '🌐', native: 'All' },
  'tamil': { label: 'Tamil', flag: '🇮🇳', native: 'தமிழ்' },
  'english': { label: 'English', flag: '🇬🇧', native: 'English' },
  'hindi': { label: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
  'telugu': { label: 'Telugu', flag: '🇮🇳', native: 'తెలుగు' },
  'kannada': { label: 'Kannada', flag: '🇮🇳', native: 'ಕನ್ನಡ' },
  'english/hindi': { label: 'Eng / Hindi', flag: '🌐', native: 'Bilingual' },
  'french': { label: 'French', flag: '🇫🇷', native: 'Français' },
};

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
  if (loading && (!categories || categories.length === 0)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={110} height={34} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rounded" width={120} height={36} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      </Box>
    );
  }

  // Calculate total channels for currently selected language
  const currentLangObj = languages.find(
    (l) => l.language.toLowerCase() === selectedLanguage.toLowerCase()
  );
  const totalInSelectedLang = selectedLanguage === 'all'
    ? totalChannels
    : currentLangObj?.count || 0;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 4,
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.6) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 1. LANGUAGE SELECTOR ROW */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
          <TranslateIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.8,
              color: '#38bdf8',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
            }}
          >
            Select Language ({languages.length || 6} Available)
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            pb: 0.5,
          }}
        >
          {/* All Languages Option */}
          <Chip
            icon={<span style={{ fontSize: 14 }}>🌐</span>}
            label={`All Languages (${totalChannels || 0})`}
            clickable
            onClick={() => onSelectLanguage('all')}
            sx={{
              borderRadius: 2.5,
              fontWeight: selectedLanguage === 'all' ? 800 : 600,
              fontSize: '0.82rem',
              py: 1.8,
              px: 0.5,
              backgroundColor: selectedLanguage === 'all'
                ? '#06b6d4'
                : 'rgba(51, 65, 85, 0.5)',
              color: selectedLanguage === 'all' ? '#0f172a' : '#cbd5e1',
              border: selectedLanguage === 'all'
                ? '1px solid #38bdf8'
                : '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: selectedLanguage === 'all'
                ? '0 0 16px rgba(6, 182, 212, 0.4)'
                : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: selectedLanguage === 'all' ? '#0891b2' : 'rgba(71, 85, 105, 0.7)',
              },
            }}
          />

          {/* Dynamic Languages */}
          {languages.map((l) => {
            const key = l.language.toLowerCase();
            const meta = languageDisplay[key] || {
              label: l.language,
              flag: '🌐',
              native: l.language,
            };
            const isSelected = selectedLanguage.toLowerCase() === l.language.toLowerCase();

            return (
              <Chip
                key={l.language}
                icon={<span style={{ fontSize: 14 }}>{meta.flag}</span>}
                label={`${meta.label} (${meta.native}) • ${l.count}`}
                clickable
                onClick={() => onSelectLanguage(l.language)}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.82rem',
                  py: 1.8,
                  px: 0.5,
                  backgroundColor: isSelected
                    ? (key === 'tamil' ? '#10b981' : '#3b82f6')
                    : 'rgba(51, 65, 85, 0.5)',
                  color: isSelected ? '#ffffff' : '#cbd5e1',
                  border: isSelected
                    ? '1px solid rgba(255, 255, 255, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isSelected
                    ? (key === 'tamil' ? '0 0 16px rgba(16, 185, 129, 0.5)' : '0 0 16px rgba(59, 130, 246, 0.5)')
                    : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? (key === 'tamil' ? '#059669' : '#2563eb')
                      : 'rgba(71, 85, 105, 0.7)',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 2. CATEGORIES ROW FOR SELECTED LANGUAGE */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
          <CategoryIcon sx={{ color: '#a855f7', fontSize: 18 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.8,
              color: '#c084fc',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
            }}
          >
            {selectedLanguage === 'all' ? 'All' : selectedLanguage} Categories ({categories.length} Genres)
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            pb: 0.5,
          }}
        >
          {/* All In Current Language */}
          <Chip
            icon={<AppsIcon fontSize="small" />}
            label={`All ${selectedLanguage === 'all' ? '' : selectedLanguage + ' '}Channels (${totalInSelectedLang})`}
            clickable
            onClick={() => onSelectCategory('all')}
            sx={{
              borderRadius: 3,
              fontWeight: selectedCategory === 'all' ? 800 : 600,
              fontSize: '0.85rem',
              py: 2,
              px: 0.8,
              backgroundColor: selectedCategory === 'all'
                ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                : 'rgba(30, 41, 59, 0.7)',
              color: selectedCategory === 'all' ? '#000' : '#e2e8f0',
              border: selectedCategory === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: selectedCategory === 'all' ? '0 4px 14px rgba(6, 182, 212, 0.35)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: selectedCategory === 'all' ? '#0891b2' : 'rgba(51, 65, 85, 0.9)',
              },
            }}
          />

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const icon = iconMap[cat.icon] || <LiveTvIcon fontSize="small" />;
            const count = cat.channel_count || 0;

            return (
              <Chip
                key={cat.id}
                icon={icon}
                label={`${cat.name} (${count})`}
                clickable
                onClick={() => onSelectCategory(cat.slug)}
                sx={{
                  borderRadius: 3,
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.85rem',
                  py: 2,
                  px: 0.8,
                  opacity: count === 0 ? 0.5 : 1,
                  backgroundColor: isSelected
                    ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                    : 'rgba(30, 41, 59, 0.7)',
                  color: isSelected ? '#000' : '#e2e8f0',
                  border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected ? '0 4px 14px rgba(6, 182, 212, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? '#0891b2' : 'rgba(51, 65, 85, 0.9)',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
