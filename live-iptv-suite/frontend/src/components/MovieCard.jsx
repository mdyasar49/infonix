import React, { memo } from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HdIcon from '@mui/icons-material/Hd';

export default memo(function MovieCard({ movie, isSelected, onSelectMovie }) {
  return (
    <Card
      onClick={() => onSelectMovie(movie)}
      sx={{
        position: 'relative',
        borderRadius: 3.5,
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: '#0d0d10',
        border: isSelected ? '2px solid #e11d48' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isSelected
          ? '0 0 24px rgba(225, 29, 72, 0.45)'
          : '0 4px 16px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 18px rgba(249, 115, 22, 0.3)',
          borderColor: '#f97316',
          '& .movie-play-btn': {
            opacity: 1,
            transform: 'scale(1)',
          },
          '& .movie-poster': {
            transform: 'scale(1.05)',
          },
        },
      }}
    >
      {/* Poster Container (16:9 or Vertical Poster) */}
      <Box sx={{ position: 'relative', width: '100%', pt: '135%', overflow: 'hidden', bgcolor: '#07070a' }}>
        <CardMedia
          component="img"
          image={movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'}
          alt={movie.title}
          className="movie-poster"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
          }}
        />

        {/* Top Badges (Year + Language + Rating) */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
            <Chip
              label={movie.year >= 2027 ? `🔮 ${movie.year}` : movie.year < 1950 ? `🏛️ ${movie.year}` : movie.year}
              size="small"
              sx={{
                background: movie.year >= 2027
                  ? 'linear-gradient(135deg, #c026d3 0%, #e11d48 100%)'
                  : movie.year < 1950
                  ? '#d97706'
                  : 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.7rem',
                height: 22,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            />
            {movie.language && (
              <Chip
                label={movie.language}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.75)',
                  color: '#00e5ff',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 22,
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  backdropFilter: 'blur(4px)',
                }}
              />
            )}
          </Box>

          {/* Rating */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              px: 0.8,
              py: 0.3,
              borderRadius: 1.5,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <StarIcon sx={{ color: '#f59e0b', fontSize: 14 }} />
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}>
              {movie.rating ? Number(movie.rating).toFixed(1) : '9.0'}
            </Typography>
          </Box>
        </Box>

        {/* Hover Center Play Button */}
        <Box
          className="movie-play-btn"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 25px rgba(225, 29, 72, 0.7)',
            zIndex: 3,
          }}
        >
          <PlayArrowIcon sx={{ color: '#ffffff', fontSize: 32, ml: 0.3 }} />
        </Box>

        {/* Bottom Poster Gradient & Duration */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(to top, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.4) 60%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.7)', px: 0.8, py: 0.2, borderRadius: 1 }}>
            <HdIcon sx={{ color: '#00e5ff', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.68rem' }}>
              {movie.quality || '1080p'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: 'rgba(0,0,0,0.7)', px: 0.8, py: 0.2, borderRadius: 1 }}>
            <AccessTimeIcon sx={{ color: '#f97316', fontSize: 13 }} />
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.68rem' }}>
              {movie.duration_display || '2h 15m'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card Info Content */}
      <Box sx={{ p: 1.6, bgcolor: '#0d0d10' }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: isSelected ? '#e11d48' : '#ffffff',
            fontSize: '0.94rem',
            lineHeight: 1.25,
            mb: 0.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {movie.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#9ca3af',
            fontSize: '0.78rem',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.8,
          }}
        >
          {movie.category || 'Cinema'} • {movie.stars || 'Blockbuster'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 700, fontSize: '0.72rem' }}>
            ▶ STREAM NOW
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
            STEALTH VOD
          </Typography>
        </Box>
      </Box>
    </Card>
  );
});
