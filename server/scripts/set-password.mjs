import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const email = (process.argv[2] || '').trim().toLowerCase();
const password = process.argv[3] || '';

if (!email || password.length < 8) {
  console.error('Usage: node scripts/set-password.mjs <email> <password-min-8>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}

await mongoose.connect(uri);
const users = mongoose.connection.collection('users');
const passwordHash = await bcrypt.hash(password, 12);
const result = await users.updateOne(
  { email },
  { $set: { passwordHash, isVerified: true, isActive: true, updatedAt: new Date() } }
);

if (result.matchedCount === 0) {
  console.error('User not found:', email);
  process.exit(1);
}

console.log('Password set for', email);
await mongoose.disconnect();
