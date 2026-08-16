import { Router } from 'express';
import * as detectionController from '../controllers/detection.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeExpertPlus } from '../middleware/authorize.js';
import { uploadSingleImage, verifyMagicNumbers } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  predictSchema,
  rejectDiagnosisSchema,
  requestReapprovalSchema,
  updateDiagnosisSchema,
  verifyDiagnosisSchema,
} from '../validators/detection.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/analyze',
  uploadSingleImage,
  verifyMagicNumbers,
  detectionController.analyze
);
router.post('/predict', validate({ body: predictSchema }), detectionController.predict);
router.get('/history', detectionController.history);
router.get('/review', authorizeExpertPlus, detectionController.reviewList);
router.get('/:id', detectionController.getOne);
router.delete('/:id', detectionController.remove);
router.put(
  '/:id',
  authorizeExpertPlus,
  validate({ body: updateDiagnosisSchema }),
  detectionController.update
);
router.post(
  '/:id/verify',
  authorizeExpertPlus,
  validate({ body: verifyDiagnosisSchema }),
  detectionController.verify
);
router.post(
  '/:id/reject',
  authorizeExpertPlus,
  validate({ body: rejectDiagnosisSchema }),
  detectionController.reject
);
router.post(
  '/:id/request-reapproval',
  validate({ body: requestReapprovalSchema }),
  detectionController.requestReapproval
);
router.post('/:id/request-review', detectionController.requestExpertReview);

export default router;
