import { Router } from 'express';
import * as ctrl from '../controllers/messaging.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeExpertPlus } from '../middleware/authorize.js';
import {
  uploadChatFile,
  uploadSingleImage,
  verifyChatFile,
  verifyMagicNumbers,
} from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const openSchema = z.object({
  userId: z.string().min(1),
});

const attachmentUrl = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (v) => v.startsWith('/api/v1/files/') || z.string().url().safeParse(v).success,
    { message: 'Use a full link (https://...) or an uploaded file path' }
  );

const sendSchema = z
  .object({
    text: z.string().trim().max(2000).optional().default(''),
    attachments: z
      .array(
        z.object({
          kind: z.enum(['image', 'link', 'file']),
          url: attachmentUrl,
          name: z.string().trim().max(200).optional(),
        })
      )
      .max(8)
      .optional()
      .default([]),
    replyTo: z.string().min(1).optional(),
    forwardedFrom: z
      .object({
        senderName: z.string().trim().max(80).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.text?.trim()) || (data.attachments?.length ?? 0) > 0, {
    message: 'Message cannot be empty',
  });

const typingSchema = z.object({
  typing: z.boolean(),
});

const groupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  memberIds: z.array(z.string().min(1)).max(40).default([]),
  visibility: z.enum(['private', 'public']).optional(),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(40),
});

const groupSettingsSchema = z.object({
  visibility: z.enum(['private', 'public']),
});

const friendSchema = z.object({
  userId: z.string().min(1),
});

const friendRespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

router.get('/users', ctrl.searchUsers);

router.get('/friends', ctrl.listFriends);
router.get('/friends/requests', ctrl.listFriendRequests);
router.get('/friends/status', ctrl.friendshipStatus);
router.post('/friends/request', validate({ body: friendSchema }), ctrl.sendFriendRequest);
router.post('/friends/requests/:id', validate({ body: friendRespondSchema }), ctrl.respondFriendRequest);

router.get('/invite/:code', ctrl.previewInvite);
router.post('/invite/:code/join', ctrl.joinInvite);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', validate({ body: openSchema }), ctrl.openConversation);
router.post('/conversations/group', validate({ body: groupSchema }), ctrl.createGroup);
router.get('/conversations/:id', ctrl.getConversation);
router.patch('/conversations/:id', validate({ body: groupSettingsSchema }), ctrl.updateGroupSettings);
router.post('/conversations/:id/invite/regenerate', ctrl.regenerateInvite);
router.post('/conversations/:id/members', validate({ body: addMembersSchema }), ctrl.addGroupMembers);
router.post('/conversations/:id/leave', ctrl.leaveGroup);
router.post('/conversations/:id/hide', ctrl.hideConversation);
router.post('/conversations/:id/mute', validate({ body: z.object({ muted: z.boolean() }) }), ctrl.muteConversation);
router.delete('/conversations/:id/messages', ctrl.clearMessages);
router.get('/conversations/:id/messages', ctrl.listMessages);
router.post('/conversations/:id/messages', validate({ body: sendSchema }), ctrl.sendMessage);
router.delete('/conversations/:id/messages/:messageId', ctrl.deleteMessage);
router.post(
  '/forward',
  validate({
    body: z.object({
      messageId: z.string().min(1),
      conversationIds: z.array(z.string().min(1)).min(1).max(20),
    }),
  }),
  ctrl.forwardMessage
);
router.post(
  '/conversations/:id/upload',
  uploadSingleImage,
  verifyMagicNumbers,
  ctrl.uploadMessageImage
);
router.post(
  '/conversations/:id/upload-file',
  uploadChatFile,
  verifyChatFile,
  ctrl.uploadMessageFile
);
router.get('/conversations/:id/typing', ctrl.getTyping);
router.post('/conversations/:id/typing', validate({ body: typingSchema }), ctrl.updateTyping);

const appealSchema = z.object({
  message: z.string().trim().min(3).max(500),
});

router.get('/notifications', ctrl.listNotifications);
router.get('/notifications/unread-count', ctrl.unreadNotifications);
router.post('/notifications/:id/read', ctrl.markNotificationRead);
router.post('/notifications/read-all', ctrl.markAllNotificationsRead);
router.post(
  '/notifications/:id/appeal',
  validate({ body: appealSchema }),
  ctrl.appealNotification
);
router.post(
  '/notifications/:id/reply',
  authorizeExpertPlus,
  validate({ body: appealSchema }),
  ctrl.replyToAppeal
);

export default router;
