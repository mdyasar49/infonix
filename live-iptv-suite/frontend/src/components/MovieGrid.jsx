import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Skeleton,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
  Pagination
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterListIcon from '@mui/icons-material/FilterList';
import MovieCard from './MovieCard';

const ERA_PRESETS = [
  { label: 'All Eras (1777-2030+)', value: 'all' },
  { label: '🔮 Future Anticipated (2027-2030+)', value: 'future' },
  { label: '🔥 Current Releases (2025-2026)', value: 'current' },
  { label: '2024 Blockbusters', value: '2024' },
  { label: '2020-2023 Modern Hits', value: '2020-2023' },
  { label: '2010s Golden Era', value: '2010s' },
  { label: '2000s Nostalgia', value: '2000s' },
  { label: '1990s Superhits', value: '1990s' },
  { label: '1980s Retro', value: '1980s' },
  { label: '1970s Classics', value: '1970s' },
  { label: '1950s-1960s Golden Era', value: '1950s-1960s' },
  { label: '🏛️ Historical Pioneer (1777-1949)', value: 'pioneer' },
];

const GENRE_FILTERS = [
  'All Genres',
  'Action',
  'Drama',
  'Crime',
  'Sci-Fi',
  'Thriller',
  'Comedy',
  'Romance',
  'Classic Vintage'
];

const LANGUAGE_ICONS = {
  all: '🌐',
  Tamil: '🎬',
  English: '🇺🇸',
  'Tamil Dubbed': '🎙️',
  Hindi: '🇮🇳',
  Telugu: '🎭',
  Malayalam: '🌴',
};

export default function MovieGrid({
  movies,
  selectedMovie,
  onSelectMovie,
  loading,
  searchQuery,
  onSyncMovies,
  syncing
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [customYear, setCustomYear] = useState('');

  // Extract all distinct available years with counts
  const availableYears = useMemo(() => {
    const counts = {};
    movies.forEach((m) => {
      const yr = m.year;
      if (yr) counts[yr] = (counts[yr] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([yr, count]) => ({ year: parseInt(yr), count }))
      .sort((a, b) => b.year - a.year);
  }, [movies]);

  // Compute available languages with counts
  const languageOptions = useMemo(() => {
    const counts = {};
    movies.forEach((m) => {
      const lang = m.language || 'Tamil';
      counts[lang] = (counts[lang] || 0) + 1;
    });

    const list = [
      { label: 'All Languages', value: 'all', count: movies.length, icon: '🌐' }
    ];

    const order = ['Tamil', 'English', 'Tamil Dubbed', 'Hindi', 'Telugu', 'Malayalam'];
    order.forEach((lang) => {
      if (counts[lang]) {
        list.push({
          label: lang === 'English' ? 'English / Hollywood' : lang,
          value: lang,
          count: counts[lang],
          icon: LANGUAGE_ICONS[lang] || '🎬',
        });
        delete counts[lang];
      }
    });

    Object.entries(counts).forEach(([lang, count]) => {
      list.push({
        label: lang,
        value: lang,
        count,
        icon: '🎬',
      });
    });

    return list;
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let list = movies;

    // 1. Language filter
    if (selectedLanguage !== 'all') {
      list = list.filter((m) => (m.language || '').toLowerCase() === selectedLanguage.toLowerCase());
    }

    // 2. Custom exact year filter (supports 1777 to future)
    if (customYear && customYear.trim()) {
      const yrNum = parseInt(customYear.trim());
      if (!isNaN(yrNum)) {
        list = list.filter((m) => m.year === yrNum);
      }
    } else if (selectedEra !== 'all') {
      // 3. Era preset filter
      if (selectedEra === 'future') list = list.filter((m) => m.year >= 2027);
      else if (selectedEra === 'current') list = list.filter((m) => m.year >= 2025 && m.year <= 2026);
      else if (selectedEra === '2024') list = list.filter((m) => m.year === 2024);
      else if (selectedEra === '2020-2023') list = list.filter((m) => m.year >= 2020 && m.year <= 2023);
      else if (selectedEra === '2010s') list = list.filter((m) => m.year >= 2010 && m.year <= 2019);
      else if (selectedEra === '2000s') list = list.filter((m) => m.year >= 2000 && m.year <= 2009);
      else if (selectedEra === '1990s') list = list.filter((m) => m.year >= 1990 && m.year <= 1999);
      else if (selectedEra === '1980s') list = list.filter((m) => m.year >= 1980 && m.year <= 1989);
      else if (selectedEra === '1970s') list = list.filter((m) => m.year >= 1970 && m.year <= 1979);
      else if (selectedEra === '1950s-1960s') list = list.filter((m) => m.year >= 1950 && m.year <= 1969);
      else if (selectedEra === 'pioneer') list = list.filter((m) => m.year < 1950);
    }

    // 4. Genre filter
    if (selectedGenre !== 'All Genres') {
      list = list.filter((m) =>
        (m.category || '').toLowerCase().includes(selectedGenre.toLowerCase()) ||
        (m.synopsis || '').toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    // 5. Search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.synopsis || '').toLowerCase().includes(q) ||
        (m.language || '').toLowerCase().includes(q) ||
        String(m.year).includes(q)
      );
    }

    return list;
  }, [movies, selectedLanguage, selectedEra, selectedGenre, customYear, searchQuery]);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* Top Controls Toolbar: Language & Sync */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        {/* Language Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5, mr: 0.5, whiteSpace: 'nowrap' }}>
            LANGUAGE:
          </Typography>
          {languageOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={`${opt.icon} ${opt.label} (${opt.count})`}
              size="small"
              onClick={() => setSelectedLanguage(opt.value)}
              clickable
              sx={{
                px: 1,
                py: 2,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: selectedLanguage === opt.value ? '#8b5cf6' : 'rgba(30, 41, 59, 0.7)',
                color: selectedLanguage === opt.value ? '#fff' : '#cbd5e1',
                border: selectedLanguage === opt.value ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: selectedLanguage === opt.value ? '0 0 14px rgba(139, 92, 246, 0.4)' : 'none',
                '&:hover': {
                  backgroundColor: selectedLanguage === opt.value ? '#7c3aed' : 'rgba(51, 65, 85, 0.8)',
                },
              }}
            />
          ))}
        </Box>

        {/* Live Online Sync Button */}
        {onSyncMovies && (
          <Button
            variant="outlined"
            size="small"
            onClick={onSyncMovies}
            disabled={syncing}
            startIcon={syncing ? <CircularProgress size={16} sx={{ color: '#06b6d4' }} /> : <SyncIcon />}
            sx={{
              borderColor: 'rgba(6, 182, 212, 0.4)',
              color: '#38bdf8',
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              fontWeight: 700,
              fontSize: '0.78rem',
              borderRadius: 2.5,
              textTransform: 'none',
              px: 1.5,
              py: 0.7,
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.18)',
              },
            }}
          >
            {syncing ? 'Syncing Online Sources...' : '🔄 Sync Online Updates'}
          </Button>
        )}
      </Box>

      {/* Era & Year Navigation Bar (1777 to 2026/Future) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', py: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5, mr: 0.5, whiteSpace: 'nowrap' }}>
          ERA / YEAR:
        </Typography>
        {ERA_PRESETS.map((era) => (
          <Chip
            key={era.value}
            label={era.label}
            size="small"
            onClick={() => {
              setSelectedEra(era.value);
              setCustomYear('');
            }}
            clickable
            sx={{
              px: 1,
              py: 1.8,
              borderRadius: 2.5,
              fontWeight: 600,
              fontSize: '0.8rem',
              backgroundColor: selectedEra === era.value && !customYear ? 'rgba(6, 182, 212, 0.9)' : 'rgba(30, 41, 59, 0.5)',
              color: selectedEra === era.value && !customYear ? '#000' : '#94a3b8',
              border: selectedEra === era.value && !customYear ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              '&:hover': {
                backgroundColor: selectedEra === era.value && !customYear ? '#0891b2' : 'rgba(51, 65, 85, 0.7)',
                color: '#fff',
              },
            }}
          />
        ))}

        {/* Custom Exact Year Selector (Supports 1777 to Future) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, minWidth: 200 }}>
          <TextField
            size="small"
            placeholder="Exact Year (1777-2030)"
            value={customYear}
            onChange={(e) => {
              setCustomYear(e.target.value);
              if (e.target.value) setSelectedEra('custom');
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 170,
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: 2.5,
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                color: '#fff',
                fontSize: '0.78rem',
                border: customYear ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                '& fieldset': { border: 'none' },
              },
            }}
          />

          {customYear && (
            <Chip
              label="Clear"
              size="small"
              onClick={() => {
                setCustomYear('');
                setSelectedEra('all');
              }}
              clickable
              sx={{ height: 26, fontSize: '0.72rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            />
          )}
        </Box>
      </Box>

      {/* Genre Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, overflowX: 'auto', py: 0.5, alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5, mr: 0.5, whiteSpace: 'nowrap' }}>
          GENRE:
        </Typography>
        {GENRE_FILTERS.map((genre) => (
          <Chip
            key={genre}
            label={genre}
            size="small"
            onClick={() => setSelectedGenre(genre)}
            clickable
            sx={{
              px: 0.8,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.78rem',
              backgroundColor: selectedGenre === genre ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: selectedGenre === genre ? '#38bdf8' : '#64748b',
              border: selectedGenre === genre ? '1px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
              },
            }}
          />
        ))}
      </Box>

      {/* Grid or Empty State */}
      {filteredMovies.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 4,
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <MovieIcon sx={{ fontSize: 50, color: '#64748b', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            No movies found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Try another year, era, or search term (Supports 1777 to future releases)
          </Typography>
        </Box>
      ) : (
        <MovieGridPaginated
          filteredMovies={filteredMovies}
          selectedMovie={selectedMovie}
          onSelectMovie={onSelectMovie}
        />
      )}
    </Box>
  );
}

// Extracted paginated grid for cleaner state management
function MovieGridPaginated({ filteredMovies, selectedMovie, onSelectMovie }) {
  const [page, setPage] = React.useState(1);
  const MOVIES_PER_PAGE = 24;

  // Reset page when filter changes
  const movieKey = filteredMovies.length;
  React.useEffect(() => { setPage(1); }, [movieKey]);

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const paginatedMovies = React.useMemo(() => {
    const start = (page - 1) * MOVIES_PER_PAGE;
    return filteredMovies.slice(start, start + MOVIES_PER_PAGE);
  }, [filteredMovies, page]);

  return (
    <Box>
      {totalPages > 1 && (
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={`Page ${page} of ${totalPages} • Showing ${paginatedMovies.length} of ${filteredMovies.length} movies`}
            size="small"
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </Box>
      )}

      <Grid container spacing={2}>
        {paginatedMovies.map((movie) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={movie.id}>
            <MovieCard
              movie={movie}
              isSelected={selectedMovie?.id === movie.id}
              onSelectMovie={onSelectMovie}
            />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, v) => {
              setPage(v);
              window.scrollTo({ top: 280, behavior: 'smooth' });
            }}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#94a3b8',
                fontWeight: 600,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(139, 92, 246, 0.9)',
                  color: '#fff',
                  fontWeight: 800,
                },
                '&:hover': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
