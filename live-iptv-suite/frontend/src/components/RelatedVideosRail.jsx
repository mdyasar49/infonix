import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardActionArea,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import TvIcon from '@mui/icons-material/Tv';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export default function RelatedVideosRail({
  channels = [],
  currentChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite,
  recentChannels = [],
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'category', 'recent'

  // Filter channels for the rail
  const displayList = React.useMemo(() => {
    if (activeFilter === 'recent') {
      return recentChannels.filter((c) => c.id !== currentChannel?.id);
    }
    if (activeFilter === 'category' && currentChannel?.category_slug) {
      return channels
        .filter((c) => c.id !== currentChannel?.id && c.category_slug === currentChannel?.category_slug)
        .slice(0, 20);
    }
    return channels.filter((c) => c.id !== currentChannel?.id).slice(0, 20);
  }, [channels, currentChannel, activeFilter, recentChannels]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. YouTube Up Next Header & Chips */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', mb: 1, letterSpacing: -0.3 }}>
          Up Next & Related Streams
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
          <Chip
            label="All"
            size="small"
            clickable
            onClick={() => setActiveFilter('all')}
            sx={{
              bgcolor: activeFilter === 'all' ? '#e11d48' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontWeight: activeFilter === 'all' ? 800 : 500,
              fontSize: '0.78rem',
            }}
          />
          {currentChannel?.category_name && (
            <Chip
              label={currentChannel.category_name}
              size="small"
              clickable
              onClick={() => setActiveFilter('category')}
              sx={{
                bgcolor: activeFilter === 'category' ? '#f97316' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontWeight: activeFilter === 'category' ? 800 : 500,
                fontSize: '0.78rem',
              }}
            />
          )}
          {recentChannels.length > 0 && (
            <Chip
              label="Recently Watched"
              size="small"
              clickable
              onClick={() => setActiveFilter('recent')}
              sx={{
                bgcolor: activeFilter === 'recent' ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)',
                color: activeFilter === 'recent' ? '#050507' : '#ffffff',
                fontWeight: activeFilter === 'recent' ? 800 : 500,
                fontSize: '0.78rem',
              }}
            />
          )}
        </Box>
      </Box>

      {/* 2. YouTube Compact Video Items List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {displayList.map((ch) => {
          const isFav = favorites.includes(ch.id);
          return (
            <Card
              key={ch.id}
              sx={{
                display: 'flex',
                bgcolor: '#0d0d10',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 2.5,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#14141a',
                  borderColor: 'rgba(225, 29, 72, 0.4)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => onSelectChannel(ch)}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  p: 1,
                  gap: 1.5,
                  flexGrow: 1,
                }}
              >
                {/* Left: 16:9 Mini Thumbnail */}
                <Box
                  sx={{
                    width: 120,
                    minWidth: 120,
                    pt: '67.5px', // 16:9 aspect for 120px width
                    position: 'relative',
                    bgcolor: '#14141a',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                  }}
                >
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
                      p: 1,
                    }}
                  >
                    {ch.logo_url ? (
                      <Box
                        component="img"
                        src={ch.logo_url}
                        alt={ch.name}
                        loading="lazy"
                        sx={{ maxWidth: '80%', maxHeight: '70%', objectFit: 'contain' }}
                      />
                    ) : (
                      <TvIcon sx={{ color: '#e11d48', fontSize: 24 }} />
                    )}
                  </Box>

                  {/* LIVE Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: 'rgba(225, 29, 72, 0.9)',
                      color: '#ffffff',
                      px: 0.6,
                      py: 0.1,
                      borderRadius: 0.8,
                      fontSize: '0.6rem',
                      fontWeight: 800,
                    }}
                  >
                    LIVE
                  </Box>
                </Box>

                {/* Right: Info Details */}
                <Box sx={{ flexGrow: 1, minWidth: 0, py: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.25,
                      mb: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.86rem',
                    }}
                  >
                    {ch.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9ca3af',
                      display: 'block',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ch.category_name || 'Channel'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600 }}>
                      {ch.language?.toUpperCase() || 'TAMIL'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4b5563' }}>•</Typography>
                    <Typography variant="caption" sx={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>
                      HD
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>

              {/* Action Favorite */}
              <Tooltip title={isFav ? "Unfavorite" : "Save Favorite"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(ch.id);
                  }}
                  sx={{
                    alignSelf: 'center',
                    mr: 0.5,
                    color: isFav ? '#e11d48' : '#6b7280',
                    '&:hover': { color: '#e11d48' },
                  }}
                >
                  {isFav ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
