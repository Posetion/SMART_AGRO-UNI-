import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { KNOWLEDGE_CATEGORIES } from '../config/constants.js';

const knowledgeSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: KNOWLEDGE_CATEGORIES, required: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    author: { type: String, default: '' },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
    versionHistory: [
      {
        version: Number,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        changeNote: String,
      },
    ],
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

knowledgeSchema.index({ title: 'text', description: 'text', tags: 'text' });
knowledgeSchema.index({ category: 1, isPublished: 1 });

export type KnowledgeDocument = InferSchemaType<typeof knowledgeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
