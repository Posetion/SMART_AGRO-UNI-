import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, createdAt: -1 });

export type OtpDocument = InferSchemaType<typeof otpSchema> & { _id: mongoose.Types.ObjectId };
export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
