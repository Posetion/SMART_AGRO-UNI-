import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const townshipSchema = new Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String, required: true, unique: true },
    nameMy: { type: String, default: '' },
    region: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: false }
);

townshipSchema.index({ coordinates: '2dsphere' });

export type TownshipDocument = InferSchemaType<typeof townshipSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Township = mongoose.model('Township', townshipSchema);
