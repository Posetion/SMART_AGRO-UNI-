import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const diseaseLocationSchema = new Schema(
  {
    diagnosticId: { type: Schema.Types.ObjectId, ref: 'Diagnosis', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    township: { type: String, default: '', index: true },
    disease: { type: String, required: true, index: true },
    severity: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

diseaseLocationSchema.index({ location: '2dsphere' });
diseaseLocationSchema.index({ disease: 1, timestamp: -1 });

export type DiseaseLocationDocument = InferSchemaType<typeof diseaseLocationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const DiseaseLocation = mongoose.model('DiseaseLocation', diseaseLocationSchema);
