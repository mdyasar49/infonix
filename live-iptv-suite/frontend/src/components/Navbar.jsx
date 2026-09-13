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
  Tooltip,
  Avatar,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import MovieIcon from '@mui/icons-material/Movie';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  borderRadius: 40,
  backgroundColor: '#0d0d10',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  width: '100%',
  maxWidth: 580,
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  '&:focus-within': {
    borderColor: '#e11d48',
    boxShadow: '0 0 16px rgba(225, 29, 72, 0.35)',
    backgroundColor: '#121217',
  },
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  color: '#ffffff',
  flexGrow: 1,
  padding: '6px 16px',
  fontSize: '0.94rem',
  fontFamily: '"Outfit", sans-serif',
  '& .MuiInputBase-input': {
    padding: '4px 0',
    '&::placeholder': {
      color: '#6b7280',
      opacity: 1,
    },
  },
}));

const SearchButton = styled(IconButton)(({ theme }) => ({
  padding: '8px 18px',
  borderRadius: '0 40px 40px 0',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#9ca3af',
  '&:hover': {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    color: '#e11d48',
  },
}));

export default function Navbar({
  onToggleSidebar,
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
  onWsPing,
  onOpenJioModal,
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
        background: '#050507',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: { xs: 1, sm: 2 }, px: { xs: 1.5, sm: 2.5 }, minHeight: 64 }}>
        {/* 1. Left: Hamburger + Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onToggleSidebar}
            sx={{
              color: '#ffffff',
              p: 1,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setActiveTab('live')}
          >
            {/* YouTube-style Play Button Icon with Portfolio Gradient */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f97316 0%, #e11d48 50%, #c026d3 100%)',
                mr: 1.2,
                boxShadow: '0 0 16px rgba(225, 29, 72, 0.5)',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <PlayArrowIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  fontFamily: '"Outfit", sans-serif',
                  color: '#ffffff',
                  lineHeight: 1,
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                }}
              >
                Stream<span style={{ color: '#e11d48' }}>Pulse</span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#f97316',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  display: { xs: 'none', sm: 'inline' },
                }}
              >
                LIVE
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 2. Center: YouTube Search Bar */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', px: { xs: 1, md: 4 } }}>
          <SearchContainer>
            <SearchInput
              placeholder={activeTab === 'movies' ? "Search 202+ Movies, actors, genres, 4K..." : "Search 1,234+ Live TV Channels, Tamil, News, Sports..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ 'aria-label': 'search stream' }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ color: '#9ca3af', mr: 0.5, p: 0.5 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <SearchButton aria-label="search">
              <SearchIcon fontSize="small" />
            </SearchButton>
          </SearchContainer>
        </Box>

        {/* 3. Right: Mode Tabs & Action Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.2 } }}>
          {/* Live vs Cinema Switcher */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              p: 0.4,
              borderRadius: 30,
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Chip
              icon={<LiveTvIcon fontSize="small" sx={{ color: activeTab === 'live' ? '#fff !important' : '#9ca3af' }} />}
              label={`Live TV (${totalChannels || 0})`}
              size="small"
              onClick={() => setActiveTab('live')}
              clickable
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 28,
                borderRadius: 20,
                backgroundColor: activeTab === 'live' ? '#e11d48' : 'transparent',
                color: activeTab === 'live' ? '#fff' : '#9ca3af',
                '&:hover': { backgroundColor: activeTab === 'live' ? '#f43f5e' : 'rgba(255, 255, 255, 0.08)' },
              }}
            />
            <Chip
              icon={<MovieIcon fontSize="small" sx={{ color: activeTab === 'movies' ? '#fff !important' : '#9ca3af' }} />}
              label={`Cinema VOD (${totalMovies || 0})`}
              size="small"
              onClick={() => setActiveTab('movies')}
              clickable
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                height: 28,
                borderRadius: 20,
                backgroundColor: activeTab === 'movies' ? '#f97316' : 'transparent',
                color: activeTab === 'movies' ? '#fff' : '#9ca3af',
                '&:hover': { backgroundColor: activeTab === 'movies' ? '#ea580c' : 'rgba(255, 255, 255, 0.08)' },
              }}
            />
            {onOpenJioModal && (
              <Chip
                label="📱 JioTV OTP"
                size="small"
                onClick={onOpenJioModal}
                clickable
                sx={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  height: 28,
                  borderRadius: 20,
                  ml: 0.5,
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                  color: '#ffffff',
                  '&:hover': { boxShadow: '0 0 12px rgba(0, 229, 255, 0.5)' },
                }}
              />
            )}
          </Box>

          {/* WebSocket Realtime Status */}
          <Tooltip title={wsConnected ? "Real-time Push Active: Syncing with Backend" : "Connecting to Live WebSocket Hub"}>
            <Chip
              size="small"
              label={wsConnected ? "● REALTIME" : "● SYNCING"}
              onClick={onWsPing}
              clickable
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                bgcolor: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                color: wsConnected ? '#10b981' : '#f97316',
                border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)'}`,
                fontWeight: 800,
                fontSize: '0.68rem',
                height: 26,
                fontFamily: '"Space Mono", monospace',
              }}
            />
          </Tooltip>

          {/* Favorites Button */}
          <Tooltip title={showFavoritesOnly ? "Show All Channels" : "Saved Favorites / Subscriptions"}>
            <IconButton
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              sx={{
                color: showFavoritesOnly ? '#e11d48' : '#9ca3af',
                bgcolor: showFavoritesOnly ? 'rgba(225, 29, 72, 0.15)' : 'transparent',
                '&:hover': { color: '#e11d48', bgcolor: 'rgba(225, 29, 72, 0.1)' },
              }}
            >
              <Badge badgeContent={favoritesCount} color="primary">
                <FavoriteIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Refresh Streams */}
          <Tooltip title="Refresh Streams & Catalog">
            <IconButton
              onClick={onRefresh}
              sx={{ color: '#9ca3af', '&:hover': { color: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.1)' } }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip title="Toggle Fullscreen">
            <IconButton
              onClick={toggleFullScreen}
              sx={{ color: '#9ca3af', display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { color: '#00e5ff' } }}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* User Avatar with Portfolio Gradient */}
          <Tooltip title="Mohamed Yasar • Pro Streamer">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.85rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f97316 0%, #e11d48 50%, #c026d3 100%)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
              }}
            >
              Y
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
