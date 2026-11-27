import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

// Video's bij producten: mp4, webm of mov, tot 200 MB
const videoUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Alleen mp4-, webm- of mov-video\'s zijn toegestaan'));
  },
});

const router = Router();

router.post('/video', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  videoUpload.single('video')(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'De video is te groot (maximaal 200 MB)' : (err.message || 'Uploaden mislukt') });
    if (!req.file) return res.status(400).json({ error: 'Geen bestand geüpload' });
    // Relatief adres: werkt op elk domein van de site (de webshop schrijft /uploads/ om naar de huidige API)
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/', authMiddleware, adminMiddleware, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return absolute URL so frontend doesn't have to guess the host
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${req.file.filename}`;
  
  res.json({ url });
});

export default router;
