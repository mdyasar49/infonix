import { parseM3uPlaylist } from './m3uParser';

/**
 * StreamPulse Preset Playlist & Auto-Import Service
 */
export const PRESET_SOURCES = [
  {
    id: 'jiotv_local',
    name: '📱 JioTV Local Server (Proxy)',
    description: 'Auto-detects JioTV running on http://localhost:5000/playlist.m3u',
    url: 'http://localhost:5000/playlist.m3u',
    type: 'live',
  },
  {
    id: 'public_movies',
    name: '🎬 Free Cinema & Movies Collection',
    description: 'Public domain movies and trailers in 1080p FHD HLS',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u',
    type: 'vod',
  },
  {
    id: 'free_iptv_india',
    name: '📺 India Live Channels M3U',
    description: 'Free public news & entertainment streams (Tamil, Hindi, English)',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    type: 'live',
  },
];

/**
 * Auto-detect and fetch M3U playlist from a URL
 */
export const fetchM3uFromUrl = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    return parseM3uPlaylist(text);
  } catch (err) {
    console.warn(`Failed to fetch M3U from ${url}:`, err);
    throw new Error(`Could not load playlist from ${url}. Ensure server is active.`);
  }
};
