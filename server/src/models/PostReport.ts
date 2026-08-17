import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const REPORT_STATUSES = ['pending', 'approved', 'denied'] as const;

const postReportSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNote: { type: String, default: '' },
    postSnapshot: {
      content: { type: String, default: '' },
      authorId: { type: Schema.Types.ObjectId, ref: 'User' },
      authorName: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

postReportSchema.index({ postId: 1, reporterId: 1 }, { unique: true });
postReportSchema.index({ status: 1, createdAt: -1 });

export type PostReportDocument = InferSchemaType<typeof postReportSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const PostReport = mongoose.models.PostReport || mongoose.model('PostReport', postReportSchema);
