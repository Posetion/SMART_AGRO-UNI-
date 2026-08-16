import { Router } from 'express';
import authRoutes from './auth.routes.js';
import socialRoutes from './social.routes.js';
import detectionRoutes from './detection.routes.js';
import knowledgeRoutes from './knowledge.routes.js';
import weatherRoutes from './weather.routes.js';
import heatmapRoutes from './heatmap.routes.js';
import chatbotRoutes from './chatbot.routes.js';
import adminRoutes from './admin.routes.js';
import messagingRoutes from './messaging.routes.js';
import { getFile } from '../controllers/files.controller.js';
import { fileRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'smart-agro-api' } });
});

router.use('/auth', authRoutes);
router.use('/social', socialRoutes);
router.use('/detections', detectionRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/weather', weatherRoutes);
router.use('/heatmap', heatmapRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/messages', messagingRoutes);
router.use('/admin', adminRoutes);
router.get('/files/:id', fileRateLimiter, getFile);

export default router;
