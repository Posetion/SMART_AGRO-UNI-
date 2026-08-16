import { Router } from 'express';
import * as knowledgeController from '../controllers/knowledge.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validate } from '../middleware/validate.js';
import {
  uploadKnowledgeFile,
  uploadSingleImage,
  verifyKnowledgeFile,
  verifyMagicNumbers,
} from '../middleware/upload.js';
import {
  createKnowledgeSchema,
  searchQuerySchema,
  updateKnowledgeSchema,
} from '../validators/knowledge.schema.js';

const router = Router();

router.get('/articles', optionalAuth, knowledgeController.list);
router.get('/articles/:id', optionalAuth, knowledgeController.getOne);
router.get('/categories', knowledgeController.categories);
router.get('/search', validate({ query: searchQuerySchema }), knowledgeController.search);

router.post(
  '/upload',
  authenticate,
  authorize('admin'),
  uploadKnowledgeFile,
  verifyKnowledgeFile,
  knowledgeController.uploadFile
);

router.post(
  '/upload-cover',
  authenticate,
  authorize('admin'),
  uploadSingleImage,
  verifyMagicNumbers,
  knowledgeController.uploadCover
);

router.post(
  '/articles',
  authenticate,
  authorize('admin'),
  validate({ body: createKnowledgeSchema }),
  knowledgeController.create
);
router.put(
  '/articles/:id',
  authenticate,
  authorize('admin'),
  validate({ body: updateKnowledgeSchema }),
  knowledgeController.update
);
router.delete('/articles/:id', authenticate, authorize('admin'), knowledgeController.remove);

export default router;
