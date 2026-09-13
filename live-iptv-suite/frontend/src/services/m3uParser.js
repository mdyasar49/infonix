/**
 * StreamPulse M3U / M3U8 VOD Playlist Parser
 * Parses M3U playlist files or URLs, extracts movie titles, logos, categories, and direct stream URLs.
 */
export const parseM3uPlaylist = (text) => {
  const lines = text.split('\n');
  const items = [];
  let currentItem = {};

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const titleMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      currentItem = {
        title: titleMatch ? titleMatch[1].trim() : 'Imported Movie',
        poster_url: logoMatch ? logoMatch[1] : null,
        category: groupMatch ? groupMatch[1] : 'Imported VOD',
        year: 2024,
        quality: '1080p FHD',
        language: 'Tamil',
        duration: '2h 10m',
        rating: 8.5,
        synopsis: 'Imported via M3U VOD Playlist. Direct native video stream.',
      };
    } else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/')) {
      if (currentItem.title) {
        currentItem.id = `m3u_${Date.now()}_${items.length}`;
        currentItem.stream_url = line;
        items.push(currentItem);
        currentItem = {};
      }
    }
  });

  return items;
};
