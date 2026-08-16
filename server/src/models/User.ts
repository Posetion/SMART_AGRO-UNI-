import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { ROLES } from '../config/constants.js';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '', select: false },
    phoneNumber: { type: String, default: '' },
    fullName: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'farmer' },
    location: {
      township: { type: String, default: '' },
      region: { type: String, default: '' },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    bio: { type: String, default: '' },
    crops: [{ type: String }],
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    avatarTone: {
      type: String,
      enum: ['mint', 'sky', 'coral', 'amber', 'peach', 'teal'],
      default: 'mint',
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isGuest: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

userSchema.index({ 'location.coordinates': '2dsphere' });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const User = mongoose.model('User', userSchema);
