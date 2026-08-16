import { connectDb, disconnectDb } from '../config/db.js';
import { seedTownships } from './seedTownships.js';
import { seedAdmin, seedExpert } from './seedAdmin.js';
import { seedPosts } from './seedPosts.js';
import { seedMyanmarCommunity } from './seedMyanmarCommunity.js';
import { seedKnowledge } from './seedKnowledge.js';

async function main() {
  await connectDb();
  const townshipCount = await seedTownships();
  const admin = await seedAdmin();
  const expert = await seedExpert();
  const posts = await seedPosts();
  const myanmar = await seedMyanmarCommunity();
  const knowledge = await seedKnowledge(admin._id);

  console.log(`Seeded ${townshipCount} townships`);
  console.log(`Admin: ${admin.email}`);
  console.log(`Expert: ${expert.email}`);
  console.log(
    posts.skipped
      ? 'Feed posts: already present (skipped)'
      : `Feed posts: created ${posts.created} with Unsplash images`
  );
  console.log(
    myanmar.skipped
      ? `Myanmar demo posts: already present; liked ${myanmar.likedAccounts} real-account post(s)`
      : `Myanmar demo posts: created ${myanmar.created}; liked ${myanmar.likedAccounts} real-account post(s)`
  );
  console.log(`Knowledge: refreshed ${knowledge.created} resources`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
