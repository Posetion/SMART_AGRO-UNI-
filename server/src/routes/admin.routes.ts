import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.users);
router.put(
  '/users/:id',
  validate({ body: z.object({ role: z.enum(['farmer', 'expert', 'admin']) }) }),
  adminController.updateUser
);
router.put(
  '/users/:id/password',
  validate({
    body: z.object({
      password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    }),
  }),
  adminController.setUserPassword
);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard', adminController.dashboard);
router.get('/audit-logs', adminController.auditLogs);
router.post('/backup', adminController.backup);

export default router;
