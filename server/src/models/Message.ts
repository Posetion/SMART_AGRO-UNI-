import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const attachmentSchema = new Schema(
  {
    kind: { type: String, enum: ['image', 'link', 'file'], required: true },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    name: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '', trim: true, maxlength: 2000 },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    forwardedFrom: {
      senderName: { type: String, default: '', trim: true, maxlength: 80 },
    },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedForEveryone: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Message = mongoose.model('Message', messageSchema);
