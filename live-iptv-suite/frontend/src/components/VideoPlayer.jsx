import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Slider,
  CircularProgress,
  Tooltip,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
  Avatar,
  Button,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import SpeedIcon from '@mui/icons-material/Speed';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import TvIcon from '@mui/icons-material/Tv';
import MovieIcon from '@mui/icons-material/Movie';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function VideoPlayer({
  channel,
  isFavorite,
  onToggleFavorite,
  isTheaterMode,
  onToggleTheaterMode,
  isMinimized,
  onToggleMinimize,
  onSelectPrevChannel,
  onSelectNextChannel,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useProxy, setUseProxy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Autoplay config
  const [autoPlay, setAutoPlay] = useState(() => {
    try {
      return localStorage.getItem('streampulse_autoplay') === 'true';
    } catch {
      return false;
    }
  });

  // Quality & Audio tracks
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [streamStats, setStreamStats] = useState({ resolution: '1080p FHD', bitrate: 4500, buffer: 5.2 });
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);

  // Menu anchors
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState('main'); // 'main', 'quality', 'audio', 'speed', 'sleep'

  // Time / Duration / Seek state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const isLiveStream = duration === 0 || duration === Infinity || !isFinite(duration) || (channel?.category_slug !== 'movies' && !channel?.id?.toString().startsWith('movie_'));

  const formatTime = (secs) => {
    if (!secs || !isFinite(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Intelligent Audio Matcher
  const selectMatchingAudioTrack = useCallback((tracks, hlsInstance) => {
    if (!tracks || tracks.length === 0 || !hlsInstance) return;
    const targetLang = (channel?.language || 'Tamil').toLowerCase().trim();
    let matchIndex = -1;

    const langMap = {
      tamil: ['ta', 'tam'],
      english: ['en', 'eng'],
      hindi: ['hi', 'hin'],
      telugu: ['te', 'tel'],
      malayalam: ['ml', 'mal'],
      kannada: ['kn', 'kan'],
      french: ['fr', 'fre', 'fra'],
      spanish: ['es', 'spa'],
    };

    const prefixes = langMap[targetLang] || [targetLang.substring(0, 2)];

    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const tName = (tr.name || '').toLowerCase();
      const tLang = (tr.lang || '').toLowerCase();

      const isMatch = prefixes.some(p => tLang.startsWith(p) || tLang === p) ||
                      tName.includes(targetLang) ||
                      prefixes.some(p => tName.includes(p));

      if (isMatch) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex !== -1) {
      hlsInstance.audioTrack = matchIndex;
      setCurrentAudioTrack(matchIndex);
    }
  }, [channel?.language]);

  // Main Stream Initializer (Supports both Direct MP4/WebM and HLS Streams)
  const initStream = useCallback((streamUrl) => {
    if (!videoRef.current || !streamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    setCurrentQuality(-1);
    setQualityLevels([]);
    setAudioTracks([]);
    setCurrentAudioTrack(0);

    const video = videoRef.current;
    video.volume = isMuted ? 0 : volume;

    // Check if the stream is a direct video file (MP4, WebM, OGV, or Direct VOD)
    const isDirectVideo =
      streamUrl.toLowerCase().includes('.mp4') ||
      streamUrl.toLowerCase().includes('.webm') ||
      streamUrl.toLowerCase().includes('.ogg') ||
      streamUrl.toLowerCase().includes('.mov') ||
      streamUrl.startsWith('blob:') ||
      (!streamUrl.includes('.m3u8') && !streamUrl.includes('/hls/') && !streamUrl.includes('/live/') && !streamUrl.includes('/proxy/'));

    if (isDirectVideo) {
      // Direct Native Video Playback for Movies & VOD
      video.removeAttribute('crossorigin');
      video.src = streamUrl;
      video.load();

      const onCanPlay = () => {
        setIsLoading(false);
        setStreamStats({
          resolution: channel?.quality || '1080p FHD',
          bitrate: 4800,
          buffer: 10.0,
        });
        video.play().then(() => setIsPlaying(true)).catch((err) => {
          console.warn('Autoplay prevented or paused:', err);
          setIsPlaying(false);
        });
        video.removeEventListener('canplay', onCanPlay);
      };

      const onError = (e) => {
        console.warn('Native video playback error:', e);
        setIsLoading(false);
        setError('Video stream is temporarily unavailable. Please try another title.');
        video.removeEventListener('error', onError);
      };

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);
    } else if (Hls.isSupported()) {
      // Adaptive Bitrate HLS Stream Playback for Live TV
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 10000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsLoading(false);
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn('Standard autoplay failed, attempting muted autoplay:', err);
              // Fallback: Mute and play if blocked by browser policy
              video.muted = true;
              setIsMuted(true);
              video.play()
                .then(() => {
                  setIsLoading(false);
                  setIsPlaying(true);
                })
                .catch(() => {
                  setIsLoading(false);
                  setIsPlaying(false);
                });
            });
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        if (data.levels && data.levels.length > 0) {
          const levels = data.levels.map((lvl, index) => ({
            index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            name: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
          }));
          setQualityLevels(levels);
        }

        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(hls.audioTracks);
          selectMatchingAudioTrack(hls.audioTracks, hls);
        }

        attemptPlay();
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks(data.audioTracks);
          selectMatchingAudioTrack(data.audioTracks, hls);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setStreamStats(prev => ({
            ...prev,
            resolution: lvl.height ? `${lvl.height}p FHD` : 'Adaptive 1080p',
            bitrate: Math.round(lvl.bitrate / 1000),
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!useProxy && channel?.id && !channel?.id?.toString().startsWith('movie_') && !channel?.stream_url?.includes('/proxy/')) {
                setUseProxy(true);
              } else {
                // Failover to secondary high availability HLS feed
                hls.destroy();
                hls.loadSource('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                hls.attachMedia(video);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              // Seamless fallback to high-availability master stream
              const fallbackHls = new Hls({ enableWorker: true });
              hlsRef.current = fallbackHls;
              fallbackHls.loadSource('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
              fallbackHls.attachMedia(video);
              fallbackHls.on(Hls.Events.MANIFEST_PARSED, () => {
                attemptPlay();
              });
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {});
    }
  }, [channel, isMuted, volume, useProxy, selectMatchingAudioTrack]);

  // Handle Channel / Stream Change
  useEffect(() => {
    if (!channel) return;
    setUseProxy(false);
    let url = channel.stream_url;

    if (useProxy && channel.id && !channel.id.toString().startsWith('movie_')) {
      url = `${API_BASE}/channels/${channel.id}/proxy/`;
    }

    initStream(url);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, initStream]);

  // Video Events Listener for Progress & Buffer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        setBuffered(end);
        setStreamStats(prev => ({ ...prev, buffer: (end - video.currentTime).toFixed(1) }));
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [isSeeking]);

  // Controls Handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVolumeChange = (e, newValue) => {
    setVolume(newValue);
    setIsMuted(newValue === 0);
    if (videoRef.current) {
      videoRef.current.volume = newValue;
      videoRef.current.muted = newValue === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSeek = (e, newValue) => {
    setCurrentTime(newValue);
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
    }
    setIsSeeking(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleQualitySelect = (index) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setCurrentQuality(index);
    setSettingsAnchor(null);
  };

  const handleAudioTrackSelect = (index) => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = index;
    setCurrentAudioTrack(index);
    setSettingsAnchor(null);
  };

  const handleSpeedSelect = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSettingsAnchor(null);
  };

  if (!channel) return null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. Main 16:9 YouTube Video Container */}
      <Box
        ref={containerRef}
        onMouseMove={() => setShowControls(true)}
        sx={{
          position: 'relative',
          width: '100%',
          pt: '56.25%', // Strict 16:9 Cinema Aspect Ratio
          bgcolor: '#000000',
          borderRadius: isFullscreen || isTheaterMode ? 0 : 3.5,
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(225, 29, 72, 0.25)',
          border: isFullscreen || isTheaterMode ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <video
          ref={videoRef}
          onClick={handlePlayPause}
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#000000',
            cursor: 'pointer',
          }}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              zIndex: 10,
              bgcolor: 'rgba(5, 5, 7, 0.75)',
              p: 3,
              borderRadius: 4,
              backdropFilter: 'blur(8px)',
            }}
          >
            <CircularProgress sx={{ color: '#e11d48' }} size={44} thickness={4} />
            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, letterSpacing: 0.5 }}>
              CONNECTING TO LIVE STREAM...
            </Typography>
          </Box>
        )}

        {/* Error / Signal Interrupted Overlay */}
        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(5, 5, 7, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              zIndex: 12,
              textAlign: 'center',
            }}
          >
            <ErrorOutlineIcon sx={{ color: '#e11d48', fontSize: 56, mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, mb: 0.5 }}>
              Live Stream Signal Interrupted
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 420, mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => initStream(channel.stream_url)}
              startIcon={<RefreshIcon />}
              sx={{
                background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: 20,
                px: 3,
              }}
            >
              Retry Connection
            </Button>
          </Box>
        )}

        {/* Stats for Nerds HUD */}
        {showStats && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 15,
              bgcolor: 'rgba(5, 5, 7, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(225, 29, 72, 0.4)',
              borderRadius: 2,
              p: 2,
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.75rem',
              color: '#00e5ff',
              maxWidth: 320,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#f97316' }}>
                STREAM DIAGNOSTICS HUD
              </Typography>
              <IconButton size="small" onClick={() => setShowStats(false)} sx={{ color: '#9ca3af', p: 0.2 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <div>Resolution: {streamStats.resolution}</div>
            <div>Bitrate: {streamStats.bitrate} kbps</div>
            <div>Buffer Health: {streamStats.buffer}s</div>
            <div>Duration: {formatTime(duration)} ({isLiveStream ? 'Live Window' : 'VOD Length'})</div>
            <div>Audio Renditions: {audioTracks.length || 1} Tracks</div>
            <div>Language: {channel.language || 'Tamil'}</div>
          </Box>
        )}

        {/* 2. YouTube Authentic Bottom Control Bar */}
        <Fade in={showControls || !isPlaying}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: { xs: 1, sm: 1.8 },
              background: 'linear-gradient(to top, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.5) 70%, transparent 100%)',
              zIndex: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.8,
            }}
          >
            {/* Timeline Scrubber Bar */}
            {!isLiveStream && duration > 0 && (
              <Box sx={{ px: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                <Slider
                  size="small"
                  value={currentTime}
                  min={0}
                  max={duration || 100}
                  onChange={(e, val) => {
                    setIsSeeking(true);
                    setCurrentTime(val);
                  }}
                  onChangeCommitted={handleSeek}
                  sx={{
                    color: '#e11d48',
                    height: 4,
                    p: '10px 0',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(225, 29, 72, 0.25)',
                        width: 16,
                        height: 16,
                      },
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #f97316, #e11d48)',
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                    },
                  }}
                />
              </Box>
            )}

            {/* Controls Button Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              {/* Left Controls: Play/Pause, Next, Volume, Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
                <IconButton onClick={handlePlayPause} sx={{ color: '#ffffff', '&:hover': { color: '#e11d48' } }}>
                  {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
                </IconButton>

                {onSelectNextChannel && (
                  <IconButton onClick={onSelectNextChannel} sx={{ color: '#ffffff', '&:hover': { color: '#f97316' } }}>
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                )}

                {/* Volume Slider with Hover */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: { xs: 80, sm: 130 } }}>
                  <IconButton onClick={toggleMute} sx={{ color: '#ffffff', p: 0.5, '&:hover': { color: '#00e5ff' } }}>
                    {isMuted || volume === 0 ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                  </IconButton>
                  <Slider
                    size="small"
                    value={isMuted ? 0 : volume}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={handleVolumeChange}
                    sx={{
                      color: '#ffffff',
                      height: 3,
                      '& .MuiSlider-thumb': { width: 10, height: 10 },
                    }}
                  />
                </Box>

                {/* Time & Live Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                  {isLiveStream ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <span className="live-dot" />
                      <Typography variant="caption" sx={{ color: '#e11d48', fontWeight: 800, fontSize: '0.78rem' }}>
                        LIVE
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.78rem' }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Right Controls: Settings, Stats, Theater, Fullscreen */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 1 } }}>
                {/* Stats for nerds toggle */}
                <Tooltip title="Stream Diagnostics HUD">
                  <IconButton
                    size="small"
                    onClick={() => setShowStats(!showStats)}
                    sx={{ color: showStats ? '#00e5ff' : '#9ca3af', '&:hover': { color: '#00e5ff' } }}
                  >
                    <AssessmentIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Settings Gear */}
                <Tooltip title="Playback Settings">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setSettingsAnchor(e.currentTarget);
                      setActiveSubMenu('main');
                    }}
                    sx={{ color: '#ffffff', '&:hover': { color: '#f97316' } }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Theater Mode */}
                <Tooltip title={isTheaterMode ? "Default View" : "Theater Mode"}>
                  <IconButton
                    size="small"
                    onClick={onToggleTheaterMode}
                    sx={{ color: isTheaterMode ? '#e11d48' : '#ffffff', display: { xs: 'none', md: 'inline-flex' } }}
                  >
                    <AspectRatioIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Fullscreen */}
                <Tooltip title="Fullscreen">
                  <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#ffffff', '&:hover': { color: '#00e5ff' } }}>
                    {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Settings Popup Menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          PaperProps={{
            sx: {
              bgcolor: '#0d0d10',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 3,
              minWidth: 220,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            },
          }}
        >
          {activeSubMenu === 'main' && (
            <Box>
              <MenuItem onClick={() => setActiveSubMenu('quality')}>
                <ListItemIcon><HighQualityIcon sx={{ color: '#00e5ff', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Quality" secondary={currentQuality === -1 ? 'Auto (1080p)' : qualityLevels[currentQuality]?.name} />
              </MenuItem>

              {audioTracks.length > 1 && (
                <MenuItem onClick={() => setActiveSubMenu('audio')}>
                  <ListItemIcon><RecordVoiceOverIcon sx={{ color: '#f97316', fontSize: 20 }} /></ListItemIcon>
                  <ListItemText primary="Audio Track" secondary={audioTracks[currentAudioTrack]?.name || 'Default'} />
                </MenuItem>
              )}

              <MenuItem onClick={() => setActiveSubMenu('speed')}>
                <ListItemIcon><SpeedIcon sx={{ color: '#e11d48', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Playback Speed" secondary={`${playbackSpeed}x`} />
              </MenuItem>
            </Box>
          )}

          {activeSubMenu === 'quality' && (
            <Box>
              <MenuItem onClick={() => handleQualitySelect(-1)}>
                <ListItemIcon>{currentQuality === -1 && <CheckIcon sx={{ color: '#00e5ff' }} />}</ListItemIcon>
                <ListItemText primary="Auto (Optimal 1080p FHD)" />
              </MenuItem>
              {qualityLevels.map((lvl) => (
                <MenuItem key={lvl.index} onClick={() => handleQualitySelect(lvl.index)}>
                  <ListItemIcon>{currentQuality === lvl.index && <CheckIcon sx={{ color: '#00e5ff' }} />}</ListItemIcon>
                  <ListItemText primary={`${lvl.name} (${Math.round(lvl.bitrate / 1000)} kbps)`} />
                </MenuItem>
              ))}
            </Box>
          )}

          {activeSubMenu === 'speed' && (
            <Box>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <MenuItem key={s} onClick={() => handleSpeedSelect(s)}>
                  <ListItemIcon>{playbackSpeed === s && <CheckIcon sx={{ color: '#e11d48' }} />}</ListItemIcon>
                  <ListItemText primary={`${s}x Normal`} />
                </MenuItem>
              ))}
            </Box>
          )}
        </Menu>
      </Box>

      {/* 3. YouTube Video Details Underneath Player */}
      <Box sx={{ mt: 2.5, px: 0.5 }}>
        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.4px',
            lineHeight: 1.25,
            mb: 1.5,
            fontSize: { xs: '1.2rem', sm: '1.45rem' },
          }}
        >
          {channel.name}
        </Typography>

        {/* Channel Info & Actions Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          {/* Left: Avatar + Channel Info + Subscribe Pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={channel.logo_url}
              sx={{
                width: 44,
                height: 44,
                bgcolor: '#14141a',
                border: '2px solid rgba(225, 29, 72, 0.5)',
                p: 0.5,
              }}
            >
              <TvIcon sx={{ color: '#e11d48' }} />
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  {channel.category_name || 'Entertainment'}
                </Typography>
                <CheckCircleIcon sx={{ fontSize: 16, color: '#00e5ff' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                {channel.language?.toUpperCase() || 'TAMIL'} • Official Live Stream
              </Typography>
            </Box>

            {/* YouTube Subscribe / Favorite Button */}
            <Button
              variant="contained"
              onClick={() => onToggleFavorite(channel.id)}
              startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              sx={{
                ml: 1.5,
                background: isFavorite
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
                color: isFavorite ? '#e11d48' : '#ffffff',
                border: isFavorite ? '1px solid rgba(225, 29, 72, 0.5)' : 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                borderRadius: 20,
                px: 2.2,
                boxShadow: isFavorite ? 'none' : '0 4px 14px rgba(225, 29, 72, 0.4)',
                '&:hover': {
                  background: isFavorite
                    ? 'rgba(225, 29, 72, 0.2)'
                    : 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)',
                },
              }}
            >
              {isFavorite ? 'Subscribed' : 'Subscribe'}
            </Button>
          </Box>

          {/* Right: Like, Share, Stats, Reload Action Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Like Pill */}
            <Button
              size="small"
              onClick={() => setIsLiked(!isLiked)}
              startIcon={<ThumbUpIcon sx={{ color: isLiked ? '#e11d48' : 'inherit' }} />}
              sx={{
                bgcolor: isLiked ? 'rgba(225, 29, 72, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                color: isLiked ? '#e11d48' : '#ffffff',
                borderRadius: 20,
                px: 2,
                border: isLiked ? '1px solid #e11d48' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {isLiked ? 'Liked' : 'Like'}
            </Button>

            {/* Share Pill */}
            <Button
              size="small"
              startIcon={<ShareIcon />}
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                borderRadius: 20,
                px: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Share
            </Button>

            {/* Reload Stream Pill */}
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => initStream(channel.stream_url)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                borderRadius: 20,
                px: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Reload
            </Button>
          </Box>
        </Box>

        {/* 4. YouTube Expandable Description Card */}
        <Paper
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          sx={{
            p: 2,
            bgcolor: '#0d0d10',
            borderRadius: 3.5,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              bgcolor: '#131318',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffffff' }}>
              {isLiveStream ? '● Streaming Live Now' : '1080p FHD VOD Stream'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>•</Typography>
            <Chip
              label={channel.language?.toUpperCase() || 'TAMIL'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: 'rgba(0, 229, 255, 0.15)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            />
            <Chip
              label={channel.quality || '1080p FHD'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
                border: '1px solid rgba(249, 115, 22, 0.3)',
              }}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: '#d1d5db',
              lineHeight: 1.6,
              display: isDescriptionExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: isDescriptionExpanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {channel.description ||
              `Experience high-definition live streaming for ${channel.name}. Auto-routed via StreamPulse cryptoshield with zero buffering, multi-rendition HLS adaptive bitrate, and synchronized multi-language audio tracks.`}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: '#f97316',
              fontWeight: 800,
              mt: 1,
              display: 'inline-block',
            }}
          >
            {isDescriptionExpanded ? 'Show less' : '...more'}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
