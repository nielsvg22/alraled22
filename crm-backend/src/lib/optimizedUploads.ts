import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Grote foto's in /uploads (bv. banners van 2+ MB) worden bij het eerste verzoek verkleind
// naar max 1920px en in een cache naast de uploads bewaard. De URL en bestandsnaam blijven
// gelijk; het origineel blijft ongemoeid. Kleine bestanden (logo's) en fouten vallen door
// naar de gewone static-handler.
const MIN_BYTES = 400 * 1024;
const MAX_WIDTH = 1920;
const inFlight = new Map<string, Promise<string | null>>();

async function optimize(source: string, cacheDir: string, name: string): Promise<string | null> {
  const cachedJpg = path.join(cacheDir, `${name}.jpg`);
  const cachedPng = path.join(cacheDir, `${name}.png`);
  const skipMarker = path.join(cacheDir, `${name}.skip`);
  if (fs.existsSync(cachedJpg)) return cachedJpg;
  if (fs.existsSync(cachedPng)) return cachedPng;
  if (fs.existsSync(skipMarker)) return null;

  const image = sharp(source).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const { hasAlpha } = await sharp(source).metadata();
  const target = hasAlpha ? cachedPng : cachedJpg;
  const tmp = `${target}.tmp`;
  await (hasAlpha ? image.png({ compressionLevel: 9, palette: true }) : image.jpeg({ quality: 80, mozjpeg: true })).toFile(tmp);

  if (fs.statSync(tmp).size >= fs.statSync(source).size) {
    fs.rmSync(tmp);
    fs.writeFileSync(skipMarker, '');
    return null;
  }
  fs.renameSync(tmp, target);
  return target;
}

export function optimizedUploads(uploadsDir: string) {
  const cacheDir = path.join(uploadsDir, '.optimized');
  fs.mkdirSync(cacheDir, { recursive: true });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== 'GET' || !/\.(png|jpe?g)$/i.test(req.path)) return next();
      const name = decodeURIComponent(req.path.replace(/^\//, ''));
      if (!name || name !== path.basename(name)) return next();

      const source = path.join(uploadsDir, name);
      if (!fs.existsSync(source) || fs.statSync(source).size < MIN_BYTES) return next();

      let job = inFlight.get(name);
      if (!job) {
        job = optimize(source, cacheDir, name).finally(() => inFlight.delete(name));
        inFlight.set(name, job);
      }
      const result = await job;
      if (!result) return next();

      res.type(path.extname(result)).set('Cache-Control', 'public, max-age=604800').sendFile(result, { dotfiles: 'allow' });
    } catch (err) {
      console.warn('[server] Upload optimaliseren mislukt, origineel wordt geserveerd:', err);
      next();
    }
  };
}
