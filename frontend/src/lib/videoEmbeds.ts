function normalizeYouTubeEmbedUrl(parsed: URL): string | null {
  const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (hostname === 'youtu.be') {
    const videoId = parsed.pathname.split('/').filter(Boolean)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (!hostname.endsWith('youtube.com') && hostname !== 'youtube-nocookie.com') {
    return null;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);

  if (segments[0] === 'embed' && segments[1]) {
    return `https://www.youtube.com/embed/${segments[1]}`;
  }

  if (segments[0] === 'shorts' && segments[1]) {
    return `https://www.youtube.com/embed/${segments[1]}`;
  }

  const videoId = parsed.searchParams.get('v');
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function normalizeVimeoEmbedUrl(parsed: URL): string | null {
  const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (!hostname.endsWith('vimeo.com')) {
    return null;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === 'video' && segments[1]) {
    return `https://player.vimeo.com/video/${segments[1]}`;
  }

  const videoId = segments[segments.length - 1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
}

export function normalizeVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    return normalizeYouTubeEmbedUrl(parsed) ?? normalizeVimeoEmbedUrl(parsed);
  } catch {
    return null;
  }
}
