import React, { memo } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TvIcon from '@mui/icons-material/Tv';

export default memo(function ChannelCard({
  channel,
  isSelected,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isSelected
          ? '0 0 20px rgba(6, 182, 212, 0.4), 0 8px 16px rgba(0,0,0,0.5)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        background: isSelected
          ? 'linear-gradient(145deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : 'rgba(15, 23, 42, 0.65)',
        transform: isSelected ? 'scale(1.02)' : 'none',
      }}
    >
      <CardActionArea onClick={() => onSelect(channel)} sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {/* Logo container */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              backgroundColor: channel.logo_url && !imgError ? 'rgba(255, 255, 255, 0.96)' : 'rgba(30, 41, 59, 0.8)',
              p: channel.logo_url && !imgError ? 0.75 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {channel.logo_url && !imgError ? (
              <Box
                component="img"
                src={channel.logo_url}
                alt={channel.name}
                loading="lazy"
                onError={() => setImgError(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <TvIcon sx={{ color: '#06b6d4', fontSize: 30 }} />
            )}
          </Box>

          {/* Quality Chip */}
          <Chip
            label={channel.quality || 'HD'}
            size="small"
            sx={{
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              fontSize: '0.68rem',
              fontWeight: 700,
              height: 22,
              borderRadius: 1.5,
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}
          />
        </Box>

        <CardContent sx={{ p: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isSelected ? '#38bdf8' : '#f8fafc',
              fontSize: '0.98rem',
              lineHeight: 1.25,
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {channel.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
              {channel.category_name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <span className="live-dot" />
              <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }}>
                LIVE
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Favorite button absolute positioned */}
      <Tooltip title={isFavorite ? "Remove favorite" : "Save favorite"}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel.id);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            '&:hover': {
              color: '#ef4444',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparator: only re-render if these specific props change
  return (
    prevProps.channel.id === nextProps.channel.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});

