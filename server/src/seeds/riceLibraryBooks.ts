export type SeedItem = {
  title: string;
  category: 'Book' | 'Article' | 'Journal';
  description: string;
  content: string;
  author: string;
  tags: string[];
  views: number;
  fileUrl?: string;
  coverUrl?: string;
};

function book(
  partial: Omit<SeedItem, 'category' | 'views'> & { views?: number }
): SeedItem {
  return {
    category: 'Book',
    ...partial,
    views: partial.views ?? 48,
  };
}

/** Unique PDFs from Rice/ (duplicates and the certificate are omitted). */
export const RICE_LIBRARY_BOOKS: SeedItem[] = [
  book({
    title: 'နည်းစနစ်မှန်စိုက်ပျိုးရေး စပ်မျိုးစပါးတွင် အလေးပေးနှင့် အခြားဆောင်းပါးများ',
    description:
      'မောင်ဖူးဝေ (တောင်တွင်းကြီး) ရေးသော စပ်မျိုးစပါး (Hybrid Rice) ဆောင်းပါးစုစည်းချက်။ ဒေသမျိုးနှင့် အထွက်ကောင်းမျိုးတို့နှင့် မတူသော အပင်သဘာဝ၊ F1 စိုက်ပျိုးနည်းပညာနှင့် ၁၉၉၇ Hybrid Rice Training Course အတွေ့အကြုံကို တောင်သူနှင့် စိုက်ပျိုးရေးဝန်ထမ်းအတွက် ရှင်းပြသည်။\n\nHybrid rice articles by Maung Phyu Wai (Taungdwingyi): F1 cultivation, yield gain, and how hybrid varieties differ from local and high-yielding rice.',
    content:
      'အမှာစာ — စပ်မျိုးစပါးကို မစိုက်မီ မျိုးဖြစ်ပေါ်ပုံနှင့် F1 စိုက်ပျိုးနည်းပညာကို လေ့လာရန်။ မာတိကာတွင် စပါးအထူးအထွက်တိုး သင့်တော်သည့်စပ်မျိုး၊ စပ်မျိုးစပါးအထွက်ပိုမှုနှင့် အခြားဆောင်းပါးများ ပါဝင်သည်။',
    author: 'မောင်ဖူးဝေ (တောင်တွင်းကြီး)',
    tags: ['rice', 'စပါး', 'hybrid-rice', 'စပ်မျိုးစပါး', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/20180502_3_usoemyint_hybrid-rice-article-book.pdf',
    coverUrl: '/knowledge/20180502_3_usoemyint_hybrid-rice-article-book-cover.png',
    views: 62,
  }),
  book({
    title: 'SRI စပါးစိုက်ပျိုးနည်းနှင့် ယင်း၏အကျိုးကျေးဇူးများ',
    description:
      'စိုက်ပျိုးရေးဦးစီးဌာန၏ SRI (System of Rice Intensification) လက်ကမ်းစာစောင်။ ပျိုးထောင်ခြင်းမှ ရွှေ့ပြောင်းစိုက်၊ ပေါင်းရှင်းခြင်းအထိ ဓာတ်ပုံ ၁၂ ဆင့်နှင့် ရေသက်သာခြင်း၊ မျိုးစေ့လျော့သုံးခြင်း၊ အထွက်တိုးခြင်း စသည့် အကျိုးများကို ပြသည်။\n\nDepartment of Agriculture leaflet on SRI rice: 12 visual steps and benefits such as less seed, less water, and higher yield.',
    content:
      'SRI နည်းသည် မြေ၊ ရေ၊ အာဟာရကို ထိရောက်စွာ စီမံ၍ စပါးအရည်အသွေးနှင့် အထွက်ကို တိုးစေသော စိုက်နည်းဖြစ်သည်။ ပါဝင်သည့်အဆင့်များ — ပျိုးခင်းပြင်ခြင်း၊ မျိုးစေ့ရွေးခြင်း၊ ရွှေ့ပြောင်းစိုက်ခြင်း၊ စက်ပေါင်းထွန်ခြင်း။',
    author: 'စိုက်ပျိုးရေးဦးစီးဌာန',
    tags: ['rice', 'SRI', 'farming', 'water', 'Myanmar', 'DOA'],
    fileUrl: '/knowledge/d-agr3_0004.pdf',
    coverUrl: '/knowledge/d-agr3_0004-cover.png',
  }),
  book({
    title: 'မျိုးစေ့ထုတ်လုပ်ခြင်းနှင့် ဈေးကွက်ရှာဖွေဖော်ဆောင်ခြင်း',
    description:
      'Welthungerhilfe RSSD စီမံကိန်း (ပျော်ပွန်) နှင့် မြန်မာဆန်စပါးအသင်းချုပ် (MRF) ပူးပေါင်းထုတ်သော လက်စွဲ။ ရာသီဥတုဒဏ်ခံ မျိုးစေ့ အရည်အသွေးမြင့် ထုတ်လုပ်ခြင်းနှင့် ဈေးကွက်ရှာဖွေရေးကို တောင်သူအမျိုးသား/အမျိုးသမီးများအတွက် ရေးသားသည်။ LIFT အထောက်အပံ့။\n\nRSSD / WHH / MRF / LIFT seed-production and marketing manual for climate-resilient rice seed in Pyapon.',
    content:
      'RSSD စီမံကိန်းနောက်ခံ — Resilience B.V., Mukushi Seeds, Welthungerhilfe, Wageningen University & Research, LIFT။ ဤလက်စွဲကို ထုတ်ရခြင်းမှာ မျိုးစေ့ထုတ်လုပ်မှု နည်းပညာနှင့် စနစ်တကျ စီမံခန့်ခွဲမှု ပေးရန်ဖြစ်သည်။',
    author: 'Welthungerhilfe RSSD · Myanmar Rice Federation',
    tags: ['rice', 'seed', 'မျိုးစေ့', 'marketing', 'LIFT', 'Myanmar'],
    fileUrl: '/knowledge/d_agr1_0001.pdf',
    coverUrl: '/knowledge/d_agr1_0001-cover.png',
    views: 55,
  }),
  book({
    title:
      'မြန်မာနိုင်ငံ စပါးသီးနှံစိုက်ပျိုးရေးအတွက် ရေမြေသဘာဝနှင့် နေရာဒေသကိုယ်စားပြု အပင်အဟာရဓာတ်များ စီမံခန့်ခွဲခြင်းနည်းပညာ',
    description:
      'မြန်မာ့စိုက်ပျိုးရေးလုပ်ငန်းနှင့် IRRI ပူးတွဲ Site-Specific Nutrient Management လက်စွဲ။ ဒေသရေမြေအလိုက် N, P, K ကျွေးနည်းဖြင့် စပါးပင်ကျန်းမာရေးနှင့် အထွက်ကို တိုးစေသည်။\n\nIRRI / Myanmar Agriculture Service handbook on site-specific plant nutrient management for Myanmar rice.',
    content:
      'နေရာဒေသကိုယ်စားပြု အာဟာရစီမံခန့်ခွဲခြင်း — နိုက်ထရိုဂျင်၊ ဖော့စဖရပ်၊ ပိုတက်စီယမ်ကို မြေနှင့် ရေအခြေအနေနှင့် ကိုက်အောင် ကျွေးရန်။ ထုတ်ဝေ — လယ်ယာစိုက်ပျိုးရေးနှင့် ဆည်မြောင်းဝန်ကြီးဌာန၊ မြန်မာ့စိုက်ပျိုးရေးလုပ်ငန်း၊ IRRI။',
    author: 'မြန်မာ့စိုက်ပျိုးရေးလုပ်ငန်း · IRRI',
    tags: ['rice', 'fertilizer', 'NPK', 'IRRI', 'nutrient', 'Myanmar'],
    fileUrl: '/knowledge/d_agr2_0001.pdf',
    coverUrl: '/knowledge/d_agr2_0001-cover.png',
    views: 70,
  }),
  book({
    title: 'သဘာဝမြေဩဇာ ပြုလုပ်သုံးစွဲနည်း',
    description:
      'PC Myanmar ထုတ်၊ ENI Foundation အထောက်အပံ့။ မြေဆွေးနှင့် သဘာဝမြေဩဇာ ပြုလုပ်နည်း၊ သုံးစွဲနည်းကို တောင်သူလက်တွေ့အတွက် ဓာတ်ပုံနှင့် ရှင်းပြသည်။\n\nHow to make and apply natural fertilizer and compost. Published by PC Myanmar with ENI Foundation support.',
    content:
      'သဘာဝမြေဩဇာ ပြုလုပ်သုံးစွဲနည်း — မြေဆွေးပြင်ဆင်ခြင်း၊ သုံးစွဲချိန်နှင့် မြေကျန်းမာရေး။ ထုတ်ဝေ — Progetto Continenti / PC Myanmar။',
    author: 'PC Myanmar · ENI Foundation',
    tags: ['organic', 'fertilizer', 'မြေဩဇာ', 'compost', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/d_agr2_0005.pdf',
    coverUrl: '/knowledge/d_agr2_0005-cover.png',
  }),
  book({
    title:
      'စပါးတွင်ကျရောက်သော အဓိက လိပ်ပြာမျိုးရင်းဝင် ဖျက်ပိုးများကို ဇီဝနည်းဖြင့် ကာကွယ်နှိမ်နင်းရန် ထရိုင်ဂိုဂရားမား ဥကပ်ပါးကောင် အသုံးပြုခြင်း',
    description:
      'Trichogramma ဥကပ်ပါးကောင်ဖြင့် စပါးပိုး (လိပ်ပြာမျိုးရင်း) ကို ဇီဝနှိမ်နင်းခြင်း လက်ကမ်းစာစောင်။ ပန်းပွင့်အကာစိုက်၍ အကျိုးပြုပိုး ထိန်းသိမ်းရန်နှင့် ကွင်းဆက်လယ်များ ပူးပေါင်းလွှတ်ရန် ညွှန်ကြားသည်။ EuropeAid / CABI / IRRI / သီးနှံကာကွယ်ရေးဌာနခွဲ။\n\nBrochure on Trichogramma egg parasitoids for lepidopteran rice pests, with ecological engineering of flowering borders.',
    content:
      'Trichogramma ကို စပါးခင်းတွင် လွှတ်၍ ဥကပ်ပါးကောင်ဖြင့် ဖျက်ပိုးနှိမ်နင်းခြင်း။ ပန်းပွင့်ကြာရှည်သီးနှံများကို ဘေးကွင်းတွင် စိုက်ပါ။ အိမ်နီးချင်းလယ်များ အတူလွှတ်မှ ပိုထိရောက်သည်။',
    author: 'သီးနှံကာကွယ်ရေးဌာနခွဲ · CABI · IRRI · EuropeAid',
    tags: ['rice', 'IPM', 'Trichogramma', 'pest', 'biological-control', 'Myanmar'],
    fileUrl: '/knowledge/d_agr3_0014.pdf',
    coverUrl: '/knowledge/d_agr3_0014-cover.png',
  }),
  book({
    title: 'စပါးစိုက်ပျိုးနည်းလမ်းညွှန် — မျိုးရွေးချယ်ခြင်းမှ မြေဩဇာကျွေးခြင်း',
    description:
      'စပါးစိုက်ပျိုးရေး အဆင့် ၅ ဆင့် လက်ကမ်းစာစောင် — သင့်တော်သောမျိုးရွေးခြင်း၊ ပျိုးထောင်ပြင်ဆင်ခြင်း၊ စိုက်ခင်းမြေပြင်ခြင်း၊ ရွှေ့ပြောင်းစိုက်ပျိုးခြင်း၊ မြေဩဇာကျွေးခြင်း။ မျိုးဇယားနှင့် ယူရီးယား/ပိုတက် ကျွေးနှုန်း ပါသည်။\n\nFive-step rice planting leaflet: variety choice, nursery, land prep, transplanting, and fertilizer tables.',
    content:
      '၁။ သင့်တော်သော စပါးမျိုးရွေးချယ်ခြင်း ၂။ ပျိုးထောင်ပြင်ဆင်ခြင်း ၃။ စိုက်ခင်းမြေပြင်ခြင်း ၄။ ရွှေ့ပြောင်းစိုက်ပျိုးခြင်း ၅။ မြေဩဇာကျွေးခြင်း။',
    author: 'စိုက်ပျိုးရေးဦးစီးဌာန',
    tags: ['rice', 'farming', 'fertilizer', 'transplanting', 'varieties', 'Myanmar'],
    fileUrl: '/knowledge/d_agr3_0019.pdf',
    coverUrl: '/knowledge/d_agr3_0019-cover.png',
  }),
  book({
    title: 'သဘာဝပိုးသတ်ဆေး — ဘော်ဒိုးအရောနှင့် ကြက်သွန်ဖြူဆေး',
    description:
      'ADB–GMS CASP 2 အထောက်အပံ့ဖြင့် စိုက်ပျိုးရေးဦးစီးဌာန ထုတ်သော သဘာဝပိုးသတ်/မှိုသတ်ဆေး လက်ကမ်း။ ဘော်ဒိုးအရော (ကြေးနီဆာလဖိတ် + ထုံး) နှင့် ကြက်သွန်ဖြူ+ရှလကာရည် ဆေးချက်နည်း၊ အချိုး၊ သတိထားချက်များ ပါသည်။\n\nNatural pesticide leaflet: Bordeaux mixture for blast/leaf spot and a garlic–vinegar spray recipe.',
    content:
      'ဘော်ဒိုးအရော — မှိုရောဂါ (ဂုတ်ကျိုး၊ အရွက်ပြောက်)။ သတ္တုပုံး မသုံးပါနှင့်။ ၂၄ နာရီအတွင်း သုံးပါ။ ကြက်သွန်ဖြူဆေး — ကြိတ်၍ ၇ ရက်စိမ်၊ ရေ ၁:၅၀၀ ဖျော်၍ ပက်ပါ။',
    author: 'စိုက်ပျိုးရေးဦးစီးဌာန · ADB-GMS-CASP 2',
    tags: ['organic', 'pesticide', 'Bordeaux', 'garlic', 'rice', 'Myanmar'],
    fileUrl: '/knowledge/d_agr3_0020.pdf',
    coverUrl: '/knowledge/d_agr3_0020-cover.png',
  }),
  book({
    title: 'စပါးသီးနှံတွင်ကျရောက်သော ပိုးမွှားများနှင့် ကာကွယ်နှိမ်နင်းနည်းများ',
    description:
      'စပါးဖျက်ပိုး အဓိကမျိုးစိတ်များ — ပုတ်ညို၊ တပ်ပိုး၊ နှံကျိ၊ သရစ်၊ ဖက်ထုပ်ပိုး၊ မှိုယင်၊ ဆစ်ပိုး၊ ဟစ္စပါ — ဘဝစက်ဝန်း၊ ထိခိုက်လက္ခဏာနှင့် ဆေးဇယားပါသော လမ်းညွှန်။\n\nField sheet of major rice pests (BPH, armyworm, stemborer, hispa, and others) with life cycles and control tables.',
    content:
      'အကျုံးဝင်ပိုးများ — Brown planthopper, armyworm, rice ear bug, thrips, caseworm, gall midge, yellow stemborer, rice hispa။ တစ်ပိုးချင်း လက္ခဏာ၊ ဘဝစက်ဝန်း၊ ကာကွယ်နှိမ်နင်းနည်း။',
    author: 'သီးနှံကာကွယ်ရေးဌာနခွဲ',
    tags: ['rice', 'pest', 'IPM', 'BPH', 'stemborer', 'Myanmar'],
    fileUrl: '/knowledge/elb-pp-000002.pdf',
    coverUrl: '/knowledge/elb-pp-000002-cover.png',
  }),
  book({
    title: 'စပါးဖျက်ပိုးများ စစ်တမ်းကောက်ယူခြင်း (လက်စွဲ)',
    description:
      'ဒေါက်တာကိုကို (စိုက်ပျိုးရေး) ရေး၊ သီးနှံကာကွယ်ရေးဌာနခွဲ ထုတ်သော စပါးဖျက်ပိုး စစ်တမ်းကောက်ယူနည်း လက်စွဲ။ ကွင်းဆင်းစစ်ဆေးသူများအတွက် ပိုးမှတ်တမ်းနှင့် စောင့်ကြည့်နည်း။\n\nHandbook by Dr. Ko Ko (Agriculture) on how to survey rice pests in the field.',
    content:
      'စပါးဖျက်ပိုး စစ်တမ်းကောက်ယူခြင်း — ကွင်းဆင်းကြည့်ရှုနည်း၊ မှတ်တမ်းတင်နည်း၊ ပုတ်ညိုနှင့် ဖလံပိုး အပါအဝင် အဓိကပိုးများ။ ထုတ်ဝေ — လယ်ယာစိုက်ပျိုးရေးနှင့် ဆည်မြောင်းဝန်ကြီးဌာန၊ စိုက်ပျိုးရေးဦးစီးဌာန၊ သီးနှံကာကွယ်ရေးဌာနခွဲ။',
    author: 'ဒေါက်တာကိုကို · သီးနှံကာကွယ်ရေးဌာနခွဲ',
    tags: ['rice', 'pest', 'survey', 'IPM', 'Myanmar', 'DOA'],
    fileUrl: '/knowledge/elb-pp-000006.pdf',
    coverUrl: '/knowledge/elb-pp-000006-cover.png',
    views: 58,
  }),
  book({
    title: 'စပါးသီးနှံတွင် ကျရောက်တတ်သော ပိုးမွှားရောဂါနှင့် ကာကွယ်နှိမ်နင်းနည်းများ',
    description:
      'သီးနှံကာကွယ်ရေးဌာနခွဲ အကြီးအကဲ ဦးသန်းအေးနှင့် ဒေါ်ဖြူဖြူလွင်၊ ဒေါ်မြင့်နုသွင်၊ ဦးအောင်ဆွေတို့ ရေးသားသော စပါးပိုးမွှားနှင့် ရောဂါ လမ်းညွှန် (မြန်မာ့စိုက်ပျိုးရေးလုပ်ငန်း)။ မှန်ကန်သော ဖော်ထုတ်မှုနှင့် ထိန်းချုပ်မှုကို အလေးပေးသည်။\n\nMyanma Agriculture Service plant-protection book on rice pests and diseases, compiled by Daw Phyu Phyu Lwin, Daw Myint Nu Thwin, U Aung Swe and others under Than Aye.',
    content:
      'အမှာစာ — စပါးသည် တစ်နိုင်ငံလုံး စိုက်ဧရိယာ၏ ၅၀ ရာခိုင်နှုန်းခန့် ရှိသဖြင့် ပိုးမွှားရောဂါကို မှန်ကန်စွာ ဖော်ထုတ်ကာကွယ်ရန် အရေးကြီးသည်။ Plant Protection Division, Myanma Agriculture Service။',
    author: 'သီးနှံကာကွယ်ရေးဌာနခွဲ · ဦးသန်းအေးနှင့်အဖွဲ့',
    tags: ['rice', 'pest', 'disease', 'IPM', 'Myanmar', 'DOA'],
    fileUrl: '/knowledge/elb-pp-000011.pdf',
    coverUrl: '/knowledge/elb-pp-000011-cover.png',
    views: 88,
  }),
  book({
    title: 'စပါးသီးနှံကာကွယ်ရေးနှင့် အထွက်တိုးရေးနည်းလမ်းများ',
    description:
      'Proximity Designs / LIFT FAS လမ်းညွှန် စာအုပ် (ဒုတိယအကြိမ်)။ စပါးပိုးမွှားရောဂါ ကာကွယ်ရေးနှင့် အထွက်တိုးနည်းများကို တောင်သူဘာသာစကားဖြင့် ရေးသားသည်။\n\nProximity Designs Field Advisory Service guidebook (2nd edition, with LIFT) on rice crop protection and yield improvement.',
    content:
      'စပါးသီးနှံကာကွယ်ရေးနှင့် အထွက်တိုးရေး — ကွင်းဆင်းအကြံပေး (FAS) အတွက် လက်စွဲ။ ထုတ်ဝေ — Proximity Designs၊ LIFT အထောက်အပံ့။',
    author: 'Proximity Designs · LIFT',
    tags: ['rice', 'IPM', 'yield', 'Proximity', 'LIFT', 'Myanmar'],
    fileUrl: '/knowledge/fas-guide-book-2nd-with-lift-1-from-proximity-designs.pdf',
    coverUrl: '/knowledge/fas-guide-book-2nd-with-lift-1-from-proximity-designs-cover.png',
    views: 74,
  }),
  book({
    title: 'ဓာတ်မြေဩဇာနှင့် အာဟာရ စီမံခန့်ခွဲမှု (စပါး)',
    description:
      'Agriculture Cluster Myanmar လက်စွဲ အခန်း ၂၇ — စပါးအတွက် ဓာတ်မြေဩဇာနှင့် အပင်အာဟာရ စီမံခန့်ခွဲခြင်း။ myanmar.humanitarianinfo.org မှ ကူးယူဖော်ပြသည်။\n\nRice fertilizer and nutrient management chapter from the Agriculture Cluster Myanmar library.',
    content:
      'ဓာတ်မြေဩဇာကို မှန်ကန်စွာ သုံးမှ တောင်သူ အထွက်ရသည်။ လိုအပ်သော အာဟာရကို မြေက မပေးနိုင်လျှင် ဓာတ်မြေဩဇာဖြင့် ဖြည့်ရသည်။ အော်ဂဲနစ်မြေဆွေး၊ သီးနှံအကြွင်းအကျန်နှင့် တွဲသုံးရန်။',
    author: 'Agriculture Cluster Myanmar',
    tags: ['rice', 'fertilizer', 'nutrient', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/fertilizer-and-nutrient-management.pdf',
    coverUrl: '/knowledge/fertilizer-and-nutrient-management-cover.png',
  }),
  book({
    title: 'မဟာမဲခေါင်ဒေသခွဲ စပါးဘက်စုံပိုးမွှားကာကွယ်နှိမ်နင်းရေးနည်းပညာ လမ်းညွှန်ချက်များ',
    description:
      'EuropeAid Rice IPM in the Greater Mekong Subregion (DCI-Food/2010/230-238) နည်းပညာလမ်းညွှန်။ CABI နှင့် သီးနှံကာကွယ်ရေးဌာနခွဲ ပူးတွဲ။ စပါး IPM ကို မြန်မာဘာသာဖြင့် ညွှန်ကြားသည်။\n\nGMS rice IPM technical guidelines (EuropeAid / CABI / Plant Protection Division).',
    content:
      'Greater Mekong Subregion စပါး IPM လမ်းညွှန် — ပိုးကို မှန်ကန်စွာ ဖော်ထုတ်ပြီး ဘက်စုံကာကွယ်နှိမ်နင်းရန်။ စီမံကိန်း EuropeAid DCI-Food/2010/230-238။',
    author: 'EuropeAid · CABI · သီးနှံကာကွယ်ရေးဌာနခွဲ',
    tags: ['rice', 'IPM', 'GMS', 'CABI', 'pest', 'Myanmar'],
    fileUrl: '/knowledge/gms-paddy-ipm-guideline.pdf',
    coverUrl: '/knowledge/gms-paddy-ipm-guideline-cover.png',
  }),
  book({
    title: 'ဘက်စုံပိုးမွှားကာကွယ်ခြင်းနှင့် အပင်အာဟာရအကြောင်း အပိုင်း (၁)',
    description:
      'PC Myanmar ထုတ်၊ ENI Foundation အထောက်အပံ့။ ဘက်စုံပိုးမွှားကာကွယ်ရေး (IPM) နှင့် အပင်အာဟာရ အပိုင်း ၁။\n\nIPM and plant nutrition, Part 1. Published by PC Myanmar with ENI Foundation support.',
    content:
      'ဘက်စုံပိုးမွှားကာကွယ်ခြင်းနှင့် အပင်အာဟာရ — အပိုင်း ၁။ ထုတ်ဝေ — Progetto Continenti / PC Myanmar။',
    author: 'PC Myanmar · ENI Foundation',
    tags: ['IPM', 'nutrition', 'pest', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/ipm-2.pdf',
    coverUrl: '/knowledge/ipm-2-cover.png',
  }),
  book({
    title: 'ဘက်စုံပိုးမွှားကာကွယ်ခြင်းနှင့် အပင်အာဟာရအကြောင်း အပိုင်း (၂)',
    description:
      'PC Myanmar ထုတ်၊ ENI Foundation အထောက်အပံ့။ IPM နှင့် အပင်အာဟာရ အပိုင်း ၂ — အပိုင်း ၁ ၏ ဆက်တွဲ။\n\nIPM and plant nutrition, Part 2. Published by PC Myanmar with ENI Foundation support.',
    content:
      'ဘက်စုံပိုးမွှားကာကွယ်ခြင်းနှင့် အပင်အာဟာရ — အပိုင်း ၂။ ထုတ်ဝေ — Progetto Continenti / PC Myanmar။',
    author: 'PC Myanmar · ENI Foundation',
    tags: ['IPM', 'nutrition', 'pest', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/ipm-1.pdf',
    coverUrl: '/knowledge/ipm-1-cover.png',
  }),
  book({
    title: 'ရေသွင်းနည်းအမျိုးမျိုးနှင့် အစက်ချရေသွင်းစနစ်အကြောင်း',
    description:
      'PC Myanmar ထုတ်၊ ENI Foundation အထောက်အပံ့။ ရေသွင်းနည်းအမျိုးမျိုးနှင့် အစက်ချ (drip) စနစ်ကို တောင်သူအတွက် ရှင်းပြသော လက်စွဲ။\n\nGuide to irrigation methods with a focus on drip irrigation. PC Myanmar / ENI Foundation.',
    content:
      'ရေသွင်းနည်းအမျိုးမျိုး — အစက်ချရေသွင်းစနစ်၏ အကျိုး၊ တပ်ဆင်ပုံနှင့် ရေချွေတာပုံ။ ထုတ်ဝေ — Progetto Continenti / PC Myanmar။',
    author: 'PC Myanmar · ENI Foundation',
    tags: ['irrigation', 'drip', 'water', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/micro-irrigation-drip-irrigation.pdf',
    coverUrl: '/knowledge/micro-irrigation-drip-irrigation-cover.png',
  }),
  book({
    title: 'အထွက်ကောင်း စပါး — မျိုးများ၏ အရည်အသွေး လက္ခဏာများ',
    description:
      'စိုက်ပျိုးရေးဦးစီးဌာန ထုတ် အထွက်ကောင်းစပါးမျိုး ဇယား။ ဆင်းကရီ၊ သီးထပ်၊ မဟူရီ စသည့် မျိုးအမည်၊ မျိုးနံပါတ်၊ ထုတ်သည့်နှစ်၊ အသက်ရက်၊ အပင်မြင့်၊ အနှံအရေအတွက်၊ ဆန်ထွက်ရာခိုင်နှုန်းနှင့် စားသုံးမှုအရသာ ပါသည်။\n\nDepartment of Agriculture variety catalogue: quality traits of high-yielding Myanmar rice (Sin Kari, Thee Htat, Mahsuri, and others).',
    content:
      'အထွက်ကောင်းမျိုးများ-၁/၂ — ဆင်းကရီ ၁–၄၊ သီးထပ် ၁–၃၊ ရေထွန်း၊ စန္ဒလေး၊ မနေသုခ၊ မဟူရီ။ ကော်လံများ — မျိုးအမည်၊ မျိုးနံပါတ်၊ မူရင်း၊ ထုတ်နှစ်၊ အသက်ရက်၊ အပင်မြင့်၊ အနှံ၊ အစေ့ ၁၀၀၀ အလေးချိန်၊ ဆန်ထွက်နှုန်း၊ အမိုင်လို့စ်။',
    author: 'စိုက်ပျိုးရေးဦးစီးဌာန',
    tags: ['rice', 'varieties', 'စပါးမျိုး', 'yield', 'Myanmar', 'DOA'],
    fileUrl: '/knowledge/paddy-book.pdf',
    coverUrl: '/knowledge/paddy-book-cover.png',
    views: 90,
  }),
  book({
    title: 'ရေချိုရေငန်နှင့် ရေငန်ဝင်ဒေသအချို့တွင် စပါးသီးထပ်စိုက်ပျိုးခြင်း',
    description:
      'မျိုးမြင့် / Proximity Designs (၂၀၁၄)။ ရေချို–ရေငန်ဒေသတွင် စပါးသီးထပ် မအောင်မြင်ခဲ့သော အကြောင်းရင်းနှင့် သက်တမ်းတိုမျိုး၊ မြန်မာပြက္ခဒိန်အစား ရေချိုရရှိချိန်ကို တိုင်းတာ၍ စိုက်ရန် နည်းဗျူဟာ။ LIFT စီမံကိန်းနှင့် ဆက်စပ်သည်။\n\nMyo Myint / Proximity Designs note on double-cropping rice in freshwater and saline-intrusion zones using short-duration varieties.',
    content:
      'နိဒါန်း — ရေငန်ဝင်ချိန်ကို မြန်မာပြက္ခဒိန်နှင့် မတွက်နိုင်၍ သီးထပ်မအောင်မြင်ခဲ့။ လိုအပ်ချက် — ရေချိုရရှိသည့် လုံခြုံကာလကို သိရန်၊ သက်တမ်းတိုစပါးကို ထိုကာလအတွင်း စမ်းသပ်စိုက်ရန်။',
    author: 'မျိုးမြင့် · Proximity Designs',
    tags: ['rice', 'saline', 'double-cropping', 'သီးထပ်', 'Proximity', 'Myanmar'],
    fileUrl: '/knowledge/proximity-dc_mm.pdf',
    coverUrl: '/knowledge/proximity-dc_mm-cover.png',
  }),
  book({
    title: 'ပိုးသတ်ဆေး ဘေးကင်းစွာ သုံးစွဲနည်း လက်စွဲ',
    description:
      'Winrock International ထုတ်၊ USAID အထောက်အပံ့။ ပိုးသတ်ဆေး အမျိုးအစား၊ အညွှန်းဖတ်နည်း၊ မှားသုံးပါက ကျန်းမာရေးနှင့် ပတ်ဝန်းကျင်ထိခိုက်မှု၊ ဆေးမှားရွေး၍ ငွေရှုံးမှုကို တောင်သူနားလည်အောင် ရေးသားသော မြန်မာဘာသာ လက်စွဲ။\n\nUSAID / Winrock handbook on safe pesticide use: labels, health, environment, and choosing the right product.',
    content:
      'ရည်ရွယ်ချက် — ပိုးသတ်ဆေးသဘာဝကို နားလည်ရန်၊ အညွှန်းအတိုင်း သုံးရန်၊ မှားသုံးသောအခါ အန္တရာယ်နှင့် ငွေရှုံးမှုကို သိရန်။ အကြောင်းအရာသည် Winrock International ၏ တာဝန်ဖြစ်ပြီး USAID အမြင် မဟုတ်နိုင်ပါ။',
    author: 'Winrock International · USAID',
    tags: ['pesticide', 'safety', 'IPM', 'farming', 'Myanmar'],
    fileUrl: '/knowledge/safe-use-of-pesticide-myanmar-language.pdf',
    coverUrl: '/knowledge/safe-use-of-pesticide-myanmar-language-cover.png',
  }),
  book({
    title:
      'နွေရာသီ အန္တရာယ်ကြီး သီးနှံများတွင် ကျရောက်တတ်သော ဖျက်ပိုးများနှင့် ကြိုတင်ကာကွယ်နှိမ်နင်းနည်းလမ်းများ',
    description:
      '၂၀၂၆ နွေရာသီ သတိပေးလမ်းညွှန်။ စပါး ဆစ်ပိုး၊ ပုတ်ညို၊ ပုတ်ကျောဖြူနှင့် အခြားသီးနှံပိုးများအတွက် ကြိုတင်ကာကွယ်နည်း၊ ခံနိုင်ရည်ရှိမျိုး (ဆင်းသုခ၊ ရတနာတိုး)၊ Trichogramma၊ နှင့် ဆေးအမည်များ ပါသည်။\n\n2026 summer-season pest warning: yellow stemborer, brown planthopper, and control steps including resistant varieties and IPM sprays.',
    content:
      'စပါး — ၁။ ဆစ်ပိုး (Yellow stemborer) ၂။ ပုတ်ညို (Brown planthopper) ၃။ ပုတ်ကျောဖြူ (White-backed planthopper)။ ရိုးပြတ်ရှို့ခြင်း၊ ထယ်ထိုးရေသွင်းခြင်း၊ Cartap 4G၊ ခံနိုင်ရည်ရှိမျိုး၊ Trichogramma၊ Flubendiamide / Chlorantraniliprole / Fipronil။',
    author: 'စိုက်ပျိုးရေးဦးစီးဌာန',
    tags: ['rice', 'pest', 'summer', 'stemborer', 'BPH', 'Myanmar', '2026'],
    fileUrl: '/knowledge/summerwarning2026.pdf',
    coverUrl: '/knowledge/summerwarning2026-cover.png',
    views: 66,
  }),
  book({
    title: 'ရေရှည်တည်တံ့သော စပါးစိုက်ပျိုးထုတ်လုပ်မှု — Sustainable Rice Platform (Version 2)',
    description:
      'Sustainable Rice Platform စံသတ်မှတ်ချက် ဗားရှင်း ၂။ အထွက်နှင့် အကျိုးအမြတ်၊ စားသောက်ကုန်ဘေးကင်းမှု၊ ရေ/အာဟာရ/ပိုးသတ်ဆေး၊ ဇီဝမျိုးစိတ်၊ လူမှုပတ်ဝန်းကျင်၊ ဖန်လုံအိမ်ဓာတ်ငွေ့နှင့် အလုပ်သမားအခွင့်အရေးတို့ကို တောင်သူဘာသာဖြင့် ချိတ်ဆက်ရှင်းပြသည်။\n\nSRP Version 2 standard requirements and indicators for sustainable rice, prepared with Ye Win Paing.',
    content:
      'SRP စံသတ်မှတ်ချက်များ — အကျိုးအမြတ်နှင့် အထွက်၊ အစားအစာဘေးကင်းမှု၊ ရေ အာဟာရ ပိုးသတ်ဆေး၊ ဇီဝမျိုးစိတ်၊ လူပတ်ဝန်းကျင်၊ ဖန်လုံအိမ်ဓာတ်ငွေ့၊ ကျန်းမာရေးနှင့် အလုပ်သမားအခွင့်အရေး။ www.sustainablerice.org',
    author: 'Sustainable Rice Platform · Ye Win Paing',
    tags: ['rice', 'SRP', 'sustainable', 'climate', 'Myanmar'],
    fileUrl: '/knowledge/sustainable-rice-platform-version-2.pdf',
    coverUrl: '/knowledge/sustainable-rice-platform-version-2-cover.png',
    views: 52,
  }),
  book({
    title: 'ရေရှည်တည်တံ့သော စပါးစိုက်ပျိုးရေး — တောင်သူသင်တန်း',
    description:
      'SRP တောင်သူသင်တန်း ပစ္စည်း။ ဆန်အထွက်များအောင် စိုက်ပျိုးမြေချဲ့ခြင်း၊ ပိုးသတ်ဆေးပိုသုံးခြင်း၊ မြေဩဇာပိုကျွေးခြင်း၊ ရေပိုသုံးခြင်းထက် ပိုမိုကောင်းသော နည်းလမ်းများကို ဆွေးနွေးသည်။\n\nSRP farmer-training slides: how to raise rice yield without only more land, pesticide, fertilizer, or water.',
    content:
      'ဆန်အထွက်များအောင် ဘယ်လိုစိုက်သင့်သလဲ — စိုက်ပျိုးမြေချဲ့မလား၊ ပိုးသတ်ဆေးပိုသုံးမလား၊ မြေဩဇာပိုကျွေးမလား၊ ရေပိုသုံးမလား။ SRP သင်တန်းက အလေ့အကျင့်မှန်များကို ပြသည်။',
    author: 'Sustainable Rice Platform',
    tags: ['rice', 'SRP', 'training', 'yield', 'sustainable', 'Myanmar'],
    fileUrl: '/knowledge/sustainable-rice-platform_training_farmers.pdf',
    coverUrl: '/knowledge/sustainable-rice-platform_training_farmers-cover.png',
  }),
];
