import { connectDb, disconnectDb } from '../config/db.js';
import { ChatbotSession } from '../models/ChatbotSession.js';
import { User } from '../models/User.js';

const EMAIL = 'buuthee686@gmail.com';

function atHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function turn(
  sender: 'user' | 'bot',
  text: string,
  hoursAgo: number
) {
  return {
    sender,
    text,
    audioUrl: '',
    imageUrls: [] as string[],
    attachments: [] as Array<{ url: string; name: string; mimeType: string }>,
    timestamp: atHoursAgo(hoursAgo),
  };
}

const SESSIONS: Array<{
  sessionId: string;
  hoursAgo: number;
  messages: ReturnType<typeof turn>[];
}> = [
  {
    sessionId: 'demo-buuthee-rice-blast',
    hoursAgo: 6,
    messages: [
      turn(
        'user',
        'ဘကြီး စပါးရွက်ပေါ် အညိုရောင် အစက်အပြောက်တွေ ကျနေတယ်။ ဂုတ်ကျိုးရောဂါလားခင်ဗျ။',
        6.4
      ),
      turn(
        'bot',
        `ဟင့်အင်း ညီမလေး/မောင်လေး။ ရွက်ပေါ် အညိုစက်၊ ကြယ်ပုံ/လိပ်ပြာပုံ အစက်ဆိုရင် စပါးဂုတ်ကျိုး (Blast) ဖြစ်နိုင်ပါတယ်။

အခုခင်းထဲမှာ လုပ်ရမှာက —
၁. ရောဂါကျရွက်/ပင်ကြွင်းတွေကို ခူးပြီး မီးရှို့ပါ။ ခင်းထဲ ပြန်မပစ်ပါနဲ့။
၂. ရေကို အမြဲရှိအောင် ထိန်းပါ။ ရေငတ်ပြီး ပြန်စိုရင် ရောဂါ ပိုပြင်းတတ်ပါတယ်။
၃. ယူရီးယား မလွန်အောင် ထားပြီး ပိုတက်ရှ် နည်းနည်း ထည့်ပါ။

ဓာတ်ပုံတစ်ပုံ Detect စာမျက်နှာကနေ တင်ပေးရင် ပိုတိကျအောင် ကြည့်ပေးနိုင်ပါတယ်။`,
        6.35
      ),
      turn('user', 'ဆေးက ဘာသုံးသင့်လဲ ဘကြီး။ ပျိုးပင်လည်း ပါတယ်။', 6.2),
      turn(
        'bot',
        `ပျိုးပင်ဆိုရင် အရင်ဆုံး ပြင်းတဲ့ပင်တွေကို ခွဲဖယ်ပါ။ ကျန်းမာတဲ့ပျိုးပဲ ရွေးစိုက်ပါ။

ဆေးဘက်က (တံဆိပ်အတိုင်းသာ) —
• Isoprothiolane
• Tricyclazole
• Thiophanate-methyl

ဖျန်းရင် နံနက်စောစော သို့မဟုတ် ညနေ၊ လေငြိမ်ချိန်မှာ ဖျန်းပါ။ ရွက်နှစ်ဖက်လုံး စိုအောင်။ တစ်ခါတည်း အလွန်အကျွံ မဖျန်းပါနဲ့။

မျိုးစေ့ကို နောက်စိုက်မယ်ဆိုရင် မှိုသတ်ဆေးနဲ့ လူးနယ်ပြီးမှ စိမ်ပါ။`,
        6.15
      ),
      turn('user', 'မိုးရွာနေရင် ဆေးဖျန်းလို့ ရလား။', 6.05),
      turn(
        'bot',
        `မိုးကြီးနေရင် မဖျန်းသေးပါနဲ့။ မိုးရေက ဆေးကို ဆေးချသွားမယ်။

မိုးနားပြီး ရွက်မစိုတော့မှ (ခန့်မှန်း ၄–၆ နာရီ ခြောက်ချိန်) ဖျန်းပါ။ ဖျန်းပြီး နာရီအနည်းငယ်အတွင်း မိုးပြန်ရွာရင် ပြန်ဖျန်းရနိုင်ပါတယ်။

မိုးစိုထိုင်းဆ များနေတဲ့ ရက်တွေမှာ ဂုတ်ကျိုး ပိုမြန်တတ်လို့ ခင်းကို နေ့စဉ် လှည့်ကြည့်ပါ။`,
        6
      ),
    ],
  },
  {
    sessionId: 'demo-buuthee-irrigation',
    hoursAgo: 28,
    messages: [
      turn(
        'user',
        'ဘကြီး ဒီရက်ပိုင်း စပါးခင်း ရေသွင်းသင့်လား။ မိုးလေးရွာနေတယ်။',
        28.5
      ),
      turn(
        'bot',
        `မိုးအနည်းငယ်ရွာနေရင် ရေထပ်မသွင်းသေးပါနဲ့။ ခင်းထဲ ရေမြုပ်နေရင် ပင်ခြေ ပုပ်ပြီး ပုစဉ်းရင်ကောင် (planthopper) လည်း တက်တတ်ပါတယ်။

လုပ်ရမှာ —
• ရေဝင်ရေထွက် ပေါက်ကို ဖွင့်ပြီး ရေလျှံတာ ပြန်ချပါ။
• ရေလယ်လောက် (ပင်ခြေစိုရုံ) ထားပါ။ နက်နက် မထားပါနဲ့။
• ယူရီးယား ဒီအပတ် ထပ်မထည့်သေးပါနဲ့။ စိုပြီး နိုက်ထရိုဂျင်များရင် ပိုးပိုခေါ်ပါတယ်။

မိုးနားပြီး ခင်းခြောက်လာမှ ရေပြန်သွင်းပါ။`,
        28.4
      ),
      turn('user', 'စိုထိုင်းဆ များရင် ဘာရောဂါကို ဂရုစိုက်ရမလဲ။', 28.2),
      turn(
        'bot',
        `စိုထိုင်းဆ များ၊ မိုးအုံ့ရင် ဒီသုံးခုကို အထူးကြည့်ပါ။

၁. ဂုတ်ကျိုး (Blast) — ရွက်ပေါ် ကြယ်/လိပ်ပြာပုံ အစက်
၂. ရွက်ဖုံးမှို (Sheath blight) — ပင်လယ် ရွက်ဖုံးမှာ အဖြူ/မီးခိုးစက်
၃. မှိုညိုစက် (Brown spot) — ရွက်မှာ ဝိုင်းဝိုင်း အညိုစက်

မနက်ခင်း ရွက်စိုချိန်မှာ လှည့်ကြည့်ပါ။ ရောဂါပင် တွေ့ရင် ချက်ချင်း ဖယ်ပါ။ ဓာတ်ပုံတင်ပေးရင် ဘကြီးက ခွဲပြောပေးမယ်။`,
        28.1
      ),
    ],
  },
  {
    sessionId: 'demo-buuthee-onion',
    hoursAgo: 52,
    messages: [
      turn(
        'user',
        'ကြက်သွန်နီ ပင်ပေါက်တွေ ရွက်ဝါပြီး ကြီးမလာဘူး ဘကြီး။ ဘာဖြစ်တာလဲ။',
        52.6
      ),
      turn(
        'bot',
        `ရွက်ဝါပြီး ပုနေရင် အများအားဖြင့် ရေလွန်၊ မြေစိုလွန်း၊ ဒါမှမဟုတ် နိုက်ထရိုဂျင် နည်း/လွန် ကြောင့် ဖြစ်တတ်ပါတယ်။

အခု စစ်ရမှာ —
• မြေက ရေဝပ်နေလား။ ဝပ်ရင် ကြောင်းလေးတွေ ဖောက်ပြီး ရေထုတ်ပါ။
• ပင်ခြေ ပုပ်/နံနေလား။ ပုပ်ရင် အပင်ဖယ်ပြီး ခင်းသန့်ရှင်းရေး လုပ်ပါ။
• နေရောင် ရဲ့ရဲ့ ကျသလား။ အရိပ်ထူရင် ပင်ပုတတ်ပါတယ်။

ဓာတ်ပုံနဲ့ မြေအနေအထား ပြောပြရင် ပိုတိကျအောင် ညွှန်ပေးမယ်။`,
        52.5
      ),
      turn('user', 'ယူရီးယား ထပ်ထည့်သင့်လား။ တီစူပါရော။', 52.2),
      turn(
        'bot',
        `ရွက်ဝါနေတိုင်း ယူရီးယား မထည့်ပါနဲ့။ ရေဝပ်ချိန် ယူရီးယား ထည့်ရင် အမြစ် ပိုပုပ်တတ်ပါတယ်။

မြေခြောက်လာ၊ ပင်ခြေ ကျန်းမာမှ —
• တီစူပါ (ဖော့စဖောရပ်) နည်းနည်း ထည့်ပြီး အမြစ်အားပေးပါ။
• ယူရီးယားက ခွဲထည့်ပါ။ တစ်ခါတည်း မများပါနဲ့။
• ပိုတက်ရှ် နည်းနည်း တွဲထည့်ရင် ပင်မာပြီး ရောဂါ ခံနိုင်ပါတယ်။

ကြက်သွန်က ရေနည်းနည်း၊ မကြာခဏ စိုရုံသာ။ ရေကြီးကြီး မသွင်းပါနဲ့။`,
        52.1
      ),
      turn('user', 'ပိုးကောင်လေးတွေ ရွက်ထဲ စားနေတယ်။ ဘာလုပ်ရမလဲ။', 52.05),
      turn(
        'bot',
        `ရွက်ထဲ ကိုက်စားရင် သားပေါက်ပိုး / ရွက်လိပ်ပိုး မျိုး ဖြစ်နိုင်ပါတယ်။

ဒီနေ့ လုပ်ပါ —
၁. ကိုက်ထားတဲ့ ရွက်တွေကို ခူးဖယ်ပါ။
၂. ခင်းပေါင်း ရှင်းပါ။ ပေါင်းထဲ ပိုးပုန်းတတ်ပါတယ်။
၃. ပြင်းမှသာ ပိုးသတ်ဆေး (Cartap သို့မဟုတ် Chlorantraniliprole အုပ်စု) ကို တံဆိပ်အတိုင်း သုံးပါ။

ညဘက် မီးလင်းကြည့်ရင် ပိုးလောက် ပိုတွေ့တတ်ပါတယ်။ အရင်ဆုံး လက်နဲ့ ဖယ်၊ ဆေးက နောက်မှ။`,
        52
      ),
    ],
  },
];

export async function seedBuutheeChats() {
  let user = await User.findOne({ email: EMAIL });
  if (!user) {
    user = await User.create({
      email: EMAIL,
      fullName: 'ဘူးသီး',
      role: 'farmer',
      isVerified: true,
      isActive: true,
      crops: ['Rice', 'Onion'],
      location: { township: 'Meiktila', region: 'Mandalay' },
      avatarTone: 'teal',
    });
  } else {
    if (!user.crops?.length) user.crops = ['Rice', 'Onion'];
    if (!user.fullName?.trim()) user.fullName = 'ဘူးသီး';
    await user.save();
  }

  let upserted = 0;
  for (const session of SESSIONS) {
    await ChatbotSession.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        userId: user._id,
        sessionId: session.sessionId,
        messages: session.messages,
        isActive: true,
        updatedAt: atHoursAgo(session.hoursAgo),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false }
    );
    upserted += 1;
  }

  return { email: EMAIL, name: user.fullName, sessions: upserted };
}

const isDirect = process.argv[1]?.includes('seedChatHistory');
if (isDirect) {
  const main = async () => {
    await connectDb();
    const result = await seedBuutheeChats();
    console.log(`Chat history: ${result.sessions} Myanmar crop chats for ${result.email} (${result.name})`);
    await disconnectDb();
  };
  main().catch(async (err) => {
    console.error(err);
    await disconnectDb();
    process.exit(1);
  });
}
