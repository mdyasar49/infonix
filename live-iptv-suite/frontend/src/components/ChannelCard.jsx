import React, { memo, useState } from 'react';
import {
  Card,
  CardActionArea,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TvIcon from '@mui/icons-material/Tv';
import LiveBadge from './common/LiveBadge';
import QualityBadge from './common/QualityBadge';

export default memo(function ChannelCard({
  channel,
  isSelected,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0d0d10',
        border: isSelected ? '1px solid #e11d48' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3.5,
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 0 24px rgba(225, 29, 72, 0.4), 0 8px 20px rgba(0, 0, 0, 0.8)'
          : '0 4px 16px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.22s cubic-bezier(0.2, 0, 0, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(249, 115, 22, 0.45)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.8), 0 0 20px rgba(225, 29, 72, 0.25)',
          '& .yt-play-overlay': {
            opacity: 1,
          },
          '& .yt-thumb-logo': {
            transform: 'scale(1.08)',
          },
        },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(channel)}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 0,
        }}
      >
        {/* 1. YouTube 16:9 Thumbnail Area */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            pt: '56.25%', // 16:9 Aspect Ratio
            bgcolor: '#14141a',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Logo / Thumbnail Content */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              background: 'radial-gradient(circle at 50% 50%, #1e1e28 0%, #0d0d12 100%)',
            }}
          >
            {channel.logo_url && !imgError ? (
              <Box
                component="img"
                src={channel.logo_url}
                alt={channel.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className="yt-thumb-logo"
                sx={{
                  maxWidth: '70%',
                  maxHeight: '65%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
                  transition: 'transform 0.3s ease',
                }}
              />
            ) : (
              <TvIcon sx={{ color: '#e11d48', fontSize: 48 }} />
            )}
          </Box>

          {/* Hover Play Icon Overlay */}
          <Box
            className="yt-play-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                bgcolor: 'rgba(225, 29, 72, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(225, 29, 72, 0.6)',
              }}
            >
              <PlayArrowIcon sx={{ color: '#ffffff', fontSize: 30, ml: 0.3 }} />
            </Box>
          </Box>

          {/* Top Left Reusable Quality Chip */}
          <QualityBadge
            quality={channel.quality || 'FHD'}
            sx={{ position: 'absolute', top: 8, left: 8 }}
          />

          {/* Bottom Right Reusable LIVE Badge */}
          <LiveBadge
            sx={{ position: 'absolute', bottom: 8, right: 8 }}
          />
        </Box>

        {/* 2. YouTube Video Info Section */}
        <Box sx={{ p: 1.8, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          {/* Channel Avatar Circle */}
          <Avatar
            src={channel.logo_url && !imgError ? channel.logo_url : undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#1a1a24',
              border: isSelected ? '2px solid #e11d48' : '1px solid rgba(255, 255, 255, 0.15)',
              p: 0.4,
              flexShrink: 0,
            }}
          >
            <TvIcon sx={{ fontSize: 18, color: '#e11d48' }} />
          </Avatar>

          {/* Titles & Metadata */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: isSelected ? '#e11d48' : '#ffffff',
                fontSize: '0.92rem',
                lineHeight: 1.3,
                mb: 0.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {channel.name}
            </Typography>

            {/* Channel Name & Verified Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#9ca3af',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {channel.category_name || 'Entertainment'}
              </Typography>
              <CheckCircleIcon sx={{ fontSize: 14, color: '#00e5ff' }} />
            </Box>

            {/* Language & Stream Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 600 }}>
                {channel.language?.toUpperCase() || 'TAMIL'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#4b5563' }}>•</Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>
                100% ONLINE
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardActionArea>

      {/* Favorite Heart Button */}
      <Tooltip title={isFavorite ? "Remove from subscriptions" : "Subscribe / Save to favorites"}>
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
            zIndex: 3,
            color: isFavorite ? '#e11d48' : 'rgba(255, 255, 255, 0.6)',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              color: '#e11d48',
              bgcolor: 'rgba(0, 0, 0, 0.85)',
            },
          }}
        >
          {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.channel.id === nextProps.channel.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.channel.name === nextProps.channel.name &&
    prevProps.channel.stream_url === nextProps.channel.stream_url
  );
});
