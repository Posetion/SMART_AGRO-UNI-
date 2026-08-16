import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadChatAttachments, verifyChatAttachments } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '../validators/chatbot.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/message',
  uploadChatAttachments,
  verifyChatAttachments,
  validate({ body: chatMessageSchema }),
  chatbotController.message
);
router.get('/history', chatbotController.history);
router.delete('/history', chatbotController.clearHistory);
router.post('/session', chatbotController.createSession);
router.get('/session/:id', chatbotController.getSession);
router.delete('/session/:id', chatbotController.deleteSession);

export default router;
