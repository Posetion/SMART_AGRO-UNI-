import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'new_message',
  'post_removed',
  'post_hidden',
  'post_restored',
  'post_reported',
  'friend_request',
  'friend_accepted',
  'diagnosis_verified',
  'diagnosis_rejected',
  'diagnosis_review_requested',
  'reapproval_requested',
  'system',
] as const;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
