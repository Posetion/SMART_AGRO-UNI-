import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const conversationSchema = new Schema(
  {
    type: { type: String, enum: ['direct', 'group'], default: 'direct', index: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    visibility: { type: String, enum: ['private', 'public'], default: 'private', index: true },
    inviteCode: { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
    hiddenFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1, lastMessageAt: -1 });
conversationSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

export type ConversationDocument = InferSchemaType<typeof conversationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
