import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const townshipBoundarySchema = new Schema(
  {
    name: { type: String, required: true },
    region: { type: String, required: true },
    geometry: {
      type: { type: String, enum: ['Polygon'], required: true },
      coordinates: { type: [[[Number]]], required: true },
    },
    riskLevel: { type: String, default: 'Low' },
    outbreakCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

townshipBoundarySchema.index({ geometry: '2dsphere' });
townshipBoundarySchema.index({ name: 1, region: 1 }, { unique: true });

export type TownshipBoundaryDocument = InferSchemaType<typeof townshipBoundarySchema> & {
  _id: mongoose.Types.ObjectId;
};
export const TownshipBoundary = mongoose.model('TownshipBoundary', townshipBoundarySchema);
