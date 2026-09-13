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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HdIcon from '@mui/icons-material/Hd';
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
  const [autoPlay, setAutoPlay] = useState(() => {
    try {
      return localStorage.getItem('streampulse_autoplay') === 'true'; // false by default
    } catch {
      return false;
    }
  });

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('streampulse_autoplay', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Advanced features state
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [streamStats, setStreamStats] = useState({ resolution: 'Detecting...', bitrate: 0, buffer: 0 });
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

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs) => {
    if (!secs || !isFinite(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Intelligent Audio Track Matcher: Matches channel.language to HLS audio renditions
  const selectMatchingAudioTrack = useCallback((tracks, hlsInstance) => {
    if (!tracks || tracks.length === 0 || !hlsInstance) return;

    const targetLang = (channel?.language || 'Tamil').toLowerCase().trim();
    let matchIndex = -1;

    // Language code mapping: Full name -> ISO 639 prefixes
    const langMap = {
      tamil: ['ta', 'tam'],
      english: ['en', 'eng'],
      hindi: ['hi', 'hin'],
      telugu: ['te', 'tel'],
      malayalam: ['ml', 'mal'],
      kannada: ['kn', 'kan'],
      bengali: ['bn', 'ben', 'ban'],
      marathi: ['mr', 'mar'],
      gujarati: ['gu', 'guj'],
      punjabi: ['pa', 'pan'],
      odia: ['or', 'ori'],
      urdu: ['ur', 'urd'],
      french: ['fr', 'fre', 'fra'],
      spanish: ['es', 'spa'],
      german: ['de', 'ger', 'deu'],
      japanese: ['ja', 'jpn'],
      korean: ['ko', 'kor'],
      chinese: ['zh', 'chi', 'zho'],
      arabic: ['ar', 'ara'],
      portuguese: ['pt', 'por'],
      russian: ['ru', 'rus'],
      italian: ['it', 'ita'],
    };

    const prefixes = langMap[targetLang] || [targetLang.substring(0, 2)];

    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const tName = (tr.name || '').toLowerCase();
      const tLang = (tr.lang || '').toLowerCase();

      // Check if track matches via ISO code prefix or name inclusion
      const isMatch = prefixes.some(p => tLang.startsWith(p) || tLang === p) ||
                      tName.includes(targetLang) ||
                      prefixes.some(p => tName.includes(p));

      if (isMatch) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex !== -1 && hlsInstance.audioTrack !== matchIndex) {
      console.log(`[AudioTrack] Auto-switched to track ${matchIndex} for ${targetLang}:`, tracks[matchIndex].name || tracks[matchIndex].lang);
      hlsInstance.audioTrack = matchIndex;
      setCurrentAudioTrack(matchIndex);
    } else if (matchIndex === -1) {
      // No exact match found - keep current track
      setCurrentAudioTrack(hlsInstance.audioTrack >= 0 ? hlsInstance.audioTrack : 0);
    }
  }, [channel?.language]);

  // Initialize and load stream
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    let hls = null;
    let retryCount = 0;
    setIsLoading(true);
    setError(null);
    setQualityLevels([]);
    setAudioTracks([]);
    setCurrentQuality(-1);
    setIsPlaying(false);

    let targetStream = channel.stream_url;
    if (targetStream.startsWith('/')) {
      const originBase = API_BASE.replace('/api', '');
      targetStream = `${originBase}${targetStream}`;
    }

    const isShielded = targetStream.includes('/api/stream/');
    const isHls =
      targetStream.includes('.m3u8') ||
      targetStream.includes('/channel/') ||
      targetStream.includes('/ticket/') ||
      targetStream.includes('/live') ||
      targetStream.includes('manifest') ||
      (channel.category_slug !== 'movies' && !targetStream.includes('/movie/'));

    const streamUrl = (useProxy && !isShielded)
      ? `${API_BASE}/proxy/?url=${encodeURIComponent(targetStream)}`
      : targetStream;

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 25000,
        fragLoadingMaxRetry: 8,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      // MANIFEST_PARSED: Primary event for audio track selection and quality detection
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        if (data.levels && data.levels.length > 0) {
          setQualityLevels(data.levels);
        }

        // Auto-select correct audio language immediately on manifest parse
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(hls.audioTracks);
          selectMatchingAudioTrack(hls.audioTracks, hls);
        }

        if (autoPlay) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(false);
        }
      });

      // AUDIO_TRACKS_UPDATED: Fires when tracks change dynamically (some streams)
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks(data.audioTracks);
          selectMatchingAudioTrack(data.audioTracks, hls);
        }
      });

      // AUDIO_TRACK_LOADED: Confirm audio track is loaded and verify language
      hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => {
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          selectMatchingAudioTrack(hls.audioTracks, hls);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setStreamStats((prev) => ({
            ...prev,
            resolution: `${level.width}x${level.height}`,
            bitrate: Math.round(level.bitrate / 1000),
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          retryCount++;
          console.warn(`HLS Fatal Error #${retryCount}, initiating auto-recovery:`, data.type, data.details);

          if (retryCount > 5) {
            setIsLoading(false);
            setError('Stream is temporarily unavailable. Please try again later or select another channel.');
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!useProxy) {
                console.log('Network error -> Transparently switching to Django CORS proxy...');
                setUseProxy(true);
              } else {
                // Exponential backoff retry
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
                setTimeout(() => hls && hls.startLoad(), delay);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (!useProxy) {
                setUseProxy(true);
              } else {
                setIsLoading(false);
                setError('Stream temporarily buffering or retrying...');
                setTimeout(() => hls && hls.startLoad(), 3000);
              }
              break;
          }
        }
      });
    } else {
      // Native HTML5 Video playback for MP4 movies & native HLS browsers (Safari/iOS)
      videoRef.current.src = streamUrl;
      videoRef.current.load();

      const onLoaded = () => {
        setIsLoading(false);
        if (autoPlay) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(false);
        }
      };

      const onError = () => {
        retryCount++;
        if (retryCount > 3) {
          setIsLoading(false);
          setError('Movie stream temporarily unavailable. The stream shield will auto-heal on next attempt.');
          return;
        }
        if (!useProxy) {
          console.log('Direct video error -> Retrying via Django CORS streaming proxy...');
          setUseProxy(true);
        } else {
          setIsLoading(false);
          setError('Stream source is being resolved. Click play to retry.');
        }
      };

      videoRef.current.addEventListener('loadeddata', onLoaded);
      videoRef.current.addEventListener('error', onError);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', onLoaded);
          videoRef.current.removeEventListener('error', onError);
        }
        if (hls) {
          hls.destroy();
          hlsRef.current = null;
        }
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, useProxy, selectMatchingAudioTrack]);

  // Time / Duration / Buffered tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      // Update buffered range
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const onDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [isSeeking]);

  // Buffer stats interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const bufferEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        const current = videoRef.current.currentTime;
        const bufferAhead = Math.max(0, bufferEnd - current);
        setStreamStats((prev) => ({
          ...prev,
          buffer: bufferAhead.toFixed(1),
        }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sleep Timer Countdown
  useEffect(() => {
    if (!sleepTimerRemaining) return;
    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  // Keyboard Shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      // Avoid hotkeys when typing in search input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          if (onToggleTheaterMode) onToggleTheaterMode();
          break;
        case 'p':
          e.preventDefault();
          toggleNativePiP();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowleft':
          e.preventDefault();
          if (!isLiveStream && videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (!isLiveStream && videoRef.current && isFinite(videoRef.current.duration)) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          }
          break;
        default:
          break;
      }
    },
    [isPlaying, isMuted, volume, onToggleTheaterMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // Ensure correct audio track is selected before playing
      if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > 0) {
        selectMatchingAudioTrack(hlsRef.current.audioTracks, hlsRef.current);
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleVolumeChange = (e, newVal) => {
    setVolume(newVal);
    if (videoRef.current) {
      videoRef.current.volume = newVal;
      if (newVal === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleNativePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP Error:', e);
      // Fallback to in-app minimize
      if (onToggleMinimize) onToggleMinimize();
    }
  };

  const changeQualityLevel = (levelIndex) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setSettingsAnchor(null);
  };

  const changeAudioTrack = (trackId) => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = trackId;
    setCurrentAudioTrack(trackId);
    setSettingsAnchor(null);
  };

  const changeSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setSettingsAnchor(null);
  };

  const setSleepTimer = (minutes) => {
    if (minutes === 0) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
    setSettingsAnchor(null);
  };

  const formatTimer = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!channel) return null;

  // Floating Minimized Mode
  if (isMinimized) {
    return (
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: { xs: 280, sm: 360 },
          height: { xs: 160, sm: 205 },
          zIndex: 9999,
          borderRadius: 3.5,
          overflow: 'hidden',
          backgroundColor: '#000',
          border: '2px solid #06b6d4',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.9), 0 0 24px rgba(6, 182, 212, 0.4)',
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={videoRef}
            onClick={togglePlay}
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
            playsInline
          />
          {/* Top Bar for Mini Player */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              p: 1,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, ml: 0.5 }} numberOfLines={1}>
              {channel.name}
            </Typography>
            <Box>
              <IconButton size="small" onClick={onToggleMinimize} sx={{ color: '#06b6d4', p: 0.5 }}>
                <OpenInFullIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      {/* Ambient background glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-10px',
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.18) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(0,0,0,0) 80%)',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Paper
        ref={containerRef}
        elevation={10}
        sx={{
          position: 'relative',
          zIndex: 1,
          borderRadius: isTheaterMode ? 0 : 4,
          overflow: 'hidden',
          background: '#000000',
          border: isTheaterMode ? 'none' : '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(6, 182, 212, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: isTheaterMode
              ? { xs: 320, sm: 480, md: 620 }
              : { xs: 240, sm: 380, md: 500 },
            backgroundColor: '#000',
          }}
        >
          <video
            ref={videoRef}
            onClick={togglePlay}
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
            playsInline
          />

          {/* Loading Indicator */}
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <CircularProgress sx={{ color: '#06b6d4' }} size={52} thickness={4} />
              <Typography variant="caption" sx={{ color: '#e2e8f0', mt: 2, fontWeight: 700, letterSpacing: 1 }}>
                TUNING INTO LIVE SATELLITE FEED...
              </Typography>
            </Box>
          )}

          {/* Error Screen */}
          {error && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                p: 3,
                textAlign: 'center',
              }}
            >
              <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 50, mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                Live Stream Signal Interrupted
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 440, mt: 0.5 }}>
                {error}
              </Typography>
            </Box>
          )}

          {/* Center Click-To-Play Button (Auto-Play Disabled or Stream Paused) */}
          {!isPlaying && !isLoading && !error && (
            <Box
              onClick={togglePlay}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.52)',
                backdropFilter: 'blur(3px)',
                cursor: 'pointer',
                zIndex: 8,
                transition: 'all 0.25s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.38)',
                },
                '&:hover .play-glow-circle': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 35px rgba(6, 182, 212, 0.8), 0 0 15px #3b82f6',
                },
              }}
            >
              <Box
                className="play-glow-circle"
                sx={{
                  width: { xs: 68, sm: 84 },
                  height: { xs: 68, sm: 84 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  mb: 1.5,
                }}
              >
                <PlayArrowIcon sx={{ color: '#fff', fontSize: { xs: 38, sm: 48 }, ml: 0.5 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                }}
              >
                CLICK TO PLAY
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  mt: 0.5,
                  fontSize: '0.8rem',
                  letterSpacing: 0.4,
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {channel.name} • {channel.quality || 'HD 1080p'}
              </Typography>
            </Box>
          )}

          {/* Stream Diagnostics HUD */}
          {showStats && (
            <Box
              sx={{
                position: 'absolute',
                top: 70,
                left: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(6, 182, 212, 0.4)',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#38bdf8',
                zIndex: 10,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff', display: 'block', mb: 0.5 }}>
                STREAM DIAGNOSTICS
              </Typography>
              <div>Resolution: {streamStats.resolution}</div>
              <div>Bitrate: {streamStats.bitrate ? `${streamStats.bitrate} kbps` : 'Adaptive'}</div>
              <div>Buffer Health: {streamStats.buffer}s ahead</div>
              <div>Duration: {isLiveStream ? 'LIVE (Infinite)' : formatTime(duration)}</div>
              <div>Current: {formatTime(currentTime)} {!isLiveStream && duration > 0 ? `(${Math.round((currentTime / duration) * 100)}%)` : ''}</div>
              <div>Buffered: {formatTime(buffered)}</div>
              <div>Protocol: HLS (m3u8) / {useProxy ? 'Proxy' : 'Direct'}</div>
              <div>Speed: {playbackSpeed}x</div>
            </Box>
          )}

          {/* Top Bar Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              p: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Channel Logo & Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {channel.logo_url && (
                <Box
                  component="img"
                  src={channel.logo_url}
                  alt={channel.name}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    p: 0.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', fontSize: { xs: '0.95rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
                  {channel.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                  {channel.category_name} • {channel.language}
                </Typography>
              </Box>
            </Box>

            {/* Badges & Quick Action Chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={autoPlay ? "Auto-Play is ON (Click to disable)" : "Auto-Play is OFF (Click to enable)"}>
                <Chip
                  label={autoPlay ? "AUTOPLAY ON" : "AUTOPLAY OFF"}
                  size="small"
                  onClick={toggleAutoPlay}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: autoPlay ? 'rgba(16, 185, 129, 0.22)' : 'rgba(100, 116, 139, 0.35)',
                    color: autoPlay ? '#34d399' : '#cbd5e1',
                    border: autoPlay ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(148, 163, 184, 0.3)',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: autoPlay ? 'rgba(16, 185, 129, 0.38)' : 'rgba(100, 116, 139, 0.5)',
                      transform: 'scale(1.04)',
                    },
                  }}
                />
              </Tooltip>
              {sleepTimerRemaining && (
                <Chip
                  icon={<BedtimeIcon style={{ color: '#facc15', fontSize: 16 }} />}
                  label={`Sleep: ${formatTimer(sleepTimerRemaining)}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(250, 204, 21, 0.2)', color: '#facc15', fontWeight: 700, fontSize: '0.72rem' }}
                />
              )}
              <Chip
                icon={<span className="live-dot" style={{ marginLeft: 6 }} />}
                label="ON AIR"
                size="small"
                sx={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
              <Tooltip title={isFavorite ? "Remove favorite" : "Add to favorites"}>
                <IconButton
                  size="small"
                  onClick={() => onToggleFavorite(channel.id)}
                  sx={{ color: isFavorite ? '#ef4444' : '#fff', backgroundColor: 'rgba(0,0,0,0.4)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' } }}
                >
                  {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Bottom Controls Bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: { xs: 1, sm: 1.5 },
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left Controls: Play/Pause, Volume */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
              <Tooltip title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
                <IconButton onClick={togglePlay} sx={{ color: '#fff', '&:hover': { color: '#06b6d4' } }}>
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                <IconButton onClick={toggleMute} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
                  {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Tooltip>

              <Slider
                value={isMuted ? 0 : volume}
                min={0}
                max={1}
                step={0.05}
                onChange={handleVolumeChange}
                sx={{
                  width: { xs: 50, sm: 80 },
                  color: '#06b6d4',
                  '& .MuiSlider-thumb': { width: 12, height: 12 },
                }}
              />

              {/* Current Time Display */}
              <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace', ml: 0.5, whiteSpace: 'nowrap' }}>
                {isLiveStream ? (
                  <>{formatTime(currentTime)} <span style={{ color: '#ef4444', fontWeight: 800 }}>● LIVE</span></>
                ) : (
                  <>{formatTime(currentTime)} / {formatTime(duration)}</>
                )}
              </Typography>
            </Box>

            {/* Center: Seek/Progress Bar (Movies Only) */}
            {!isLiveStream && duration > 0 && (
              <Box sx={{ flex: 1, mx: { xs: 1, sm: 2 }, position: 'relative' }}>
                {/* Buffered track (behind seek) */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    height: 4,
                    borderRadius: 2,
                    transform: 'translateY(-50%)',
                    width: `${(buffered / duration) * 100}%`,
                    backgroundColor: 'rgba(148, 163, 184, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <Slider
                  value={currentTime}
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  onMouseDown={() => setIsSeeking(true)}
                  onChange={(e, v) => {
                    setCurrentTime(v);
                  }}
                  onChangeCommitted={(e, v) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = v;
                    }
                    setIsSeeking(false);
                  }}
                  sx={{
                    color: '#06b6d4',
                    height: 4,
                    p: 0,
                    '& .MuiSlider-thumb': {
                      width: 14,
                      height: 14,
                      transition: 'none',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
                      },
                    },
                    '& .MuiSlider-track': {
                      transition: 'none',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    },
                  }}
                />
              </Box>
            )}

            {/* Right Controls: Quality, Audio, Mini-player, Theater, Fullscreen */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.8 } }}>
              {/* Direct Audio Track / Language Switcher Chip */}
              <Tooltip title={audioTracks.length > 0 ? `Switch Audio: ${audioTracks[currentAudioTrack]?.name || audioTracks[currentAudioTrack]?.lang || channel.language}` : `Audio: ${channel.language || 'Original Broadcast'}`}>
                <Chip
                  icon={<RecordVoiceOverIcon sx={{ fontSize: '13px !important', color: '#8b5cf6' }} />}
                  label={audioTracks.length > 0 ? (audioTracks[currentAudioTrack]?.name || audioTracks[currentAudioTrack]?.lang || channel.language) : (channel.language || 'Audio')}
                  size="small"
                  onClick={(e) => {
                    setSettingsAnchor(e.currentTarget);
                    setActiveSubMenu('audio');
                  }}
                  clickable
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#c4b5fd',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 92, 246, 0.3)',
                    },
                  }}
                />
              </Tooltip>

              {/* Settings / Quality / Audio Menu Trigger */}
              <Tooltip title="Playback & Quality Settings">
                <IconButton
                  onClick={(e) => {
                    setSettingsAnchor(e.currentTarget);
                    setActiveSubMenu('main');
                  }}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#06b6d4' } }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Floating Mini-player (In-App) */}
              <Tooltip title="Minimize to Corner (P)">
                <IconButton onClick={onToggleMinimize} sx={{ color: '#94a3b8', '&:hover': { color: '#06b6d4' } }}>
                  <PictureInPictureAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Theater Mode Toggle */}
              <Tooltip title={isTheaterMode ? "Exit Theater Mode (T)" : "Theater Mode (T)"}>
                <IconButton onClick={onToggleTheaterMode} sx={{ color: isTheaterMode ? '#06b6d4' : '#94a3b8', '&:hover': { color: '#06b6d4' } }}>
                  <AspectRatioIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Fullscreen Toggle */}
              <Tooltip title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}>
                <IconButton onClick={toggleFullscreen} sx={{ color: '#94a3b8', '&:hover': { color: '#fff' } }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Settings Popup Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: '#0f172a',
            color: '#fff',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: 240,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          },
        }}
      >
        {activeSubMenu === 'main' && (
          <Box>
            <MenuItem onClick={() => setActiveSubMenu('quality')}>
              <ListItemIcon><HighQualityIcon sx={{ color: '#06b6d4' }} /></ListItemIcon>
              <ListItemText primary="Quality" secondary={currentQuality === -1 ? 'Auto (Adaptive)' : `${qualityLevels[currentQuality]?.height}p`} />
            </MenuItem>

            <MenuItem onClick={() => setActiveSubMenu('audio')}>
              <ListItemIcon><RecordVoiceOverIcon sx={{ color: '#8b5cf6' }} /></ListItemIcon>
              <ListItemText
                primary="Audio Language"
                secondary={audioTracks.length > 0 ? (audioTracks[currentAudioTrack]?.name || audioTracks[currentAudioTrack]?.lang || 'Default') : 'Stereo Audio'}
              />
            </MenuItem>

            <MenuItem onClick={() => setActiveSubMenu('speed')}>
              <ListItemIcon><SpeedIcon sx={{ color: '#38bdf8' }} /></ListItemIcon>
              <ListItemText primary="Playback Speed" secondary={`${playbackSpeed}x`} />
            </MenuItem>

            <MenuItem onClick={() => setActiveSubMenu('sleep')}>
              <ListItemIcon><BedtimeIcon sx={{ color: '#facc15' }} /></ListItemIcon>
              <ListItemText primary="Sleep Timer" secondary={sleepTimerRemaining ? `${Math.ceil(sleepTimerRemaining / 60)} min remaining` : 'Off'} />
            </MenuItem>

            <MenuItem onClick={toggleAutoPlay}>
              <ListItemIcon><PlayArrowIcon sx={{ color: autoPlay ? '#34d399' : '#94a3b8' }} /></ListItemIcon>
              <ListItemText
                primary="Auto-Play"
                secondary={autoPlay ? 'Enabled (Auto starts)' : 'Disabled (Click to play)'}
              />
              <Chip
                label={autoPlay ? 'ON' : 'OFF'}
                size="small"
                sx={{
                  backgroundColor: autoPlay ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: autoPlay ? '#34d399' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            </MenuItem>

            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

            <MenuItem onClick={() => { setShowStats(!showStats); setSettingsAnchor(null); }}>
              <ListItemIcon><AssessmentIcon sx={{ color: '#a855f7' }} /></ListItemIcon>
              <ListItemText primary={showStats ? "Hide Stream Stats" : "Show Stream Stats"} />
            </MenuItem>
          </Box>
        )}

        {/* Quality Submenu */}
        {activeSubMenu === 'quality' && (
          <Box>
            <MenuItem onClick={() => setActiveSubMenu('main')} sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ← Back to Settings
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            <MenuItem onClick={() => changeQualityLevel(-1)}>
              <ListItemIcon>{currentQuality === -1 ? <CheckIcon sx={{ color: '#06b6d4' }} /> : null}</ListItemIcon>
              <ListItemText primary="Auto (Adaptive Bitrate)" />
            </MenuItem>
            {qualityLevels.length > 0 ? (
              qualityLevels.map((lvl, index) => (
                <MenuItem key={index} onClick={() => changeQualityLevel(index)}>
                  <ListItemIcon>{currentQuality === index ? <CheckIcon sx={{ color: '#06b6d4' }} /> : null}</ListItemIcon>
                  <ListItemText primary={`${lvl.height}p HD`} secondary={`${Math.round(lvl.bitrate / 1000)} kbps`} />
                </MenuItem>
              ))
            ) : (
              ['1080p Full HD', '720p HD', '576p SD', '480p SD', '360p Low'].map((res, i) => (
                <MenuItem key={i} onClick={() => setSettingsAnchor(null)}>
                  <ListItemText primary={res} secondary="Single Bitrate Stream" />
                </MenuItem>
              ))
            )}
          </Box>
        )}

        {/* Audio Tracks Submenu */}
        {activeSubMenu === 'audio' && (
          <Box>
            <MenuItem onClick={() => setActiveSubMenu('main')} sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ← Back to Settings
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            {audioTracks.length > 0 ? (
              audioTracks.map((tr, index) => (
                <MenuItem key={index} onClick={() => changeAudioTrack(index)}>
                  <ListItemIcon>{currentAudioTrack === index ? <CheckIcon sx={{ color: '#06b6d4' }} /> : null}</ListItemIcon>
                  <ListItemText primary={tr.name || tr.lang || `Track ${index + 1}`} secondary={`Lang: ${tr.lang || 'Stereo'}`} />
                </MenuItem>
              ))
            ) : (
              ['Tamil (Primary)', 'English', 'Hindi', 'Original Broadcast'].map((lang, idx) => (
                <MenuItem key={idx} onClick={() => setSettingsAnchor(null)}>
                  <ListItemIcon>{idx === 0 ? <CheckIcon sx={{ color: '#06b6d4' }} /> : null}</ListItemIcon>
                  <ListItemText primary={lang} />
                </MenuItem>
              ))
            )}
          </Box>
        )}

        {/* Speed Submenu */}
        {activeSubMenu === 'speed' && (
          <Box>
            <MenuItem onClick={() => setActiveSubMenu('main')} sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ← Back to Settings
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
              <MenuItem key={spd} onClick={() => changeSpeed(spd)}>
                <ListItemIcon>{playbackSpeed === spd ? <CheckIcon sx={{ color: '#06b6d4' }} /> : null}</ListItemIcon>
                <ListItemText primary={spd === 1 ? '1.0x (Normal)' : `${spd}x`} />
              </MenuItem>
            ))}
          </Box>
        )}

        {/* Sleep Timer Submenu */}
        {activeSubMenu === 'sleep' && (
          <Box>
            <MenuItem onClick={() => setActiveSubMenu('main')} sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ← Back to Settings
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            {[
              { label: 'Off', val: 0 },
              { label: '15 Minutes', val: 15 },
              { label: '30 Minutes', val: 30 },
              { label: '45 Minutes', val: 45 },
              { label: '1 Hour', val: 60 },
              { label: '2 Hours', val: 120 },
            ].map((t) => (
              <MenuItem key={t.val} onClick={() => setSleepTimer(t.val)}>
                <ListItemText primary={t.label} />
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </Box>
  );
}
