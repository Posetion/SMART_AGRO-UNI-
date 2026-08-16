import { Router } from 'express';
import {
  changePasswordHandler,
  guestLoginHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshTokenHandler,
  registerHandler,
  updateMeHandler,
  uploadAvatarHandler,
  uploadCoverHandler,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { otpRateLimiter, guestRateLimiter } from '../middleware/rateLimit.js';
import { uploadSingleImage, verifyMagicNumbers } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  updateMeSchema,
} from '../validators/auth.schema.js';

const router = Router();

router.post('/register', otpRateLimiter, validate({ body: registerSchema }), registerHandler);
router.post('/login', otpRateLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/guest', guestRateLimiter, guestLoginHandler);
router.post('/refresh-token', validate({ body: refreshTokenSchema }), refreshTokenHandler);
router.post('/logout', authenticate, validate({ body: logoutSchema }), logoutHandler);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  changePasswordHandler
);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validate({ body: updateMeSchema }), updateMeHandler);
router.post(
  '/me/avatar',
  authenticate,
  uploadSingleImage,
  verifyMagicNumbers,
  uploadAvatarHandler
);
router.post(
  '/me/cover',
  authenticate,
  uploadSingleImage,
  verifyMagicNumbers,
  uploadCoverHandler
);

export default router;
