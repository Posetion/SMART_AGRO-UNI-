import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

/** Unsplash field / crop photos (stable image IDs). */
const IMG = {
  ricePaddy:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  riceClose:
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  farmerField:
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
  greenLeaves:
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
  onionHarvest:
    'https://images.unsplash.com/photo-1518977676601-b53f82ada655?auto=format&fit=crop&w=1200&q=80',
  vegetables:
    'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=1200&q=80',
  irrigation:
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
  sunriseFarm:
    'https://images.unsplash.com/photo-1500937386664-56d1dfefbc56?auto=format&fit=crop&w=1200&q=80',
  soilHands:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
  marketVeg:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
};

async function ensureFarmer(email: string, fullName: string, township: string) {
  return User.findOneAndUpdate(
    { email },
    {
      email,
      fullName,
      role: 'farmer',
      isVerified: true,
      isActive: true,
      location: { township, region: 'Myanmar' },
    },
    { upsert: true, new: true }
  );
}

export async function seedPosts() {
  const alreadySeeded = await Post.findOne({
    content: /Community reminder: link a verified diagnosis/i,
  });
  if (alreadySeeded) {
    return { created: 0, skipped: true as const };
  }

  const admin = await User.findOne({ email: 'admin@smartagro.local' });
  const expert = await User.findOne({ email: 'expert@smartagro.local' });
  const aung = await ensureFarmer('aung@smartagro.local', 'Aung Min', 'Mandalay');
  const su = await ensureFarmer('su@smartagro.local', 'Su Hlaing', 'Yangon');
  const ko = await ensureFarmer('ko@smartagro.local', 'Ko Zaw', 'Bago');

  const authors = [admin, expert, aung, su, ko].filter(Boolean);
  if (authors.length < 3) {
    return { created: 0, skipped: true as const };
  }

  const now = Date.now();
  const samples = [
    {
      userId: aung._id,
      content:
        'Morning check in the paddy — leaves look healthy after last week’s rain. Sharing for anyone watching #RiceBlast this monsoon. #rice #Myanmar',
      images: [IMG.ricePaddy, IMG.greenLeaves],
      likes: [su._id, ko._id],
      comments: [
        {
          userId: su._id,
          content: 'Looks good! Did you spray anything preventively?',
          timestamp: new Date(now - 1000 * 60 * 40),
          replies: [
            {
              userId: aung._id,
              content: 'Only neem oil at edges so far.',
              timestamp: new Date(now - 1000 * 60 * 25),
            },
          ],
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 5),
    },
    {
      userId: su._id,
      content:
        'Onion beds drying a bit fast. Any tips for stemphylium spots on older leaves? #onion #Stemphylium',
      images: [IMG.onionHarvest],
      likes: [aung._id, expert?._id].filter(Boolean),
      comments: [
        {
          userId: expert?._id || aung._id,
          content: 'Remove heavily spotted leaves and improve airflow between rows. Keep foliage dry in the evening.',
          timestamp: new Date(now - 1000 * 60 * 90),
          replies: [],
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 12),
    },
    {
      userId: ko._id,
      content:
        'Sunrise over the field before transplanting. Grateful for cooler mornings. #rice #farmlife',
      images: [IMG.sunriseFarm, IMG.farmerField],
      likes: [aung._id, su._id, admin?._id].filter(Boolean),
      comments: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 20),
    },
    {
      userId: expert?._id || aung._id,
      content:
        'Expert note: Brown Spot often rises after cloudy humid nights. Scout leaf tips twice a week and share photos if unsure. #rice #BrownSpot',
      images: [IMG.riceClose],
      likes: [aung._id, su._id, ko._id],
      comments: [
        {
          userId: ko._id,
          content: 'Thank you — matching what I saw near Bago.',
          timestamp: new Date(now - 1000 * 60 * 200),
          replies: [],
        },
      ],
      createdAt: new Date(now - 1000 * 60 * 60 * 28),
    },
    {
      userId: admin?._id || aung._id,
      content:
        'Community reminder: link a verified diagnosis when you post field photos — it helps nearby farmers act faster. Stay safe this season. #SmartAgro',
      images: [IMG.soilHands, IMG.irrigation],
      likes: [aung._id, su._id],
      comments: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 36),
    },
    {
      userId: aung._id,
      content:
        'Market day haul — local greens looking strong. Crop: Onion beds still recovering from last week’s heat. #onion #market',
      images: [IMG.marketVeg, IMG.vegetables],
      likes: [ko._id],
      comments: [],
      createdAt: new Date(now - 1000 * 60 * 60 * 48),
    },
  ];

  await Post.insertMany(
    samples.map((s) => ({
      userId: s.userId,
      content: s.content,
      images: s.images,
      likes: s.likes,
      comments: s.comments,
      isActive: true,
      createdAt: s.createdAt,
      updatedAt: s.createdAt,
    }))
  );

  return { created: samples.length, skipped: false as const };
}
