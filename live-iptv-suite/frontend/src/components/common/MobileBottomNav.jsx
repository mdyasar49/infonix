import React from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';

export default function MobileBottomNav({
  activeTab = 'live',
  setActiveTab,
  showFavoritesOnly = false,
  setShowFavoritesOnly,
  favoritesCount = 0,
  onSearchFocus,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) return null;

  const getValue = () => {
    if (showFavoritesOnly) return 'favorites';
    return activeTab;
  };

  const handleChange = (event, newValue) => {
    if (newValue === 'live') {
      setActiveTab('live');
      setShowFavoritesOnly(false);
    } else if (newValue === 'movies') {
      setActiveTab('movies');
      setShowFavoritesOnly(false);
    } else if (newValue === 'favorites') {
      setActiveTab('live');
      setShowFavoritesOnly(true);
    } else if (newValue === 'search') {
      if (onSearchFocus) onSearchFocus();
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: '#050507',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.7)',
      }}
      elevation={6}
    >
      <BottomNavigation
        value={getValue()}
        onChange={handleChange}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 60,
          '& .MuiBottomNavigationAction-root': {
            color: '#9ca3af',
            minWidth: 'auto',
            py: 0.5,
            '&.Mui-selected': {
              color: '#e11d48',
              '& .MuiBottomNavigationAction-label': {
                fontWeight: 800,
                fontSize: '0.72rem',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.68rem',
              fontWeight: 600,
              fontFamily: '"Outfit", sans-serif',
              mt: 0.2,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Live TV"
          value="live"
          icon={<HomeIcon fontSize="small" />}
        />
        <BottomNavigationAction
          label="Cinema"
          value="movies"
          icon={<MovieIcon fontSize="small" />}
        />
        <BottomNavigationAction
          label="Favorites"
          value="favorites"
          icon={
            <Badge badgeContent={favoritesCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
              <FavoriteIcon fontSize="small" />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="Search"
          value="search"
          icon={<SearchIcon fontSize="small" />}
        />
      </BottomNavigation>
    </Paper>
  );
}
