// Video's bij producten: YouTube, Vimeo, een los videobestand (mp4/webm/mov of een upload) of anders een gewone link.
export function videoInfo(url) {
  const u = String(url || '').trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (m) return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { type: 'vimeo', src: `https://player.vimeo.com/video/${m[1]}` };
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) || u.startsWith('/uploads/')) return { type: 'file', src: u };
  return { type: 'link', src: u };
}

// Lijst video's van een product: nieuw veld `videos` (JSON), met terugval op de oude losse `videoUrl`
export function parseVideos(product) {
  let list = [];
  try {
    const raw = product && product.videos;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) list = parsed.filter((v) => v && String(v.url || '').trim());
  } catch (e) { /* ongeldige JSON: negeren */ }
  if (list.length === 0 && product && product.videoUrl) list = [{ url: product.videoUrl, title: '' }];
  return list.map((v) => ({ url: String(v.url).trim(), title: String(v.title || '').trim() }));
}
