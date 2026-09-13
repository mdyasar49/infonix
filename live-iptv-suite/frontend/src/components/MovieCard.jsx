import React, { memo } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
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
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: '#131b2e',
        border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isSelected
          ? '0 0 20px rgba(6, 182, 212, 0.45)'
          : '0 4px 14px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.7), 0 0 16px rgba(6, 182, 212, 0.3)',
          borderColor: '#38bdf8',
          '& .movie-play-btn': {
            opacity: 1,
            transform: 'scale(1)',
          },
          '& .movie-poster': {
            transform: 'scale(1.06)',
          },
        },
      }}
    >
      {/* Poster Container */}
      <Box sx={{ position: 'relative', width: '100%', pt: '145%', overflow: 'hidden', bgcolor: '#0b0f19' }}>
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
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Top Badges */}
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
                backgroundColor: movie.year >= 2027
                  ? '#ec4899'
                  : movie.year < 1950
                  ? '#d97706'
                  : 'rgba(6, 182, 212, 0.9)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.72rem',
                height: 22,
                boxShadow: movie.year >= 2027 ? '0 0 10px rgba(236, 72, 153, 0.6)' : 'none',
              }}
            />
            {movie.language && (
              <Chip
                label={movie.language}
                size="small"
                sx={{
                  backgroundColor: movie.language.includes('Dubbed')
                    ? 'rgba(168, 85, 247, 0.85)'
                    : movie.language.includes('English')
                    ? 'rgba(234, 179, 8, 0.85)'
                    : movie.language.includes('Hindi')
                    ? 'rgba(249, 115, 22, 0.85)'
                    : 'rgba(59, 130, 246, 0.85)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  height: 20,
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              px: 0.8,
              py: 0.3,
              borderRadius: 2,
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <StarIcon sx={{ color: '#eab308', fontSize: 13 }} />
            <Typography variant="caption" sx={{ color: '#fef08a', fontWeight: 700, fontSize: '0.72rem' }}>
              {movie.rating}
            </Typography>
          </Box>
        </Box>

        {/* Hover Overlay Play Button */}
        <Box
          className="movie-play-btn"
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0,
            transform: 'scale(0.8)',
            transition: 'all 0.25s ease',
            zIndex: 3,
          }}
        >
          <IconButton
            sx={{
              backgroundColor: 'rgba(6, 182, 212, 0.95)',
              color: '#000',
              width: 50,
              height: 50,
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)',
              '&:hover': {
                backgroundColor: '#38bdf8',
                transform: 'scale(1.1)',
              },
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        {/* Bottom Gradient */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, #131b2e 0%, transparent 100%)',
            zIndex: 1,
          }}
        />
      </Box>

      {/* Movie Details */}
      <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            fontWeight: 700,
            color: isSelected ? '#38bdf8' : '#f8fafc',
            fontSize: '0.9rem',
            mb: 0.5,
          }}
        >
          {movie.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8' }}>
          <Typography variant="caption" noWrap sx={{ maxWidth: '65%', fontSize: '0.72rem' }}>
            {movie.category}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <AccessTimeIcon sx={{ fontSize: 11, color: '#64748b' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {movie.duration}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});
