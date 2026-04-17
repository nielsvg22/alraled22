import { Router } from 'express';
import { searchLocations } from '../controllers/geoController';

const router = Router();

router.get('/search', searchLocations);

export default router;

