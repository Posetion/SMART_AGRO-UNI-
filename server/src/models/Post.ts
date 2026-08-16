import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const replySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    replies: [replySchema],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnosis' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    isActive: { type: Boolean, default: true },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    moderationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema> & { _id: mongoose.Types.ObjectId };
export const Post = mongoose.model('Post', postSchema);
