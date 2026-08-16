import { Router } from 'express';
import * as heatmapController from '../controllers/heatmap.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { heatmapFilterSchema } from '../validators/heatmap.schema.js';

const router = Router();

router.get('/data', heatmapController.data);
router.get('/township', heatmapController.township);
router.post('/filter', validate({ body: heatmapFilterSchema }), heatmapController.filter);
router.get('/statistics', authenticate, authorize('admin'), heatmapController.statistics);

export default router;
