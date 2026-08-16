import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const friendshipSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

friendshipSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export type FriendshipDocument = InferSchemaType<typeof friendshipSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Friendship = mongoose.model('Friendship', friendshipSchema);
