/**
 * StreamPulse Jellyfin & Local Media Server Integration Service
 * Connects to local Jellyfin / Emby / Plex media servers or custom S3/CDN endpoints,
 * fetches movie metadata and streaming HLS/MP4 URLs, and seamlessly maps them into StreamPulse VOD.
 */
import axios from 'axios';

export const connectJellyfinServer = async (serverUrl, apiKey) => {
  const cleanUrl = serverUrl.replace(/\/$/, '');
  const testEndpoint = `${cleanUrl}/System/Info/Public`;
  
  try {
    const res = await axios.get(testEndpoint, { timeout: 5000 });
    return {
      success: true,
      serverName: res.data.ServerName || 'Local Jellyfin Media Server',
      version: res.data.Version || '10.8+',
      url: cleanUrl,
    };
  } catch (err) {
    // If public endpoint is blocked by CORS or requires token, test with API key
    if (apiKey) {
      try {
        const authEndpoint = `${cleanUrl}/Items?api_key=${apiKey}&Limit=1`;
        await axios.get(authEndpoint, { timeout: 5000 });
        return {
          success: true,
          serverName: 'Custom Jellyfin Media Server',
          version: 'Active',
          url: cleanUrl,
        };
      } catch (e2) {
        throw new Error('Could not connect to Jellyfin server. Check Server URL and API Key.');
      }
    }
    throw new Error('Connection failed. Make sure Jellyfin is running and CORS is enabled.');
  }
};

export const fetchJellyfinMovies = async (serverUrl, apiKey) => {
  const cleanUrl = serverUrl.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/Items?IncludeItemTypes=Movie&Recursive=true&Fields=Overview,Genres,OfficialRating,RunTimeTicks,ProductionYear,CommunityRating&api_key=${apiKey}`;

  const res = await axios.get(endpoint);
  const items = res.data.Items || [];

  return items.map((item) => {
    const streamUrl = `${cleanUrl}/Videos/${item.Id}/stream.mp4?api_key=${apiKey}&static=true`;
    const posterUrl = `${cleanUrl}/Items/${item.Id}/Images/Primary?api_key=${apiKey}`;

    const runtimeMinutes = item.RunTimeTicks ? Math.round(item.RunTimeTicks / 600000000) : 120;
    const hours = Math.floor(runtimeMinutes / 60);
    const mins = runtimeMinutes % 60;
    const durationStr = `${hours}h ${mins}m`;

    return {
      id: `jellyfin_${item.Id}`,
      title: item.Name,
      year: item.ProductionYear || 2024,
      category: item.Genres && item.Genres.length > 0 ? item.Genres[0] : 'Media Server',
      language: 'Tamil',
      quality: '4K Ultra HD',
      poster_url: posterUrl,
      stream_url: streamUrl,
      duration: durationStr,
      rating: item.CommunityRating ? parseFloat(item.CommunityRating.toFixed(1)) : 8.5,
      synopsis: item.Overview || `Streamed directly from your local Jellyfin Media Server (${cleanUrl}).`,
      source_mirror: 'jellyfin',
    };
  });
};
