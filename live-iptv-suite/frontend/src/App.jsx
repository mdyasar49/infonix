import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Fade,
  Chip,
  Paper,
  Grid,
} from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CategoryBar from './components/CategoryBar';
import VideoPlayer from './components/VideoPlayer';
import RelatedVideosRail from './components/RelatedVideosRail';
import MobileBottomNav from './components/common/MobileBottomNav';
import ChannelGrid from './components/ChannelGrid';
import MovieGrid from './components/MovieGrid';
import JioTvLoginModal from './components/JioTvLoginModal';

const API_HOST = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
const API_BASE = `http://${API_HOST}:8000/api`;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isJioModalOpen, setIsJioModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'movies'
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('tamil');
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

  // WebSocket Real-time Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let isUnmounted = false;

    const connectWS = () => {
      if (isUnmounted) return;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || '127.0.0.1';
      const wsUrl = `${wsProtocol}//${wsHost}:8000/ws/`;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connection_established') {
              setNotification({
                open: true,
                message: `🟢 Realtime Sync Active: Connected (${data.stats?.channels || 1234} Channels, ${data.stats?.movies || 230} Movies)`,
                severity: 'success',
              });
            } else if (data.type === 'catalog_updated') {
              setNotification({
                open: true,
                message: `🔔 ${data.message}`,
                severity: 'info',
              });
              fetchMovies();
              fetchCategories(selectedLanguage);
              fetchChannels();
            } else if (data.type === 'sync_progress') {
              setNotification({
                open: true,
                message: `🔄 ${data.message}`,
                severity: 'info',
              });
            }
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setWsConnected(false);
            reconnectTimer = setTimeout(connectWS, 4000);
          }
        };

        ws.onerror = () => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectWS, 4000);
        }
      }
    };

    connectWS();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(); } catch (e) {}
          };
        }
      }
    };
  }, []);

  const handleWsPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
      setNotification({
        open: true,
        message: '⚡ Ping sent over WebSocket! Live sync is 100% active.',
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
    } catch (e) {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('streampulse_recent', JSON.stringify(recentChannels));
    } catch (e) {}
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

  // Fetch Categories
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
    } catch (err) {
      console.error('Failed to fetch channels:', err);
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

  // Sync Movies
  const handleSyncMovies = async () => {
    setMoviesSyncing(true);
    setNotification({
      open: true,
      message: 'Syncing online movie catalogs...',
      severity: 'info',
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'trigger_sync' }));
      setMoviesSyncing(false);
    } else {
      try {
        const res = await axios.post(`${API_BASE}/movies/sync/`);
        await fetchMovies();
        setNotification({
          open: true,
          message: `Sync Complete! ${res.data.total} movies ready.`,
          severity: 'success',
        });
      } catch (err) {
        await fetchMovies();
      } finally {
        setMoviesSyncing(false);
      }
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchMovies();
  }, []);

  useEffect(() => {
    fetchCategories(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChannels();
    }, 150);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setRecentChannels((prev) => {
      const filtered = prev.filter((item) => item.id !== ch.id);
      return [channelWithShield, ...filtered].slice(0, 10);
    });
  }, []);

  const handleSelectMovie = (movie) => {
    if (!movie) return;
    setSelectedMovie(movie);
    setIsMinimized(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const originBase = API_BASE.replace('/api', '');
    const rawUrl = movie.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    const shieldedUrl = rawUrl.startsWith('/') ? `${originBase}${rawUrl}` : rawUrl;

    const movieAsChannel = {
      id: `movie_${movie.id}`,
      name: `${movie.title} (${movie.year})`,
      category_name: movie.category || 'Cinema VOD',
      category_slug: 'movies',
      stream_url: shieldedUrl,
      logo_url: movie.poster_url,
      quality: movie.quality || '1080p FHD',
      language: movie.language || 'Tamil',
      is_active: true,
      description: `${movie.title} (${movie.year}) • Directed/Starring ${movie.stars || 'Blockbuster cast'}. ${movie.synopsis || movie.storyline || 'Stream in 1080p Full HD with synchronized multi-language audio tracks.'}`,
    };

    setSelectedChannel(movieAsChannel);
    setNotification({
      open: true,
      message: `Now Streaming: ${movie.title} (${movie.year})`,
      severity: 'success',
    });
  };

  const handleToggleFavorite = useCallback((channelId) => {
    setFavorites((prev) => {
      const exists = prev.includes(channelId);
      const updated = exists ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      setNotification({
        open: true,
        message: exists ? 'Removed from favorites' : 'Subscribed / Added to favorites!',
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#050507' }}>
      {/* 1. YouTube Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
          setNotification({ open: true, message: 'Channels & catalog refreshed!', severity: 'success' });
        }}
      />

      {/* 2. Main Content Area with YouTube Sidebar Rail */}
      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        {/* YouTube Left Sidebar Rail */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            setShowFavoritesOnly(false);
          }}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={(lang) => {
            setSelectedLanguage(lang);
            setSelectedCategory('all');
            setShowFavoritesOnly(false);
          }}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          favoritesCount={favorites.length}
          recentCount={recentChannels.length}
          languages={languages}
          categories={categories}
        />

        {/* Center / Main Scrollable Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2.5, md: 3 },
            pb: { xs: 9, sm: 3 },
            maxWidth: isTheaterMode ? '100%' : '1800px',
            mx: 'auto',
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          {/* YouTube Watch Page (When a channel/movie is selected) */}
          {selectedChannel && (
            <Fade in timeout={300}>
              <Box sx={{ mb: 4 }}>
                {isTheaterMode ? (
                  // Theater Mode: Full Width Player
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
                ) : (
                  // Standard YouTube Watch Layout: 70% Player + 30% Related Feed
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={8.5}>
                      <VideoPlayer
                        channel={selectedChannel}
                        isFavorite={favorites.includes(selectedChannel.id)}
                        onToggleFavorite={handleToggleFavorite}
                        isTheaterMode={isTheaterMode}
                        onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
                        isMinimized={isMinimized}
                        onToggleMinimize={() => setIsMinimized(!isMinimized)}
                      />
                    </Grid>

                    <Grid item xs={12} lg={3.5}>
                      <RelatedVideosRail
                        channels={channels}
                        currentChannel={selectedChannel}
                        onSelectChannel={handleSelectChannel}
                        favorites={favorites}
                        onToggleFavorite={handleToggleFavorite}
                        recentChannels={recentChannels}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Fade>
          )}

          {/* YouTube Filter Chips Bar */}
          {activeTab === 'live' && (
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
          )}

          {/* Browse Feed Content: Live TV Channels */}
          {activeTab === 'live' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: -0.4 }}>
                  {showFavoritesOnly
                    ? `Subscribed Channels (${displayedChannels.length})`
                    : selectedCategory === 'all'
                    ? `${selectedLanguage === 'all' ? 'Recommended Live Streams' : selectedLanguage.toUpperCase() + ' Streams'} (${displayedChannels.length})`
                    : `${categories.find((c) => c.slug === selectedCategory)?.name || 'Category'} (${displayedChannels.length})`}
                </Typography>
              </Box>

              <ChannelGrid
                channels={displayedChannels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                loading={loading}
              />
            </Box>
          )}

          {/* Browse Feed Content: Movies & Cinema VOD */}
          {activeTab === 'movies' && (
            <Box>
              <Box sx={{ mb: 2.5, px: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: -0.5 }}>
                  Cinema VOD & Multi-Language Movies ({movies.length})
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                  Curated 1080p FHD streams across Tamil, Hollywood English, Dubbed, and Hindi.
                </Typography>
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
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        favoritesCount={favorites.length}
        onSearchFocus={() => {
          const searchInput = document.querySelector('input[aria-label="search stream"]');
          if (searchInput) searchInput.focus();
        }}
      />

      {/* Toast Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ mb: { xs: 7, sm: 0 } }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            bgcolor: notification.severity === 'success' ? '#10b981' : notification.severity === 'error' ? '#e11d48' : '#f97316',
            color: '#ffffff',
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
