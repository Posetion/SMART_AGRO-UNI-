import type { Types } from 'mongoose';
import { Diagnosis } from '../models/Diagnosis.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

const DEMO_TAG = '#SmartAgroDemoMM';

const PHOTO = {
  blast1: '/demo/rice-blast-1.png',
  blast2: '/demo/rice-blast-2.png',
  leaffolder: '/demo/rice-leaffolder.png',
  cotton: '/demo/cotton-blight.png',
};

const IMG = {
  ricePaddy: PHOTO.blast1,
  riceClose: PHOTO.blast2,
  farmerField: PHOTO.blast1,
  greenLeaves: PHOTO.leaffolder,
  sunriseFarm: PHOTO.blast2,
  soilHands: PHOTO.cotton,
  wetLeaves: PHOTO.blast1,
};

const REAL_ACCOUNT_EMAILS = [
  'arkarthetnaing3753@gmail.com',
  'kz@gmail.com',
  'twitter656898@gmail.com',
  'kaungmyattun069@gmail.com',
  'kaungmyatun069@gmail.com',
];

type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

async function ensureFarmer(input: {
  email: string;
  fullName: string;
  township: string;
  region: string;
  avatarTone: Tone;
}) {
  return User.findOneAndUpdate(
    { email: input.email },
    {
      email: input.email,
      fullName: input.fullName,
      role: 'farmer',
      isVerified: true,
      isActive: true,
      avatarTone: input.avatarTone,
      location: { township: input.township, region: input.region },
    },
    { upsert: true, new: true }
  );
}

async function ensureDiagnosis(input: {
  userId: Types.ObjectId;
  disease: string;
  severity: number;
  imageUrl: string;
  hoursAgo: number;
  cropType?: 'Rice' | 'Cotton';
}) {
  const cropType = input.cropType || 'Rice';
  const existing = await Diagnosis.findOne({
    userId: input.userId,
    disease: input.disease,
    cropType,
  });
  if (existing) {
    existing.imageUrl = input.imageUrl;
    existing.severityIndex = input.severity;
    existing.isVerified = true;
    await existing.save();
    return existing;
  }
  return Diagnosis.create({
    userId: input.userId,
    imageUrl: input.imageUrl,
    cropType,
    disease: input.disease,
    severityIndex: input.severity,
    isVerified: true,
    verifiedAt: new Date(Date.now() - input.hoursAgo * 3600_000),
    prediction: {
      riskLevel: input.severity >= 70 ? 'High' : input.severity >= 40 ? 'Medium' : 'Low',
      forecastDays: 7,
      confidence: 0.78 + input.severity / 500,
    },
    createdAt: new Date(Date.now() - input.hoursAgo * 3600_000),
  });
}

export async function seedMyanmarCommunity() {
  const expert = await User.findOne({ email: 'expert@smartagro.local' });
  const aung = await User.findOne({ email: 'aung@smartagro.local' });
  const su = await User.findOne({ email: 'su@smartagro.local' });
  const ko = await User.findOne({ email: 'ko@smartagro.local' });

  const myint = await ensureFarmer({
    email: 'myint.aung@smartagro.local',
    fullName: 'ဦးမြင့်အောင်',
    township: 'Pathein',
    region: 'Ayeyarwady',
    avatarTone: 'teal',
  });
  const khin = await ensureFarmer({
    email: 'khin.win@smartagro.local',
    fullName: 'ဒေါ်ခင်ခင်ဝင်း',
    township: 'Hinthada',
    region: 'Ayeyarwady',
    avatarTone: 'coral',
  });
  const zaw = await ensureFarmer({
    email: 'zaw.lin@smartagro.local',
    fullName: 'ကိုဇော်လင်း',
    township: 'Bago',
    region: 'Bago',
    avatarTone: 'amber',
  });
  const hnin = await ensureFarmer({
    email: 'hnin.pu@smartagro.local',
    fullName: 'မနှင်းပု',
    township: 'Yangon',
    region: 'Yangon',
    avatarTone: 'peach',
  });
  const than = await ensureFarmer({
    email: 'than.tun@smartagro.local',
    fullName: 'ဦးသန်းထွန်း',
    township: 'Mandalay',
    region: 'Mandalay',
    avatarTone: 'sky',
  });
  const mya = await ensureFarmer({
    email: 'mya.sein@smartagro.local',
    fullName: 'ဒေါ်မြမြစိန်',
    township: 'Mawlamyine',
    region: 'Mon',
    avatarTone: 'mint',
  });
  const aungKo = await ensureFarmer({
    email: 'aung.ko@smartagro.local',
    fullName: 'ကိုအောင်ကို',
    township: 'Sittwe',
    region: 'Rakhine',
    avatarTone: 'teal',
  });
  const tin = await ensureFarmer({
    email: 'tin.myint@smartagro.local',
    fullName: 'ဦးတင်မြင့်',
    township: 'Magway',
    region: 'Magway',
    avatarTone: 'amber',
  });

  const demoFarmers = [myint, khin, zaw, hnin, than, mya, aungKo, tin];
  const likers = [...demoFarmers, expert, aung, su, ko].filter(Boolean).map((u) => u!._id);

  const blastDx = await ensureDiagnosis({
    userId: myint._id,
    disease: 'Blast',
    severity: 86,
    imageUrl: PHOTO.blast1,
    hoursAgo: 6,
  });
  const bphDx = await ensureDiagnosis({
    userId: khin._id,
    disease: 'Brown Planthopper',
    severity: 78,
    imageUrl: IMG.greenLeaves,
    hoursAgo: 10,
  });
  const sheathDx = await ensureDiagnosis({
    userId: zaw._id,
    disease: 'Sheath Blight',
    severity: 72,
    imageUrl: IMG.wetLeaves,
    hoursAgo: 18,
  });
  const blightDx = await ensureDiagnosis({
    userId: hnin._id,
    disease: 'Bacterial Leaf Blight',
    severity: 68,
    imageUrl: IMG.riceClose,
    hoursAgo: 22,
  });
  const spotDx = await ensureDiagnosis({
    userId: than._id,
    disease: 'Brown Spot',
    severity: 61,
    imageUrl: IMG.greenLeaves,
    hoursAgo: 30,
  });
  const tungroDx = await ensureDiagnosis({
    userId: mya._id,
    disease: 'Tungro',
    severity: 74,
    imageUrl: IMG.farmerField,
    hoursAgo: 36,
  });
  const scaldDx = await ensureDiagnosis({
    userId: aungKo._id,
    disease: 'Leaf Scald',
    severity: 58,
    imageUrl: IMG.ricePaddy,
    hoursAgo: 40,
  });
  const folderDx = await ensureDiagnosis({
    userId: tin._id,
    disease: 'Rice Leaf Folder',
    severity: 54,
    imageUrl: PHOTO.leaffolder,
    hoursAgo: 48,
  });

  const now = Date.now();
  const already = await Post.findOne({ content: /SmartAgroDemoMM/ });
  let created = 0;

  if (!already) {
    const samples = [
      {
        userId: myint._id,
        diagnosticId: blastDx._id,
        content:
          `မနေ့ညက အရွက်တွေ စစ်ကြည့်တော့ AI က စပါးဂုတ်ကျိုး (Blast) လို့ ပြပါတယ်။ အရွက်ပေါ်မှာ စိန်ပုံအကွက်တွေ တွေ့တယ်။ ပုသိမ်ဘက်မှာ ဆိုးနေပြီ။ ${DEMO_TAG} #Blast #ဆန်`,
        images: [PHOTO.blast1, PHOTO.blast2],
        likes: likers.filter((id) => String(id) !== String(myint._id)).slice(0, 9),
        comments: [
          {
            userId: khin._id,
            content: 'ဟင်္သာတဘက်မှာလည်း စတွေ့နေပြီ။ ဓာတ်ပုံမျှဝေပေးလို့ ကျေးဇူးပါ။',
            timestamp: new Date(now - 1000 * 60 * 80),
            replies: [
              {
                userId: myint._id,
                content: 'ဒါဆို ဧရာဝတီတစ်ခုလုံး သတိထားသင့်တယ်။',
                timestamp: new Date(now - 1000 * 60 * 50),
              },
            ],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 5),
      },
      {
        userId: khin._id,
        diagnosticId: bphDx._id,
        content:
          `ပုဇွန်ကောင် (Brown Planthopper) တွေ ပင်စည်အောက်ခြေမှာ စုနေတယ်။ စစ်ချက်ကလည်း အတည်ပြုပြီးပါပြီ။ ဘယ်ဆေးသုံးရမလဲ အကြံပေးပါ။ ${DEMO_TAG} #BrownPlanthopper`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(khin._id)).slice(0, 8),
        comments: [
          {
            userId: expert?._id || myint._id,
            content:
              'ရေသွင်းရေထုတ် မှန်အောင်လုပ်ပါ။ ပင်ကြားလေဝင်လေထွက်ကောင်းအောင် ရှင်းပြီး ပိုးသတ်ဆေးကို ညနေပိုင်းမှာ သုံးပါ။',
            timestamp: new Date(now - 1000 * 60 * 120),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 9),
      },
      {
        userId: zaw._id,
        diagnosticId: sheathDx._id,
        content:
          `ပဲခူးက လယ်မှာ Sheath Blight လို့ detect လုပ်မိတယ်။ ရွက်ဖုံးတွေ ညိုပြီး ပုပ်လာတယ်။ ဒီတစ်ပတ် မိုးများလို့ ပိုဆိုးလာမှာ စိုးရိမ်တယ်။ ${DEMO_TAG} #SheathBlight #ဆန်`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(zaw._id)).slice(0, 7),
        comments: [
          {
            userId: hnin._id,
            content: 'ကျွန်မတို့ ရန်ကုန်ဘက်မှာလည်း ရွက်ဖုံးပုပ် စတွေ့တယ်။',
            timestamp: new Date(now - 1000 * 60 * 200),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 16),
      },
      {
        userId: hnin._id,
        diagnosticId: blightDx._id,
        content:
          `ကျွန်မလယ်မှာ Bacterial Leaf Blight တွေ့တယ်။ အရွက်စွန်းကနေ အဝါရောင်ဆင်းပြီး ခြောက်လာတယ်။ စစ်ချက်ကို တွဲပြီး မျှဝေလိုက်ပါတယ်။ ${DEMO_TAG} #BacterialLeafBlight`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(hnin._id)).slice(0, 6),
        comments: [],
        createdAt: new Date(now - 1000 * 60 * 60 * 20),
      },
      {
        userId: than._id,
        diagnosticId: spotDx._id,
        content:
          `မန္တလေးမှာ Brown Spot တွေ အရွက်ပေါ် အစက်အပြောက်ကလေးတွေ ပေါ်လာပြီ။ မနေ့ detect လုပ်ထားတဲ့ ရလဒ်ပါ။ နေပူပြီး စိုထိုင်းဆများတဲ့ညတွေမှာ ပိုထွက်တယ်။ ${DEMO_TAG} #BrownSpot`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(than._id)).slice(0, 7),
        comments: [
          {
            userId: tin._id,
            content: 'မကွေးဘက်မှာလည်း အစက်အပြောက်တွေ့တယ်။ မျှဝေပေးလို့ ကောင်းပါတယ်။',
            timestamp: new Date(now - 1000 * 60 * 300),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 28),
      },
      {
        userId: mya._id,
        diagnosticId: tungroDx._id,
        content:
          `မော်လမြိုင်က လယ်မှာ Tungro လို့ ထွက်လာတယ်။ ပင်ပွားတွေ အဝါရောင်ဖျော့နေတယ်။ ကျွမ်းကျင်သူ အကြံပေးပါဦး။ ${DEMO_TAG} #Tungro`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(mya._id)).slice(0, 6),
        comments: [
          {
            userId: expert?._id || myint._id,
            content: 'ရွက်စိမ်းပိုးကို ထိန်းပါ။ ရောဂါရှိတဲ့ပင်တွေ နှုတ်ပြီး ဖျက်ဆီးပါ။ အစေ့သစ်မစိုက်ခင် လယ်ကွင်းရှင်းပါ။',
            timestamp: new Date(now - 1000 * 60 * 400),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 34),
      },
      {
        userId: aungKo._id,
        diagnosticId: scaldDx._id,
        content:
          `စစ်တွေဘက်မှာ Leaf Scald တွေ့တယ်။ ကမ်းရိုးတန်း စိုထိုင်းဆများလို့ ထင်တယ်။ AI စစ်ချက်နဲ့ တွဲထားပါတယ်။ ${DEMO_TAG} #LeafScald #ဆန်`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(aungKo._id)).slice(0, 5),
        comments: [],
        createdAt: new Date(now - 1000 * 60 * 60 * 38),
      },
      {
        userId: tin._id,
        diagnosticId: folderDx._id,
        content:
          `မကွေးမှာ စပါးရွက်လိပ်ပိုး (Rice Leaf Folder) တွေ့တယ်။ သားလောင်းနဲ့ လိပ်ပြာအကောင်ကြီး နှစ်မျိုးလုံး ဓာတ်ပုံရိုက်ထားပါတယ်။ အရွက်တွေ ဖြူပြီး လိပ်နေတယ်။ ${DEMO_TAG} #RiceLeafFolder`,
        images: [PHOTO.leaffolder],
        likes: likers.filter((id) => String(id) !== String(tin._id)).slice(0, 5),
        comments: [
          {
            userId: zaw._id,
            content: 'စောစောဖမ်းရင် သိပ်မဆိုးပါဘူး။ အရွက်လိပ်တွေ ချိုးကြည့်ပါ။',
            timestamp: new Date(now - 1000 * 60 * 500),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 46),
      },
      {
        userId: expert?._id || myint._id,
        content:
          `ကျွမ်းကျင်သူမှတ်ချက် — ဒီတစ်ပတ် ဧရာဝတီ၊ ရန်ကုန်၊ ပဲခူးမှာ Blast နဲ့ ပုဇွန်ကောင် တက်နေပါတယ်။ အရွက်ဓာတ်ပုံရိုက်ပြီး စစ်ချက်ကို ပို့စ်မှာ တွဲပါ။ အနီးနားက တောင်သူတွေ မြန်မြန်သိပါမယ်။ ${DEMO_TAG} #SmartAgro`,
        images: [],
        likes: likers.slice(0, 8),
        comments: [
          {
            userId: myint._id,
            content: 'ကျေးဇူးတင်ပါတယ် ဘကြီး။ ပုသိမ်က လယ်သမားတွေကို ပြောထားပါပြီ။',
            timestamp: new Date(now - 1000 * 60 * 90),
            replies: [],
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 60 * 8),
      },
      {
        userId: zaw._id,
        content:
          `မနက်ခင်း လယ်ထဲဆင်းကြည့်တာ ရေခပ်ကောင်းသေးတယ်။ ဒါပေမဲ့ အနီးကကွင်းတွေမှာ ရောဂါစတွေ့နေလို့ နေ့တိုင်း လှည့်ကြည့်နေပါတယ်။ ${DEMO_TAG} #လယ်သမားဘဝ`,
        images: [],
        likes: likers.filter((id) => String(id) !== String(zaw._id)).slice(0, 4),
        comments: [],
        createdAt: new Date(now - 1000 * 60 * 60 * 3),
      },
    ];

    await Post.insertMany(
      samples.map((s) => ({
        userId: s.userId,
        content: s.content,
        images: s.images,
        diagnosticId: 'diagnosticId' in s ? s.diagnosticId : undefined,
        likes: s.likes,
        comments: s.comments,
        isActive: true,
        createdAt: s.createdAt,
        updatedAt: s.createdAt,
      }))
    );
    created = samples.length;
  }

  const likedAccounts = await likeRealAccounts(likers);
  const photos = await refreshDemoDetectionPhotos();
  return { created, skipped: Boolean(already), likedAccounts, photos };
}

async function refreshDemoDetectionPhotos() {
  const blastImages = [PHOTO.blast1, PHOTO.blast2];
  const updates = [
    { match: /#Blast|ဂုတ်ကျိုး|\(Blast\)/i, images: blastImages, disease: 'Blast', cropType: 'Rice' as const },
    { match: /#RiceLeafFolder|ရွက်လိပ်ပိုး/i, images: [PHOTO.leaffolder], disease: 'Rice Leaf Folder', cropType: 'Rice' as const },
    { match: /#BacterialBlight|#ဝါ|ဝါရွက်/i, images: [PHOTO.cotton], disease: 'Bacterial Blight', cropType: 'Cotton' as const },
  ];

  let updated = 0;
  const posts = await Post.find({ content: DEMO_TAG, isActive: true });
  for (const post of posts) {
    const rule = updates.find((u) => u.match.test(post.content));
    if (!rule) continue;
    post.images = rule.images;
    if (post.diagnosticId) {
      await Diagnosis.updateOne(
        { _id: post.diagnosticId },
        { $set: { imageUrl: rule.images[0], disease: rule.disease, cropType: rule.cropType } }
      );
    }
    await post.save();
    updated += 1;
  }

  const arkar = await User.findOne({ email: 'arkarthetnaing3753@gmail.com' });
  if (arkar) {
    const brown = await Post.findOne({
      userId: arkar._id,
      content: /Brown Spot|#BrownSpot/,
    });
    if (brown) {
      const cottonDx = await ensureDiagnosis({
        userId: arkar._id,
        disease: 'Bacterial Blight',
        cropType: 'Cotton',
        severity: 76,
        imageUrl: PHOTO.cotton,
        hoursAgo: 14,
      });
      brown.content =
        `ဝါရွက်ပေါ်မှာ angular အစက်အပြောက်တွေ တွေ့လို့ စစ်ကြည့်တော့ Bacterial Blight လို့ ထွက်လာပါတယ်။ ရွက်ပြောက်အလယ်က ခြောက်ပြီး ညိုနေတယ်။ ${DEMO_TAG} #BacterialBlight #ဝါ`;
      brown.images = [PHOTO.cotton];
      brown.diagnosticId = cottonDx._id;
      await brown.save();
      updated += 1;
    }

    const blast = await Post.findOne({
      userId: arkar._id,
      content: /Blast|ဂုတ်ကျိုး/,
    });
    if (blast) {
      blast.images = blastImages;
      blast.content =
        `ဒီနေ့ အရွက်ဓာတ်ပုံရိုက်ပြီး စစ်ကြည့်တော့ စပါးဂုတ်ကျိုး (Blast) လို့ ထွက်လာပါတယ်။ စိန်ပုံအကွက်တွေ ရှင်းရှင်းတွေ့တယ်။ ဧရာဝတီဘက်မှာလည်း ဆိုးနေတယ်လို့ ကြားတယ်။ ${DEMO_TAG} #Blast #ဆန်`;
      await blast.save();
    }
  }

  return updated;
}

async function likeRealAccounts(likerIds: Types.ObjectId[]) {
  const users = await User.find({
    email: { $in: REAL_ACCOUNT_EMAILS },
    isActive: true,
  });
  if (!users.length) return 0;

  const arkar = users.find((u) => u.email === 'arkarthetnaing3753@gmail.com');
  if (arkar) {
    const existing = await Post.countDocuments({ userId: arkar._id, isActive: true });
    if (existing === 0) {
      const blast = await ensureDiagnosis({
        userId: arkar._id,
        disease: 'Blast',
        severity: 81,
        imageUrl: IMG.riceClose,
        hoursAgo: 4,
      });
      const cotton = await ensureDiagnosis({
        userId: arkar._id,
        disease: 'Bacterial Blight',
        cropType: 'Cotton',
        severity: 76,
        imageUrl: PHOTO.cotton,
        hoursAgo: 14,
      });
      const now = Date.now();
      await Post.insertMany([
        {
          userId: arkar._id,
          diagnosticId: blast._id,
          content:
            `ဒီနေ့ အရွက်ဓာတ်ပုံရိုက်ပြီး စစ်ကြည့်တော့ စပါးဂုတ်ကျိုး (Blast) လို့ ထွက်လာပါတယ်။ စိန်ပုံအကွက်တွေ ရှင်းရှင်းတွေ့တယ်။ ဧရာဝတီဘက်မှာလည်း ဆိုးနေတယ်လို့ ကြားတယ်။ ${DEMO_TAG} #Blast #ဆန်`,
          images: [PHOTO.blast1, PHOTO.blast2],
          likes: likerIds.slice(0, 10),
          comments: [
            {
              userId: likerIds[0],
              content: 'ပုသိမ်မှာလည်း ဒီလိုပဲ။ မျှဝေပေးလို့ ကျေးဇူးပါ ကိုအာကာ။',
              timestamp: new Date(now - 1000 * 60 * 40),
              replies: [],
            },
            {
              userId: likerIds[1] || likerIds[0],
              content: 'ဓာတ်ပုံရှင်းတယ်။ ကျွန်မလည်း မနက်ဖြန် စစ်မယ်။',
              timestamp: new Date(now - 1000 * 60 * 25),
              replies: [],
            },
          ],
          isActive: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 2),
          updatedAt: new Date(now - 1000 * 60 * 60 * 2),
        },
        {
          userId: arkar._id,
          diagnosticId: cotton._id,
          content:
            `ဝါရွက်ပေါ်မှာ angular အစက်အပြောက်တွေ တွေ့လို့ စစ်ကြည့်တော့ Bacterial Blight လို့ ထွက်လာပါတယ်။ ရွက်ပြောက်အလယ်က ခြောက်ပြီး ညိုနေတယ်။ ${DEMO_TAG} #BacterialBlight #ဝါ`,
          images: [PHOTO.cotton],
          likes: likerIds.slice(0, 8),
          comments: [
            {
              userId: likerIds[2] || likerIds[0],
              content: 'မန္တလေးဘက်မှာလည်း အစက်အပြောက်တွေ့တယ်။ စောစောကုရင် ပိုကောင်းပါတယ်။',
              timestamp: new Date(now - 1000 * 60 * 180),
              replies: [],
            },
          ],
          isActive: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 13),
          updatedAt: new Date(now - 1000 * 60 * 60 * 13),
        },
      ]);
    }
  }

  let touched = 0;
  for (const user of users) {
    const result = await Post.updateMany(
      {
        userId: user._id,
        isActive: true,
        $expr: { $gt: [{ $strLenCP: { $ifNull: ['$content', ''] } }, 12] },
      },
      { $addToSet: { likes: { $each: likerIds } } }
    );
    touched += result.modifiedCount;
  }
  return touched;
}
