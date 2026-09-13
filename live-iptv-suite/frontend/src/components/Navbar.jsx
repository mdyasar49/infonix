import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  Box,
  IconButton,
  Badge,
  Chip,
  Tooltip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import TvIcon from '@mui/icons-material/Tv';
import MovieIcon from '@mui/icons-material/Movie';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RefreshIcon from '@mui/icons-material/Refresh';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 24,
  backgroundColor: alpha(theme.palette.common.white, 0.06),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    borderColor: theme.palette.primary.main,
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: '320px',
  },
  transition: 'all 0.2s ease',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.92rem',
  },
}));

export default function Navbar({
  searchQuery,
  setSearchQuery,
  totalChannels,
  totalMovies,
  activeTab,
  setActiveTab,
  favoritesCount,
  showFavoritesOnly,
  setShowFavoritesOnly,
  onRefresh,
  wsConnected,
  onWsPing
}) {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('live')}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              mr: 1.5,
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
            }}
          >
            <TvIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(to right, #06b6d4, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
              }}
            >
              StreamPulse
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
              Live IPTV & Cinema Suite
            </Typography>
          </Box>

          <Chip
            label="HD"
            size="small"
            sx={{
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              fontWeight: 800,
              fontSize: '0.65rem',
              height: 24,
              ml: 1,
            }}
          />
        </Box>

        {/* Search */}
        <Search>
          <SearchIconWrapper>
            <SearchIcon fontSize="small" />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder={activeTab === 'movies' ? "Search movies, actors, genres..." : "Search channels, genres, Tamil..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>

        {/* Mode Switcher: Live TV vs Tamil Movies */}
        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.7)', p: 0.5, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Chip
            icon={<TvIcon fontSize="small" />}
            label={`Live TV (${totalChannels || 0})`}
            size="small"
            onClick={() => setActiveTab('live')}
            clickable
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              height: 28,
              backgroundColor: activeTab === 'live' ? '#06b6d4' : 'transparent',
              color: activeTab === 'live' ? '#000' : '#94a3b8',
              '&:hover': { backgroundColor: activeTab === 'live' ? '#0891b2' : 'rgba(255, 255, 255, 0.05)' },
            }}
          />
          <Chip
            icon={<MovieIcon fontSize="small" />}
            label={`Movies & Cinema (${totalMovies || 0})`}
            size="small"
            onClick={() => setActiveTab('movies')}
            clickable
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              height: 28,
              backgroundColor: activeTab === 'movies' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'movies' ? '#fff' : '#94a3b8',
              '&:hover': { backgroundColor: activeTab === 'movies' ? '#7c3aed' : 'rgba(255, 255, 255, 0.05)' },
            }}
          />
        </Box>

        {/* Real-time WebSocket Status & Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={wsConnected ? "Realtime WebSocket Connected: Instant push notifications active" : "Reconnecting to Live WebSocket Hub..."}>
            <Chip
              size="small"
              label={wsConnected ? "🟢 REALTIME WS" : "🟡 CONNECTING..."}
              onClick={onWsPing}
              clickable
              sx={{
                bgcolor: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: wsConnected ? '#10b981' : '#eab308',
                border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                fontWeight: 700,
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: wsConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                }
              }}
            />
          </Tooltip>

          <Tooltip title={showFavoritesOnly ? "Show All Channels" : "Show Favorites Only"}>
            <IconButton
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              sx={{
                color: showFavoritesOnly ? '#ef4444' : '#94a3b8',
                backgroundColor: showFavoritesOnly ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                '&:hover': { color: '#ef4444' },
              }}
            >
              <Badge badgeContent={favoritesCount} color="error">
                <FavoriteIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh Streams">
            <IconButton onClick={onRefresh} sx={{ color: '#94a3b8', '&:hover': { color: '#06b6d4' } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Fullscreen">
            <IconButton onClick={toggleFullScreen} sx={{ color: '#94a3b8', '&:hover': { color: '#06b6d4' } }}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
