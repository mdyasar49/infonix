import React, { useState, useMemo } from 'react';
import {
  Grid,
  Box,
  Typography,
  Chip,
  Skeleton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import FilterListIcon from '@mui/icons-material/FilterList';
import SyncIcon from '@mui/icons-material/Sync';
import StorageIcon from '@mui/icons-material/Storage';
import MovieCard from './MovieCard';
import LanguagePills from './common/LanguagePills';
import ScrollableChipsRail from './common/ScrollableChipsRail';
import PaginationBar from './common/PaginationBar';

const ITEMS_PER_PAGE = 24;

const ERA_FILTERS = [
  { id: 'all', label: 'All Eras (1777-2030)' },
  { id: 'future', label: '🔮 Future & Anticipated (2027-2030)' },
  { id: 'ultra_modern', label: '✨ Current & Modern (2020-2026)' },
  { id: 'decade_2010s', label: '🎬 2010s Blockbusters (2010-2019)' },
  { id: 'golden_2000s', label: '🌟 2000s Golden Era (2000-2009)' },
  { id: 'vintage_90s', label: '📼 1990s Cult Era (1990-1999)' },
  { id: 'retro_70_80', label: '📽️ 70s-80s Classic Cinema (1970-1989)' },
  { id: 'historical_pioneer', label: '🏛️ Historical Pioneers (1777-1969)' },
];

export default function MovieGrid({
  movies = [],
  selectedMovie,
  onSelectMovie,
  loading = false,
  searchQuery = '',
  onSyncMovies,
  syncing = false,
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('tamil');
  const [selectedEra, setSelectedEra] = useState('all');
  const [exactYear, setExactYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Local Media Server / Jellyfin integration state
  const [isMediaServerOpen, setIsMediaServerOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:8096');
  const [apiKey, setApiKey] = useState('');
  const [serverConnecting, setServerConnecting] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);
  const [serverError, setServerError] = useState(null);

  // Available Languages with Counts
  const availableLanguagesWithCounts = useMemo(() => {
    const langMap = {};
    movies.forEach((m) => {
      if (m.language) {
        const l = m.language.toLowerCase();
        langMap[l] = (langMap[l] || 0) + 1;
      }
    });
    return Object.entries(langMap).map(([lang, count]) => ({
      language: lang,
      count,
    }));
  }, [movies]);

  // Available Genres
  const availableGenres = useMemo(() => {
    const genres = new Set();
    movies.forEach((m) => {
      if (m.category) genres.add(m.category);
    });
    return Array.from(genres).sort();
  }, [movies]);

  // Filter logic: Global Omni-Search across all movies, plus filters
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      // 1. Search Query: If searching, match globally across title, stars, synopsis, category, language, year
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title?.toLowerCase().includes(q);
        const matchesStars = m.stars?.toLowerCase().includes(q);
        const matchesCategory = m.category?.toLowerCase().includes(q);
        const matchesLanguage = m.language?.toLowerCase().includes(q);
        const matchesSynopsis = m.synopsis?.toLowerCase().includes(q);
        const matchesYear = m.year?.toString().includes(q);
        return matchesTitle || matchesStars || matchesCategory || matchesLanguage || matchesSynopsis || matchesYear;
      }

      // 2. Language Filter (when not searching)
      if (selectedLanguage !== 'all') {
        if (m.language?.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
      }

      // 3. Exact Year Filter
      if (exactYear.trim()) {
        const yr = parseInt(exactYear.trim(), 10);
        if (!isNaN(yr) && m.year !== yr) return false;
      } else if (selectedEra !== 'all') {
        // 4. Era Filter
        const yr = m.year || 2024;
        if (selectedEra === 'future' && yr < 2027) return false;
        if (selectedEra === 'ultra_modern' && (yr < 2020 || yr > 2026)) return false;
        if (selectedEra === 'decade_2010s' && (yr < 2010 || yr > 2019)) return false;
        if (selectedEra === 'golden_2000s' && (yr < 2000 || yr > 2009)) return false;
        if (selectedEra === 'vintage_90s' && (yr < 1990 || yr > 1999)) return false;
        if (selectedEra === 'retro_70_80' && (yr < 1970 || yr > 1989)) return false;
        if (selectedEra === 'historical_pioneer' && (yr < 1777 || yr > 1969)) return false;
      }

      // 5. Genre Filter
      if (selectedGenre !== 'all') {
        if (m.category?.toLowerCase() !== selectedGenre.toLowerCase()) return false;
      }

      return true;
    });
  }, [movies, searchQuery, selectedLanguage, selectedEra, exactYear, selectedGenre]);

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMovies, currentPage]);

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
              <Skeleton variant="rectangular" width="100%" sx={{ pt: '135%', bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
              <Box sx={{ p: 2 }}>
                <Skeleton width="80%" height={22} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 1 }} />
                <Skeleton width="50%" height={16} sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)' }} />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* 1. VOD Filter Toolbar Card */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          bgcolor: '#0d0d10',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header & Sync button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon sx={{ color: '#f97316' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
              Cinema VOD Filters & Era Timeline
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setIsMediaServerOpen(true)}
              startIcon={<StorageIcon />}
              sx={{
                borderColor: 'rgba(0, 229, 255, 0.4)',
                color: '#00e5ff',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: 20,
                px: 2,
                '&:hover': {
                  borderColor: '#00e5ff',
                  bgcolor: 'rgba(0, 229, 255, 0.1)',
                },
              }}
            >
              Connect Media Server
            </Button>

            <Button
              size="small"
              variant="contained"
              onClick={onSyncMovies}
              disabled={syncing}
              startIcon={<SyncIcon className={syncing ? 'animate-spin' : ''} />}
              sx={{
                background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: 20,
                px: 2,
              }}
            >
              {syncing ? 'Syncing Catalog...' : 'Sync Movie Sources'}
            </Button>
          </Box>
        </Box>

        {/* Row 1: Reusable Language Filter Pills */}
        <Box sx={{ mb: 1.5 }}>
          <LanguagePills
            languages={availableLanguagesWithCounts}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={(lang) => {
              setSelectedLanguage(lang);
              setCurrentPage(1);
            }}
            allowToggle={true}
          />
        </Box>

        {/* Row 2: Reusable Era Timeline + Exact Year */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.8 }}>
            Era / Timeline:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ flexGrow: 1 }}>
              <ScrollableChipsRail
                items={ERA_FILTERS}
                selectedId={exactYear ? '' : selectedEra}
                onSelect={(eraId) => {
                  setSelectedEra(eraId);
                  setExactYear('');
                  setCurrentPage(1);
                }}
                activeGradient="linear-gradient(135deg, #f97316, #ea580c)"
              />
            </Box>

            {/* Exact Year Input */}
            <TextField
              size="small"
              placeholder="Exact Year (1777-2030)"
              value={exactYear}
              onChange={(e) => { setExactYear(e.target.value); setCurrentPage(1); }}
              sx={{
                width: 170,
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 2,
                '& .MuiInputBase-input': {
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  py: 0.8,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: exactYear ? '#f97316' : 'rgba(255, 255, 255, 0.12)',
                },
              }}
            />
          </Box>
        </Box>

        {/* Row 3: Genres */}
        {availableGenres.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.8 }}>
              Genre:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', py: 0.3, '&::-webkit-scrollbar': { display: 'none' } }}>
              <Chip
                label="All Genres"
                size="small"
                clickable
                onClick={() => { setSelectedGenre('all'); setCurrentPage(1); }}
                sx={{
                  bgcolor: selectedGenre === 'all' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontWeight: selectedGenre === 'all' ? 800 : 500,
                }}
              />
              {availableGenres.map((g) => {
                const isSelected = selectedGenre === g;
                return (
                  <Chip
                    key={g}
                    label={g}
                    size="small"
                    clickable
                    onClick={() => { setSelectedGenre(g); setCurrentPage(1); }}
                    sx={{
                      bgcolor: isSelected ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#e11d48' : '#9ca3af',
                      fontWeight: isSelected ? 800 : 500,
                      border: isSelected ? '1px solid #e11d48' : '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* 2. Movie Cards Grid */}
      {filteredMovies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#0d0d10', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <MovieIcon sx={{ fontSize: 44, color: '#f97316', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
            No Movies Matching Criteria
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            Reset your language or timeline filters to see the full cinema library.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {paginatedMovies.map((movie) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCard
                  movie={movie}
                  isSelected={selectedMovie?.id === movie.id}
                  onSelectMovie={onSelectMovie}
                />
              </Grid>
            ))}
          </Grid>

          {/* Reusable Pagination */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMovies.length}
            currentItemsCount={paginatedMovies.length}
            itemLabel="movies"
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* 3. Connect Media Server (Jellyfin / Emby / Plex / Local Folder) Dialog */}
      <Dialog
        open={isMediaServerOpen}
        onClose={() => setIsMediaServerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0d0d10',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 4,
            p: 1.5,
            maxWidth: 520,
            width: '100%',
            color: '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon sx={{ color: '#00e5ff' }} /> Connect Local Media Server / Jellyfin
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
            Connect your local Jellyfin, Emby, or Plex media server to stream your personal movie collection directly in StreamPulse with zero external dependencies.
          </Typography>

          {serverMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{serverMsg}</Alert>}
          {serverError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>}

          <TextField
            fullWidth
            variant="outlined"
            label="Media Server URL"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:8096 or http://192.168.1.100:8096"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                borderRadius: 2.5,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                '&:hover fieldset': { borderColor: '#00e5ff' },
                '&.Mui-focused fieldset': { borderColor: '#e11d48' },
              },
              '& .MuiInputLabel-root': { color: '#9ca3af' },
            }}
          />

          <TextField
            fullWidth
            variant="outlined"
            label="API Key / Access Token (Optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Jellyfin API Key if enabled"
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                borderRadius: 2.5,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                '&:hover fieldset': { borderColor: '#00e5ff' },
                '&.Mui-focused fieldset': { borderColor: '#e11d48' },
              },
              '& .MuiInputLabel-root': { color: '#9ca3af' },
            }}
          />

          <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 700, display: 'block', mb: 1 }}>
            LOCAL NETWORK QUICK DISCOVERY:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Localhost (:8096)"
              clickable
              onClick={() => setServerUrl('http://localhost:8096')}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
            />
            <Chip
              label="Local LAN (:8096)"
              clickable
              onClick={() => setServerUrl('http://192.168.1.100:8096')}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsMediaServerOpen(false)}
            sx={{ color: '#9ca3af', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={serverConnecting}
            onClick={async () => {
              setServerConnecting(true);
              setServerMsg(null);
              setServerError(null);
              try {
                const { connectJellyfinServer } = await import('../services/jellyfinService');
                const info = await connectJellyfinServer(serverUrl, apiKey);
                setServerMsg(`Successfully connected to ${info.serverName}! Server is online.`);
                setTimeout(() => setIsMediaServerOpen(false), 2000);
              } catch (err) {
                setServerError(err.message || 'Failed to connect to Media Server');
              } finally {
                setServerConnecting(false);
              }
            }}
            startIcon={serverConnecting ? <CircularProgress size={16} color="inherit" /> : <StorageIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 20,
              px: 3,
            }}
          >
            {serverConnecting ? 'Testing Connection...' : 'Connect Server'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
