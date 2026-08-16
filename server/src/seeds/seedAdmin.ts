import { User } from '../models/User.js';

export async function seedAdmin(email = 'admin@smartagro.local') {
  const user = await User.findOneAndUpdate(
    { email },
    {
      email,
      fullName: 'System Admin',
      role: 'admin',
      isVerified: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );
  return user;
}

export async function seedExpert(email = 'expert@smartagro.local') {
  return User.findOneAndUpdate(
    { email },
    {
      email,
      fullName: 'Field Expert',
      role: 'expert',
      isVerified: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );
}
