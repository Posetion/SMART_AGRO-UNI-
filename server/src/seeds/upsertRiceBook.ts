import { connectDb, disconnectDb } from '../config/db.js';
import { Knowledge } from '../models/Knowledge.js';
import { User } from '../models/User.js';
import { ITEMS } from './seedKnowledge.js';

async function main() {
  await connectDb();
  const admin =
    (await User.findOne({ role: 'admin' })) ||
    (await User.findOne({ email: 'admin@smartagro.local' }));
  if (!admin) {
    throw new Error('No admin user found. Start the API once or run npm run seed first.');
  }

  const books = ITEMS.filter((item) => item.fileUrl?.startsWith('/knowledge/'));
  let created = 0;
  let updated = 0;

  for (const book of books) {
    const payload = {
      ...book,
      isPublished: true,
      uploadedBy: admin._id,
      version: 1,
    };
    const existing = await Knowledge.findOne({
      $or: [{ title: book.title }, { fileUrl: book.fileUrl }],
    });
    if (existing) {
      existing.set(payload);
      await existing.save();
      updated += 1;
    } else {
      await Knowledge.create(payload);
      created += 1;
    }
  }

  console.log(`Knowledge library: created ${created}, updated ${updated}, total ${books.length}`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
