import { Router } from 'express';
import * as socialController from '../controllers/social.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadImages, verifyMagicNumbers } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  commentSchema,
  createPostSchema,
  moderateSchema,
  reportPostSchema,
  reviewReportSchema,
  updatePostSchema,
} from '../validators/social.schema.js';

const router = Router();

router.use(authenticate);

router.get('/users/:id', socialController.publicProfile);

router.post(
  '/posts',
  uploadImages,
  verifyMagicNumbers,
  validate({ body: createPostSchema }),
  socialController.create
);
router.get('/posts', socialController.list);
router.get('/posts/:id', socialController.getOne);
router.put('/posts/:id', validate({ body: updatePostSchema }), socialController.update);
router.delete('/posts/:id', socialController.remove);
router.post(
  '/posts/:id/comments',
  validate({ body: commentSchema }),
  socialController.comment
);
router.post(
  '/posts/:id/comments/:commentId/replies',
  validate({ body: commentSchema }),
  socialController.reply
);
router.post('/posts/:id/like', socialController.like);
router.post(
  '/posts/:id/report',
  validate({ body: reportPostSchema }),
  socialController.report
);
router.get('/reports', authorize('admin'), socialController.listReports);
router.post(
  '/reports/:id/review',
  authorize('admin'),
  validate({ body: reviewReportSchema }),
  socialController.reviewReport
);
router.post(
  '/posts/:id/moderate',
  authorize('admin'),
  validate({ body: moderateSchema }),
  socialController.moderate
);

export default router;
