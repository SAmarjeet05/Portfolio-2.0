import type { VercelRequest, VercelResponse } from '@vercel/node';

const {
  LASTFM_API_KEY = '',
  LASTFM_USERNAME = '',
} = process.env;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Last.fm credentials are configured
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    return res.status(200).json({ isPlaying: false });
  }

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    );

    if (!response.ok) {
      return res.status(200).json({ isPlaying: false });
    }

    const data = await response.json();

    if (!data.recenttracks || !data.recenttracks.track) {
      return res.status(200).json({ isPlaying: false });
    }

    const track = data.recenttracks.track[0];
    const isPlaying = track['@attr']?.nowplaying === 'true';

    // Cache for 30 seconds
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    return res.status(200).json({
      isPlaying,
      title: track.name || 'Unknown Track',
      artist: typeof track.artist === 'string' ? track.artist : track.artist?.['#text'] || 'Unknown Artist',
      album: typeof track.album === 'string' ? track.album : track.album?.['#text'] || 'Unknown Album',
      albumImageUrl: track.image?.[3]?.['#text'] || track.image?.[2]?.['#text'] || '',
      songUrl: track.url || '',
    });
  } catch (error) {
    console.error('Last.fm API error:', error);
    return res.status(200).json({ isPlaying: false });
  }
}
