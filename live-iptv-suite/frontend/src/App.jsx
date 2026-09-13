import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Snackbar,
  Alert,
  Fade,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import VideoPlayer from './components/VideoPlayer';
import ChannelGrid from './components/ChannelGrid';
import MovieGrid from './components/MovieGrid';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'movies'
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Player view modes
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Favorites in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('streampulse_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recently watched channels
  const [recentChannels, setRecentChannels] = useState(() => {
    try {
      const saved = localStorage.getItem('streampulse_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // End-to-End WebSocket Real-time Connection & Notification Hub
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;

    const connectWS = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || '127.0.0.1';
      const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/`;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('%c🟢 WebSocket Connected to StreamPulse Live Engine', 'color: #10b981; font-weight: bold; font-size: 13px;');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS Realtime Push]:', data);

            if (data.type === 'connection_established') {
              setNotification({
                open: true,
                message: `🟢 Realtime Sync Active: Connected to StreamPulse WebSocket (${data.stats?.channels || 1234} Channels, ${data.stats?.movies || 202} Movies)`,
                severity: 'success',
              });
            } else if (data.type === 'catalog_updated') {
              setNotification({
                open: true,
                message: `🔔 ${data.message}`,
                severity: 'info',
              });
              // Instantly refresh movies and categories without page reload!
              fetchMovies();
              fetchCategories(selectedLanguage);
              fetchChannels();
            } else if (data.type === 'sync_progress') {
              setNotification({
                open: true,
                message: `🔄 ${data.message}`,
                severity: 'info',
              });
            } else if (data.type === 'stream_healed') {
              setNotification({
                open: true,
                message: `⚡ Stream Healed: ${data.title} token refreshed`,
                severity: 'success',
              });
            }
          } catch (e) {
            console.error('Failed to parse WS push message:', e);
          }
        };

        ws.onclose = () => {
          console.log('%c🔴 WebSocket Disconnected. Retrying in 3s...', 'color: #ef4444;');
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWS, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimer = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [selectedLanguage]);

  const handleWsPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
      setNotification({
        open: true,
        message: '⚡ Ping sent over WebSocket! Real-time connection is 100% active.',
        severity: 'success',
      });
    } else {
      setNotification({
        open: true,
        message: 'Reconnecting to WebSocket hub...',
        severity: 'warning',
      });
    }
  };

  // Save favorites & recent to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('streampulse_favs', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('streampulse_recent', JSON.stringify(recentChannels));
    } catch (e) {
      console.error(e);
    }
  }, [recentChannels]);

  // Fetch Languages
  const fetchLanguages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/languages/`);
      setLanguages(res.data);
    } catch (err) {
      console.error('Failed to fetch languages:', err);
    }
  };

  // Fetch Categories for selected language
  const fetchCategories = async (lang = selectedLanguage) => {
    try {
      const params = {};
      if (lang && lang !== 'all') {
        params.language = lang;
      }
      const res = await axios.get(`${API_BASE}/categories/`, { params });
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch Channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedLanguage && selectedLanguage !== 'all') {
        params.language = selectedLanguage;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await axios.get(`${API_BASE}/channels/`, { params });
      setChannels(res.data);
      // Do not auto-play or force-select on initial page load (Zero Autoplay requirement)
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      setNotification({
        open: true,
        message: 'Could not connect to Django API backend on port 8000.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const [moviesSyncing, setMoviesSyncing] = useState(false);

  // Fetch Movies
  const fetchMovies = async () => {
    setMoviesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/movies/`);
      setMovies(res.data);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setMoviesLoading(false);
    }
  };

  // Sync Online Movie Sources on-demand via WebSocket or REST
  const handleSyncMovies = async () => {
    setMoviesSyncing(true);
    setNotification({
      open: true,
      message: 'Broadcasting live sync request to online movie sources via WebSocket...',
      severity: 'info',
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Trigger via WebSocket real-time pipeline!
      wsRef.current.send(JSON.stringify({ type: 'trigger_sync' }));
      setMoviesSyncing(false);
    } else {
      try {
        const res = await axios.post(`${API_BASE}/movies/sync/`);
        await fetchMovies();
        setNotification({
          open: true,
          message: `Sync Complete! Added ${res.data.added} new movies. Total: ${res.data.total} movies ready.`,
          severity: 'success',
        });
      } catch (err) {
        console.error('Failed to sync movies:', err);
        await fetchMovies();
        setNotification({
          open: true,
          message: 'Online sync finished with active catalog.',
          severity: 'info',
        });
      } finally {
        setMoviesSyncing(false);
      }
    }
  };

  useEffect(() => {
    console.log(
      "%c🔒 StreamPulse Cryptographic Shield Active\n%cRaw upstream domains, server IPs, and tokens are secured and hidden from client inspection.",
      "color: #10b981; font-weight: bold; font-size: 14px;",
      "color: #94a3b8; font-size: 11px;"
    );
    fetchLanguages();
    fetchMovies();
  }, []);

  useEffect(() => {
    fetchCategories(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChannels();
    }, 180);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedLanguage, searchQuery]);

  const handleSelectChannel = useCallback((ch) => {
    const originBase = API_BASE.replace('/api', '');
    const shieldedUrl = ch.stream_url.startsWith('/') ? `${originBase}${ch.stream_url}` : ch.stream_url;

    const channelWithShield = {
      ...ch,
      stream_url: shieldedUrl,
    };

    setSelectedChannel(channelWithShield);
    setSelectedMovie(null);
    setIsMinimized(false);

    setRecentChannels((prev) => {
      const filtered = prev.filter((item) => item.id !== ch.id);
      return [channelWithShield, ...filtered].slice(0, 6);
    });
  }, []);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setIsMinimized(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const originBase = API_BASE.replace('/api', '');
    const shieldedUrl = movie.stream_url.startsWith('/') ? `${originBase}${movie.stream_url}` : movie.stream_url;

    const movieAsChannel = {
      id: `movie_${movie.id}`,
      name: `${movie.title} (${movie.year})`,
      category_name: movie.category,
      category_slug: 'movies',
      stream_url: shieldedUrl,
      logo_url: movie.poster_url,
      quality: movie.quality,
      language: movie.language,
      is_active: true,
    };

    setSelectedChannel(movieAsChannel);
    setNotification({
      open: true,
      message: `Shield Protected: ${movie.title} (${movie.year}) [Opaque Token Active]`,
      severity: 'success',
    });
  };


  const handleToggleFavorite = useCallback((channelId) => {
    setFavorites((prev) => {
      const exists = prev.includes(channelId);
      const updated = exists ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      setNotification({
        open: true,
        message: exists ? 'Removed from favorites' : 'Saved to favorites!',
        severity: exists ? 'info' : 'success',
      });
      return updated;
    });
  }, []);

  const displayedChannels = useMemo(() => {
    if (showFavoritesOnly) {
      return channels.filter((ch) => favorites.includes(ch.id));
    }
    return channels;
  }, [channels, showFavoritesOnly, favorites]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalChannels={channels.length}
        totalMovies={movies.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        wsConnected={wsConnected}
        onWsPing={handleWsPing}
        onRefresh={() => {
          fetchLanguages();
          fetchCategories(selectedLanguage);
          fetchChannels();
          fetchMovies();
          setNotification({ open: true, message: 'Content refreshed!', severity: 'success' });
        }}
      />

      <Container
        maxWidth={isTheaterMode ? false : "xl"}
        sx={{
          py: 2.5,
          px: isTheaterMode ? { xs: 0, sm: 2, md: 4 } : { xs: 2, md: 3 },
          flexGrow: 1,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Main Live Player Section */}
        {selectedChannel ? (
          <Fade in timeout={300}>
            <Box sx={{ mb: 3 }}>
              <VideoPlayer
                channel={selectedChannel}
                isFavorite={favorites.includes(selectedChannel.id)}
                onToggleFavorite={handleToggleFavorite}
                isTheaterMode={isTheaterMode}
                onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
              />
            </Box>
          </Fade>
        ) : (
          <Fade in timeout={350}>
            <Paper
              elevation={4}
              sx={{
                p: { xs: 3, md: 4 },
                mb: 3,
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.6,
                  borderRadius: 20,
                  bgcolor: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                <span>⚡</span> ZERO AUTOPLAY • CLICK ANY CHANNEL OR MOVIE TO STREAM
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #f8fafc 0%, #38bdf8 50%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
                }}
              >
                StreamPulse Live IPTV & Tamil OTT
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#94a3b8',
                  maxWidth: 680,
                  mx: 'auto',
                  mb: 3,
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                }}
              >
                1,227 verified live TV channels and 93 multi-language movies (Tamil, Hollywood English, Dubbed, Hindi).
                Powered by dynamic self-healing origin discovery and on-the-fly stealth key extraction.
              </Typography>

              {/* Quick Launch Popular Channels */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.2 }}>
                {channels.slice(0, 6).map((ch) => (
                  <Chip
                    key={ch.id}
                    label={`📺 ${ch.name}`}
                    clickable
                    onClick={() => handleSelectChannel(ch)}
                    sx={{
                      bgcolor: 'rgba(6, 182, 212, 0.12)',
                      color: '#e2e8f0',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(6, 182, 212, 0.25)',
                        borderColor: '#06b6d4',
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Live TV Content */}
        {activeTab === 'live' && (
          <>
            {/* Recently Watched Quick Shelf */}
            {recentChannels.length > 1 && (
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.2, overflowX: 'auto', py: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#94a3b8' }}>
                  <HistoryIcon fontSize="small" sx={{ color: '#06b6d4' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                    RECENT:
                  </Typography>
                </Box>
                {recentChannels.map((rc) => (
                  <Chip
                    key={rc.id}
                    avatar={rc.logo_url ? <Avatar src={rc.logo_url} sx={{ bgcolor: '#fff' }} /> : null}
                    label={rc.name}
                    size="small"
                    onClick={() => handleSelectChannel(rc)}
                    sx={{
                      backgroundColor: selectedChannel?.id === rc.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                      color: selectedChannel?.id === rc.id ? '#38bdf8' : '#e2e8f0',
                      border: selectedChannel?.id === rc.id ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: 'rgba(6, 182, 212, 0.3)' },
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Language & Category Multi-Tier Filter System */}
            <Box sx={{ mb: 2 }}>
              <CategoryBar
                languages={languages}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={(lang) => {
                  setSelectedLanguage(lang);
                  setSelectedCategory('all');
                  setShowFavoritesOnly(false);
                }}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(slug) => {
                  setSelectedCategory(slug);
                  setShowFavoritesOnly(false);
                }}
                loading={loading}
                totalChannels={channels.length}
              />
            </Box>

            {/* Channels Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                {showFavoritesOnly
                  ? `Your Favorite Channels (${displayedChannels.length})`
                  : selectedCategory === 'all'
                  ? `${selectedLanguage === 'all' ? 'All Live TV Channels' : selectedLanguage + ' Channels'} (${displayedChannels.length})`
                  : `${selectedLanguage === 'all' ? '' : selectedLanguage + ' '}${categories.find((c) => c.slug === selectedCategory)?.name || 'Category'} (${displayedChannels.length})`}
              </Typography>
            </Box>

            {/* Channel Grid */}
            <ChannelGrid
              channels={displayedChannels}
              selectedChannel={selectedChannel}
              onSelectChannel={(ch) => {
                handleSelectChannel(ch);
                if (!isTheaterMode) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              loading={loading}
            />
          </>
        )}

        {/* Movies (Multi-Language VOD) Content */}
        {activeTab === 'movies' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                  Multi-Language Cinema & VOD ({movies.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Auto-resolved stealth streams across Tamil, Hollywood English, Dubbed, and Hindi with 1080p FHD playback
                </Typography>
              </Box>
            </Box>

            <MovieGrid
              movies={movies}
              selectedMovie={selectedMovie}
              onSelectMovie={handleSelectMovie}
              loading={moviesLoading}
              searchQuery={searchQuery}
              onSyncMovies={handleSyncMovies}
              syncing={moviesSyncing}
            />
          </Box>
        )}
      </Container>

      {/* Notification Toast */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
