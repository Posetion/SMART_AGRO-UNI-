import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resourceType: { type: String, default: '' },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
