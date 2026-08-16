import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
  {
    sender: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    audioUrl: { type: String, default: '' },
    imageUrls: { type: [String], default: [] },
    attachments: {
      type: [
        {
          url: { type: String, default: '' },
          name: { type: String, default: '' },
          mimeType: { type: String, default: '' },
        },
      ],
      default: [],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatbotSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    messages: [messageSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatbotSessionSchema.index({ userId: 1, updatedAt: -1 });

export type ChatbotSessionDocument = InferSchemaType<typeof chatbotSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const ChatbotSession = mongoose.model('ChatbotSession', chatbotSessionSchema);
