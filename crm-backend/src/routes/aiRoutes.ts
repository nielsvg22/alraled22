import { Router } from 'express';
import { generateProductDescription, generatePageText, chat, generateWebsiteBlock, generateNewBlock, storefrontChat, testEmail } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public
router.post('/storefront-chat', storefrontChat);

// Protected
router.use(authMiddleware);
router.post('/product-description', generateProductDescription);
router.post('/page-text',           generatePageText);
router.post('/chat',                chat);
router.post('/website-block',       generateWebsiteBlock);
router.post('/new-block',           generateNewBlock);
router.post('/test-email',          testEmail);

export default router;
