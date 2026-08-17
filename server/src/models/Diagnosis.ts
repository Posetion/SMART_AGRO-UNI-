import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { CROP_TYPES, RISK_LEVELS } from '../config/constants.js';

const diagnosisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, required: true },
    cropType: { type: String, enum: CROP_TYPES, required: true },
    disease: { type: String, required: true },
    severityIndex: { type: Number, min: 0, max: 100, default: 0 },
    probabilities: [
      {
        disease: String,
        probability: Number,
      },
    ],
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    weatherConditions: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      windSpeed: Number,
    },
    prediction: {
      riskLevel: { type: String, enum: RISK_LEVELS },
      forecastDays: Number,
      confidence: Number,
    },
    treatmentProtocol: { type: String, default: '' },
    /** Original AI disease/pest label (kept when an expert corrects it). */
    aiDetectedDisease: { type: String, default: '' },
    /** Expert corrected the AI disease/pest label on verify. */
    diseaseCorrected: { type: Boolean, default: false },
    /** Free-text expert advice (field tips, IPM notes). */
    expertSuggestion: { type: String, default: '' },
    /** Books / guides the expert recommends. */
    expertBooks: { type: String, default: '' },
    /** Drug / chemical types the expert recommends. */
    expertDrugs: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    /** Farmer opted in for expert/admin review */
    reviewRequested: { type: Boolean, default: false, index: true },
    reviewRequestedAt: { type: Date },
    isRejected: { type: Boolean, default: false, index: true },
    rejectionReason: { type: String, default: '' },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    reapprovalNote: { type: String, default: '' },
    reapprovalRequestedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

diagnosisSchema.index({ location: '2dsphere' });
diagnosisSchema.index({ userId: 1, createdAt: -1 });
diagnosisSchema.index({ disease: 1, createdAt: -1 });

export type DiagnosisDocument = InferSchemaType<typeof diagnosisSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Diagnosis = mongoose.models.Diagnosis || mongoose.model('Diagnosis', diagnosisSchema);
