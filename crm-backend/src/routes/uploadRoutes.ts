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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

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
