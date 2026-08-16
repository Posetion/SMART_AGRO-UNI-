import 'dotenv/config';
import mongoose from 'mongoose';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/promote-admin.mjs <email>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}

await mongoose.connect(uri);
const users = mongoose.connection.collection('users');

const before = await users.findOne({ email });
console.log('before:', before ? { email: before.email, role: before.role, _id: String(before._id) } : null);

if (!before) {
  const now = new Date();
  const result = await users.insertOne({
    email,
    fullName: '',
    phoneNumber: '',
    role: 'admin',
    location: {
      township: '',
      region: '',
      coordinates: { type: 'Point', coordinates: [0, 0] },
    },
    bio: '',
    crops: [],
    avatarUrl: '',
    coverUrl: '',
    avatarTone: 'mint',
    isVerified: true,
    isActive: true,
    isGuest: false,
    createdAt: now,
    updatedAt: now,
  });
  console.log('created admin:', { email, role: 'admin', _id: String(result.insertedId) });
} else {
  await users.updateOne(
    { email },
    { $set: { role: 'admin', isVerified: true, isActive: true, updatedAt: new Date() } }
  );
  const after = await users.findOne({ email });
  console.log('after:', { email: after.email, role: after.role, _id: String(after._id) });
}

await mongoose.disconnect();
