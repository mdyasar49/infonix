import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import TranslateIcon from '@mui/icons-material/Translate';
import { LANGUAGE_METADATA } from '../constants/languages';

export default function Sidebar({
  isOpen = true,
  activeTab = 'live',
  setActiveTab,
  selectedCategory = 'all',
  onSelectCategory,
  selectedLanguage = 'tamil',
  onSelectLanguage,
  showFavoritesOnly = false,
  setShowFavoritesOnly,
  favoritesCount = 0,
  recentCount = 0,
  languages = [],
  categories = [],
}) {
  const isCompact = !isOpen;

  const mainNavItems = [
    {
      id: 'home_live',
      label: 'Home (Live TV)',
      icon: <HomeIcon />,
      action: () => {
        setActiveTab('live');
        setShowFavoritesOnly(false);
        onSelectCategory('all');
      },
      active: activeTab === 'live' && !showFavoritesOnly && selectedCategory === 'all',
    },
    {
      id: 'movies_vod',
      label: 'Movies & Cinema',
      icon: <MovieIcon />,
      action: () => {
        setActiveTab('movies');
        setShowFavoritesOnly(false);
      },
      active: activeTab === 'movies',
      badge: 'VOD',
    },
    {
      id: 'trending',
      label: 'Trending Live',
      icon: <WhatshotIcon />,
      action: () => {
        setActiveTab('live');
        setShowFavoritesOnly(false);
      },
      active: false,
    },
  ];

  const libraryItems = [
    {
      id: 'favorites',
      label: 'Favorites / Subscribed',
      icon: <FavoriteIcon sx={{ color: showFavoritesOnly ? '#e11d48' : 'inherit' }} />,
      action: () => {
        setActiveTab('live');
        setShowFavoritesOnly(true);
      },
      active: showFavoritesOnly,
      count: favoritesCount,
    },
    {
      id: 'history',
      label: 'Recently Watched',
      icon: <HistoryIcon />,
      action: () => {
        setActiveTab('live');
      },
      active: false,
      count: recentCount,
    },
  ];

  const popularCategories = [
    { slug: 'news', name: 'News 24/7', icon: <NewspaperIcon /> },
    { slug: 'sports', name: 'Sports Live', icon: <SportsCricketIcon /> },
    { slug: 'entertainment', name: 'Entertainment', icon: <TheaterComedyIcon /> },
    { slug: 'movies', name: 'Cinema & TV', icon: <MovieIcon /> },
    { slug: 'music', name: 'Music', icon: <MusicNoteIcon /> },
    { slug: 'kids', name: 'Kids & Cartoons', icon: <ChildCareIcon /> },
  ];

  const popularLanguages = Object.entries(LANGUAGE_METADATA).map(([code, meta]) => ({
    code,
    name: meta.label,
    flag: meta.flag,
  }));

  return (
    <Box
      sx={{
        width: isCompact ? 72 : 240,
        flexShrink: 0,
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        overflowY: 'auto',
        overflowX: 'hidden',
        bgcolor: '#050507',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        display: { xs: 'none', md: 'block' },
        zIndex: 10,
        px: isCompact ? 0.5 : 1.5,
        py: 1.5,
        '&::-webkit-scrollbar': {
          width: 5,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        },
      }}
    >
      {/* 1. Main Navigation */}
      <List disablePadding>
        {mainNavItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={isCompact ? item.label : ''} placement="right">
              <ListItemButton
                onClick={item.action}
                sx={{
                  borderRadius: 2.5,
                  py: isCompact ? 1.2 : 1,
                  px: isCompact ? 1 : 1.5,
                  display: 'flex',
                  flexDirection: isCompact ? 'column' : 'row',
                  justifyContent: isCompact ? 'center' : 'flex-start',
                  alignItems: 'center',
                  gap: isCompact ? 0.5 : 1.5,
                  bgcolor: item.active
                    ? 'rgba(225, 29, 72, 0.14)'
                    : 'transparent',
                  border: item.active ? '1px solid rgba(225, 29, 72, 0.35)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: item.active
                      ? 'rgba(225, 29, 72, 0.22)'
                      : 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCompact ? 0 : 28,
                    color: item.active ? '#e11d48' : '#9ca3af',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: isCompact ? '0.65rem' : '0.88rem',
                    fontWeight: item.active ? 700 : 500,
                    color: item.active ? '#ffffff' : '#9ca3af',
                    textAlign: isCompact ? 'center' : 'left',
                    whiteSpace: isCompact ? 'normal' : 'nowrap',
                  }}
                />
                {!isCompact && item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                      color: '#f97316',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* 2. Library / Subscriptions */}
      {!isCompact && (
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            fontWeight: 800,
            letterSpacing: 0.8,
            color: '#6b7280',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
          }}
        >
          You & Library
        </Typography>
      )}

      <List disablePadding sx={{ mt: 0.5 }}>
        {libraryItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={isCompact ? item.label : ''} placement="right">
              <ListItemButton
                onClick={item.action}
                sx={{
                  borderRadius: 2.5,
                  py: isCompact ? 1.2 : 1,
                  px: isCompact ? 1 : 1.5,
                  display: 'flex',
                  flexDirection: isCompact ? 'column' : 'row',
                  justifyContent: isCompact ? 'center' : 'flex-start',
                  alignItems: 'center',
                  gap: isCompact ? 0.5 : 1.5,
                  bgcolor: item.active ? 'rgba(225, 29, 72, 0.14)' : 'transparent',
                  border: item.active ? '1px solid rgba(225, 29, 72, 0.35)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: item.active ? 'rgba(225, 29, 72, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCompact ? 0 : 28,
                    color: item.active ? '#e11d48' : '#9ca3af',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: isCompact ? '0.65rem' : '0.88rem',
                    fontWeight: item.active ? 700 : 500,
                    color: item.active ? '#ffffff' : '#9ca3af',
                    textAlign: isCompact ? 'center' : 'left',
                  }}
                />
                {!isCompact && item.count > 0 && (
                  <Chip
                    label={item.count}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {!isCompact && (
        <>
          <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* 3. Explore Categories */}
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: '#6b7280',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
            }}
          >
            Explore Genres
          </Typography>

          <List disablePadding sx={{ mt: 0.5 }}>
            {popularCategories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <ListItem key={cat.slug} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    onClick={() => {
                      setActiveTab('live');
                      setShowFavoritesOnly(false);
                      onSelectCategory(cat.slug);
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 0.8,
                      px: 1.5,
                      bgcolor: isSelected ? 'rgba(249, 115, 22, 0.14)' : 'transparent',
                      border: isSelected ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 26,
                        color: isSelected ? '#f97316' : '#9ca3af',
                        fontSize: 18,
                      }}
                    >
                      {cat.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={cat.name}
                      primaryTypographyProps={{
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#ffffff' : '#9ca3af',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* 4. Languages */}
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: '#6b7280',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
            }}
          >
            Languages
          </Typography>

          <List disablePadding sx={{ mt: 0.5 }}>
            {popularLanguages.map((lang) => {
              const isSelected = selectedLanguage.toLowerCase() === lang.code;
              return (
                <ListItem key={lang.code} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    onClick={() => {
                      setActiveTab('live');
                      setShowFavoritesOnly(false);
                      onSelectLanguage(lang.code);
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 0.7,
                      px: 1.5,
                      bgcolor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <Typography sx={{ mr: 1.5, fontSize: '0.9rem' }}>{lang.flag}</Typography>
                    <ListItemText
                      primary={lang.name}
                      primaryTypographyProps={{
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#00e5ff' : '#9ca3af',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* 5. Footer info */}
          <Box sx={{ p: 1.5, mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.68rem', display: 'block', lineHeight: 1.4 }}>
              StreamPulse Cinema Suite<br />
              Portfolio Design • 2026 Edition
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
