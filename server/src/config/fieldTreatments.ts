/**
 * Field treatment protocols from DOA Myanmar guides:
 * cotton.docx, Pea.docx, sesame&sunflower&groundnut.docx, pepper.docx
 * Keys are English detect labels (disease / pest). Values are Myanmar treatment text.
 * Crop-specific overrides use "Crop:Label" (e.g. Chili:Powdery Mildew).
 */
export const FIELD_TREATMENTS_MY: Record<string, string> = {
  // —— Cotton pests ——
  'American Bollworm':
    'နွေထွန်ရေးခံပါ။ အတန်း (၅-၆) တိုင်း ပဲစင်းငုံ သီးညှပ်စိုက်ပါ။ တစ်ဧက အလင်းထောင်ချောက် (၁) ခုနှင့် ဖီရိုမုန်းထောင်ချောက် (၂) ခု ထောင်ပါ။ Trichogramma လွှတ်ပေးပြီး သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ လိုအပ်မှ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  Bollworm:
    'နွေထွန်ရေးခံပါ။ အတန်း (၅-၆) တိုင်း ပဲစင်းငုံ သီးညှပ်စိုက်ပါ။ တစ်ဧက အလင်းထောင်ချောက် (၁) ခုနှင့် ဖီရိုမုန်းထောင်ချောက် (၂) ခု ထောင်ပါ။ Trichogramma လွှတ်ပေးပြီး သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ လိုအပ်မှ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Pink Bollworm':
    'နွေထွန်ရေးခံပါ။ တစ်ဧက အလင်းထောင်ချောက် (၁) ခုနှင့် ဖီရိုမုန်းထောင်ချောက် (၂) ခု ထောင်ပါ။ Trichogramma လွှတ်ပေးပါ။ သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ လိုအပ်မှ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ဖျန်းပါ။',
  'Spiny Bollworm':
    'ပေါင်းရှင်းပါ။ စိုက်ခင်း ပုံမှန်စစ်ဆေးပါ။ ထယ်နက်နက်ထွန်ပါ။ ပိုးကျခင်း ရေလွှမ်းနိုင်ပါက လွှမ်းပါ။ လက်ဖြင့် ကောက်ဖျက်ပါ။ Bacillus thuringiensis သုံးနိုင်သည်။ တမာဆေး ရေ ၂၀ လီတာတွင် ၃၀၀ စီစီ ဖျော်ဖျန်းပါ။ မြေပြင်ချိန် Fipronil 3GR / Carbosulfan 5G ထည့်ပါ။ Lambda-cyhalothrin, Acephate, Chlorantraniliprole ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Spotted Bollworm':
    'ပေါင်းရှင်းပါ။ စိုက်ခင်း ပုံမှန်စစ်ဆေးပါ။ ထယ်နက်နက်ထွန်ပါ။ လက်ဖြင့် ကောက်ဖျက်ပါ။ Bacillus thuringiensis သုံးနိုင်သည်။ Lambda-cyhalothrin, Acephate, Chlorantraniliprole ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Red Cotton Bug':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပုံမှန် ကင်းထောက်ပါ။ သဘာဝပိုးသတ်ဆေး သုံးနိုင်သည်။ လိုအပ်မှ Dimethoate, Fipronil, Carbosulfan, Acetamiprid ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Dusky Cotton Bug':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပုံမှန် ကင်းထောက်ပါ။ လိုအပ်မှ Dimethoate, Fipronil, Carbosulfan, Acetamiprid ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  Cutworm:
    'ပေါင်းရှင်းပါ။ စိုက်ခင်း ပုံမှန်စစ်ဆေးပါ။ ထယ်နက်နက်ထွန်ပါ။ ပိုးကျခင်း ရေလွှမ်းနိုင်ပါက လွှမ်းပါ။ လက်ဖြင့် ကောက်ဖျက်ပါ။ အလင်းထောင်ချောက် သုံးပါ။ တမာဆေး ရေ ၂၀ လီတာတွင် ၃၀၀ စီစီ ဖျော်ဖျန်းပါ။ မြေပြင်ချိန် Fipronil 3GR / Carbosulfan 5G ထည့်ပါ။ Lambda-cyhalothrin, Acephate, Cypermethrin ကို တံဆိပ်အတိုင်း သုံးပါ။',
  Aphids:
    'ပေါင်းရှင်းပါ။ ခံနိုင်ရည်ရှိမျိုး ရွေးပါ။ အဝါရောင်ထောင်ချောက် သုံးပါ။ မစိုက်မီ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ လိုအပ်မှ Dimethoate, Fipronil, Carbosulfan, Acetamiprid / Imidacloprid, Acephate ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  Whitefly:
    'ပင်ကြွင်း မီးရှို့ပါ။ ပေါင်းရှင်းပါ။ သီးလှည့်စိုက်ပါ။ ထယ်နက်နက်ထွန်ပါ။ မြေပြင်ချိန် Fipronil 3GR / Carbosulfan 5G ထည့်ပါ။ စိတ်စိတ်မစိုက်ရ။ တမာ/ဆေးရွက်ကြီး သဘာဝဆေးကို ဦးစားပေးပါ။ လိုအပ်မှ Dimethoate, Dinotefuran, Pymetrozine, Spiromesifen, Spirotetramat ဖျန်းပါ။',
  Thrips:
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ရေမှန်မှန်သွင်းပါ။ အပြာရောင်ထောင်ချောက် သုံးပါ။ သဘာဝရန်သူ ထိန်းသိမ်းပါ။ လိုအပ်မှ Dimethoate, Thiamethoxam, Spirotetramat, Chlorfenapyr / Dinotefuran ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  Jassid:
    'မစိုက်မီ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ ပေါင်းရှင်းပါ။ အဝါရောင်ထောင်ချောက် သုံးပါ။ လိုအပ်မှ Dimethoate, Dinotefuran, Acetamiprid, Fipronil, Buprofezin ဖျန်းပါ။',
  'Cotton Stem Weevil':
    'ပိုးကျပင် မီးရှို့ပါ။ ဝါ တစ်မျိုးတည်း ဆက်မစိုက်ပါနှင့်။ မြေပြင်ချိန် တမာကြိတ်ဖတ် ထည့်ပါ။ ပင်ပေါက် ၁၅–၂၀ ရက်မှ တမာစေ့ဆီ ၁% ကို ၁၅ ရက်တစ်ကြိမ် ဖျန်းပါ။ Fipronil 3GR မြေဆွထည့်ပါ။ Lambda-Cyhalothrin, Dimethoate, Dinotefuran ကို တံဆိပ်အတိုင်း သုံးပါ။',
  Mealybug:
    'ပိုးကျအကိုင်း ဖြတ်မီးရှို့ပါ။ ထိဆက်ကိုင်းများ ရှင်းပါ။ သဘာဝရန်သူ ထိန်းသိမ်းပါ။ ဆိုးရွားမှ Dimethoate, Spirotetramat, Acetamiprid, Carbaryl, Buprofezin, Bifenthrin ကို တံဆိပ်အတိုင်း ဖျန်းပါ (သို့ mineral oil ရောဖျန်း)။',
  'Leaf Roller':
    'လောက်ကောင်ငယ်တွင် Bacillus thuringiensis သုံးပါ။ လိုအပ်မှ Lambda-cyhalothrin, Acephate, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Tobacco Caterpillar':
    'ဥ/ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ မီးထောင်ချောက် ထွန်းပါ။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။ စားသုံးချိန်နီးက ဓာတုဆေး ရှောင်ပြီး တမာ/ဆေးရွက်ကြီး သုံးပါ။',

  // —— Cotton diseases ——
  'Damping Off':
    'ရေမဝပ်စေရန်၊ မြေမကျပ်စေရန် ထိန်းပါ။ ရောဂါကျပါက Azoxystrobin, Fosetyl-Al, Metalaxyl, Thiophanate-methyl, Hymexazol, Validamycin တို့ဖြင့် ပင်ခြေ ဆွဲဖျန်းပါ။',
  'Cercospora Leaf Spot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ ရောဂါကင်းမျိုးစေ့ သုံးပါ။ Chlorothalonil, Difenoconazole, Mancozeb, Azoxystrobin, Copper Hydroxide, Thiophanate-methyl, Hexaconazole, Propiconazole တို့ဖြင့် ဖျန်းပါ။',
  'Fusarium Wilt':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ နွေထယ်ရေးခံပါ။ သီးလှည့်စိုက်ပါ။ မျိုးစေ့လူးနယ်မှိုသတ်ဆေး သုံးပါ။ ပင်ခြေတွင် ဒိုလိုမိုက် ထည့်နိုင်သည်။ Azoxystrobin, Hymexazol, Thiophanate-methyl ကို ပင်ခြေ ဆွဲဖျန်းပါ။',
  'Verticillium Wilt':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ မျိုးစေ့လူးနယ်မှိုသတ်ဆေး သုံးပါ။ Azoxystrobin, Hymexazol, Thiophanate-methyl ကို ပင်ခြေ ဆွဲဖျန်းပါ။',
  'Root Rot':
    'ခံနိုင်ရည်ရှိမျိုးနှင့် ရောဂါကင်းမျိုးစေ့ သုံးပါ။ နွေထယ်ရေးခံပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Trichoderma မြေထည့်နိုင်သည်။ သီးလှည့် (၃–၄ နှစ်) လုပ်ပါ။ Thiophanate-methyl, Tebuconazole, Propiconazole, Validamycin, Captan, Hymexazol ကို ပင်ခြေ ဖျန်းပါ။',
  'Bacterial Blight':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Copper ပါဆေး၊ Bismerthiazol, Kasugamycin တို့ဖြင့် ဖျန်းပါ။',
  Anthracnose:
    'ရောဂါကင်းမျိုးစေ့ သုံးပါ။ လိုအပ်ပါက မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ ပဲမဟုတ်သော သီးနှံနှင့် ၂–၃ နှစ် သီးလှည့်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Azoxystrobin, Captan, Hexaconazole, Chlorothalonil, Carbendazim, Thiophanate-methyl, Tebuconazole, Propiconazole, Difenoconazole တို့ဖြင့် ဖျန်းပါ။',
  'Cotton Leaf Curl Virus':
    'ဗိုင်းရပ်စ်သယ်ပိုး (ယင်ဖြူ) ကို ထိန်းချုပ်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ ပေါင်းရှင်းပါ။ သီးလှည့်စိုက်ပါ။ ခံနိုင်ရည်ရှိမျိုး ရွေးပါ။ ယင်ဖြူအတွက် Dimethoate, Dinotefuran, Pymetrozine, Spirotetramat တို့ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Alternaria Leaf Spot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ သီးလှည့်စိုက်ပါ။ ရေမဝပ်စေရန် ထိန်းပါ။ ပင်ကြွင်း ဖျက်ပါ။ Myclobutanil, Mancozeb, Iprodione, Chlorothalonil, Thiophanate-methyl, Tebuconazole တို့ဖြင့် ဖျန်းပါ။',
  'Grey Mildew':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Hexaconazole, Tebuconazole, Difenoconazole, Sulfur ပါဆေးတို့ဖြင့် ဖျန်းပါ။',
  'Areolate Mildew':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Hexaconazole, Tebuconazole, Difenoconazole, Sulfur ပါဆေးတို့ဖြင့် ဖျန်းပါ။',
  'Boll Rot':
    'ပင်ကြွင်း မီးရှို့ပါ။ ရေနှင့် အာဟာရ မျှတစွာ ထိန်းပါ။ Thiophanate-methyl, Chlorothalonil, Tebuconazole, Propiconazole, Difenoconazole တို့ဖြင့် ဖျန်းပါ။',
  'Stem Rot':
    'ပင်ကြွင်း မီးရှို့ပါ။ ရေငတ်မထားပါနှင့်။ ပိုတက်ရှ် ထည့်ပါ။ Thiophanate-methyl, Captan, Tebuconazole, Hymexazol, Difenoconazole ကို ပင်ခြေ ဖျန်းပါ။',
  'Crown Gall':
    'ဒဏ်ရာမရအောင် ဂရုစိုက်ပါ။ ရောဂါကျပင် ဖယ်ရှားပါ။ ကွင်းသန့်ရှင်းရေး လုပ်ပါ။ ဒေသခံ ကျွမ်းကျင်သူနှင့် တိုင်ပင်ပါ။',
  'Myrothecium Leaf Spot':
    'ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Mancozeb, Chlorothalonil, Difenoconazole, Propiconazole တို့ဖြင့် ဖျန်းပါ။',

  // —— Pulses (Black Gram / Green Gram / Pigeon Pea) pests ——
  'Blue Butterfly':
    'ဥနှင့် ပိုးလောက် ရှာဖျက်ပါ။ Cypermethrin, Chlorpyrifos, Diazinon ကဲ့သို့ ထိသေ/စားသေဆေး ဖျန်းပါ။ စားသုံးချိန်နီးက တမာဆေး သို့မဟုတ် ဆေးရွက်ကြီး+ဆပ်ပြာ ဖျော်ရည် သုံးပါ။',
  'Stem Fly':
    'ရောဂါ/ပိုးကျပင် နှုတ်မီးရှို့ပါ။ ပဲရိုင်းပင် မီးရှို့ပါ။ မြေပြင်ချိန် Diazinon 10G / Furadan 3G တစ်ဧက ၃–၆ ကီလို ထည့်ပါ။ True leaf ထွက်ချိန်မှ ပင်လုံးပြန့်ဆေး ဖျန်းပါ။',
  'Plume Moth':
    'ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ ဆိုးရွားမှ Lambda-Cyhalothrin, Chlorpyrifos ဖျန်းပါ။',
  'Hairy Caterpillar':
    'ဥအစု ဖျက်ပါ။ ပေါင်းရှင်းပါ။ Flubendiamide, Cypermethrin, Lambda-cyhalothrin, Chlorpyrifos, Diazinon တို့ဖြင့် ဖျန်းပါ။',
  'Red Hairy Caterpillar':
    'ဥအစု ဖျက်ပါ။ Flubendiamide, Cypermethrin, Lambda-cyhalothrin တို့ဖြင့် ဖျန်းပါ။',
  'Bihar Hairy Caterpillar':
    'ထယ်နက်နက်ထိုးပါ။ လက်ဖြင့် ကောက်ဖျက်ပါ။ ပိုးကျပင် နှုတ်ဖျက်ပါ။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ဖျန်းပါ။',
  'Pod Borer':
    'ဥ/ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ မီးထောင်ချောက် ထွန်းပါ။ ထောင်ချောက်သီးနှံ (ပြောင်း) စိုက်နိုင်သည်။ အပေါက်ရှိအတောင့် ခူးဖျက်ပါ။ မြေပြင်ချိန် Furadan 3G / Diazinon 10G တစ်ဧက ၃–၆ ကီလို ထည့်ပါ။ Acephate, Imidacloprid သို့မဟုတ် Cypermethrin, Chlorantraniliprole ကို နံနက်/ညနေ ဖျန်းပါ။ တမာဆေး အလှည့်ကျ သုံးပါ။',
  'Spotted Pod Borer':
    'ပိုးချည်မျှင်/အပေါက်ရှိအတောင့် ခူးဖျက်ပါ။ အညွန့်အဖူးဝင်ချိန်မှ ထိသေ/ပင်လုံးပြန့်ဆေး ဖျန်းပါ။ စားသုံးချိန်နီးက ဓာတုဆေး မဖျန်းရ၊ တမာဆေး သုံးပါ။',
  'Gram Pod Borer':
    'ဥ/ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ မီးထောင်ချောက် ထွန်းပါ။ မြေပြင်ချိန် Furadan 3G / Diazinon 10G ထည့်ပါ။ Acephate, Imidacloprid သို့မဟုတ် Cypermethrin, Flubendiamide ဖျန်းပါ။',
  'Bruchid Beetle':
    'ရိတ်သိမ်းချက်ချင်း လုပ်ပါ။ နေလှန်းပြီး လေလုံပုံး/အိတ်ဖြင့် သိုလှောင်ပါ။ စားသုံးဆီ လူးသိုလှောင်နိုင်သည်။ လိုအပ်မှ အဆိပ်ငွေ့မှိုင်းတိုက်ပါ။',
  'Leaf Hopper':
    'ပေါင်းရှင်းပါ။ သီးလှည့်စိုက်ပါ။ အဝါရောင်ထောင်ချောက် တစ်ဧက ၅–၁၀ ခု သုံးပါ။ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ Dimethoate, Acetamiprid, Dinotefuran ကို ရွက်အောက်မျက်နှာ ရောက်အောင် ဖျန်းပါ။',
  'Leaf Webber':
    'ပဲမျိုးရင်းပင်နှင့် ပေါင်း ရှင်းပါ။ မီးခိုးမှိုင်းတိုက်နိုင်သည်။ Flubendiamide, Fipronil, Thiamethoxam ဖျန်းပါ။',
  'Pod Fly':
    'ပိုးကျအတောင့် ဖယ်ပါ။ စိုက်ခင်းသန့်ရှင်းရေး လုပ်ပါ။ လိုအပ်မှ ပင်လုံးပြန့်/ထိသေဆေးကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Pod Bug':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပန်းပွင့်/အတောင့်ချိန် Cypermethrin, Chlorpyrifos ဖျန်းနိုင်သည်။ ထောင်ချောက်သီးနှံ စိုက်ပါ။',
  'Blister Beetle':
    'လက်ဖြင့် ကောက်ဖျက်ပါ။ ပေါင်းရှင်းပါ။ လိုအပ်မှ ထိသေဆေး (Cypermethrin စသည်) ဖျန်းပါ။',
  'Jewel Bug':
    'လက်ဖြင့် ကောက်ဖျက်ပါ။ လိုအပ်မှ ထိသေဆေး ဖျန်းပါ။',
  'White Grub':
    'နွေထယ်ရေးခံပါ။ မြေပြင်ချိန် Fipronil / Carbosulfan granule ထည့်ပါ။ ပေါင်းရှင်းပါ။',
  'Root-Knot Nematode':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ရောဂါကင်းခင်း ရွေးပါ။ ပြောင်း/နှမ်းစားပြောင်း သီးလှည့်ပါ။ နွေထယ်ရေးလှန်ပါ။ လိုအပ်မှ Furadan 3G တစ်ဧက ၁၅–၂၀ ပေါင် မြေခံထည့်ပါ။',
  'Leaf Miner':
    'ပိုးကျရွက် ဖယ်ပါ။ ပေါင်းရှင်းပါ။ လိုအပ်မှ ပင်လုံးပြန့်ဆေး ဖျန်းပါ။',
  Mites:
    'ပေါင်းရှင်းပါ။ ရေမှန်မှန်သွင်းပါ။ လိုအပ်မှ Spiromesifen / အဆီမပါသော အကာကွယ်ဆေးကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Red Spider Mite':
    'ပေါင်းရှင်းပါ။ ရေမှန်မှန်သွင်းပါ။ လိုအပ်မှ ပင့်ကူမှဲ့သတ်ဆေးကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Scale Insect':
    'ပိုးကျအကိုင်း ဖြတ်မီးရှို့ပါ။ ဆပ်ပြာဖျော်ရည် ဖျန်းနိုင်သည်။ လိုအပ်မှ ပင်လုံးပြန့်ဆေး ဖျန်းပါ။',

  // —— Pulses diseases ——
  'Powdery Mildew':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပဲမဟုတ်သော သီးနှံနှင့် သီးလှည့်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Benomyl, Propiconazole, Tebuconazole, Carbendazim, Thiophanate-methyl, Chlorothalonil, Hexaconazole, Sulfur ပါဆေးတို့ဖြင့် ဖျန်းပါ။',
  Rust:
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ စိုက်ချိန် ချိန်ဆပါ။ Azoxystrobin, Benomyl, Propiconazole, Tebuconazole, Thiophanate-methyl, Chlorothalonil, Hexaconazole တို့ဖြင့် ဖျန်းပါ။',
  'Yellow Mosaic':
    'ဗိုင်းရပ်စ်သယ်ပိုး (ယင်ဖြူ/ပျ) ကို ထိန်းပါ။ ပေါင်းရှင်းပါ။ ခံနိုင်ရည်ရှိမျိုး ရွေးပါ။ ရောဂါကျပင် ဖယ်ပါ။ Imidacloprid / Dimethoate တို့ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Leaf Crinkle Virus':
    'သယ်ပိုး ထိန်းချုပ်ပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပေါင်းရှင်းပါ။',
  'Leaf Crinkle':
    'သယ်ပိုး ထိန်းချုပ်ပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။',
  'Leaf Curl Virus':
    'သယ်ပိုး ထိန်းချုပ်ပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပေါင်းရှင်းပါ။',
  'Web Blight':
    'ရေမဝပ်စေရန် ထိန်းပါ။ ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Mancozeb, Propiconazole, Azoxystrobin တို့ဖြင့် ဖျန်းပါ။',
  'Bacterial Leaf Spot':
    'ရောဂါကင်းမျိုးစေ့ သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Copper / Kasugamycin အုပ်စု ဆေး ဖျန်းပါ။',
  'Halo Blight':
    'ရောဂါကင်းမျိုးစေ့ သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Copper ပါဆေး ဖျန်းပါ။',
  'Charcoal Rot':
    'ရေမဝပ်/ရေငတ် မဖြစ်စေရန် ထိန်းပါ။ သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Mancozeb, Propiconazole, Azoxystrobin, Thiophanate-methyl, Captan, Tebuconazole တို့ဖြင့် ပင်ခြေ ဖျန်းပါ။',
  'Dry Root Rot':
    'ခံနိုင်ရည်ရှိမျိုး သုံးပါ။ ပူပြင်းကာလ လွတ်အောင် စောစိုက်နိုင်သည်။ Iprodione, Azoxystrobin, Benomyl, Carbendazim, Mancozeb တို့ဖြင့် ဖျန်း/ကာကွယ်ပါ။',
  'Collar Rot':
    'ပင်ကြွင်း ဖျက်ပါ။ မြေအစိုဓာတ် မလွန်စေရ။ မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ Azoxystrobin, Tebuconazole, Benomyl, Carbendazim, Validamycin, Hymexazol, Captan တို့ဖြင့် ပင်ခြေ ဖျန်းပါ။',
  Wilt:
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ သီးလှည့်စိုက်ပါ။ မျိုးစေ့လူးနယ်ဆေး (Benomyl စသည်) သုံးပါ။ Hexaconazole, Tebuconazole, Iprodione, Carbendazim, Validamycin တို့ဖြင့် ဖျန်းပါ။',
  'Sterility Mosaic':
    'သယ်ပိုး (မိုက်) ထိန်းချုပ်ပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပေါင်းရှင်းပါ။',
  'Phytophthora Blight':
    'စိုက်ခင်းသန့်ရှင်းရေး လုပ်ပါ။ ဆက်တိုက်မစိုက်ပါနှင့်။ ရောဂါကျမျိုးစေ့ မပြန်သုံးပါနှင့်။ Azoxystrobin, Cymoxanil, Dimethomorph, Metalaxyl, Fosetyl-Al တို့ကို ရွက်နှင့် ပင်ခြေ ဖျန်းပါ။',
  'Stem Canker':
    'ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Propiconazole, Tebuconazole, Thiophanate-methyl တို့ဖြင့် ဖျန်းပါ။',
  Phyllody:
    'ပေါင်းရှင်းပါ။ စောစိုက်ခြင်း ရှောင်ပါ။ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ ရွက်ခုန်ပိုးကို Dimethoate, Acephate, Imidacloprid တို့ဖြင့် ထိန်းပါ။',
  'Macrophomina Blight':
    'ရေမဝပ်စေရန် ထိန်းပါ။ သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Mancozeb, Propiconazole, Azoxystrobin တို့ဖြင့် ဖျန်းပါ။',
  'Macrophomina Root Rot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ရေငတ်မထားပါနှင့်။ ပိုတက်ရှ် ထည့်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Thiophanate-methyl, Captan, Tebuconazole တို့ဖြင့် ပင်ခြေ ဖျန်းပါ။',

  // —— Sesame ——
  'Leaf and Pod Borer':
    'ပိုးကျရွက် ဖယ်မီးရှို့ပါ။ Flubendiamide, Chlorantraniliprole, Lambda-cyhalothrin ကို ရွက်လိပ်အတွင်း ရောက်အောင် ဖျန်းပါ။',
  'Gall Fly':
    'ပေါင်းရှင်းပါ။ သီးလှည့်စိုက်ပါ။ လိုအပ်မှ ပင်လုံးပြန့်ဆေး ဖျန်းပါ။',
  'Capsule Borer':
    'ပင်ကြွင်း ရှင်းပါ။ မီး/ဖီရိုမုန်းထောင်ချောက် သုံးပါ။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide, Chlorantraniliprole ဖျန်းပါ။',
  'Sphinx Moth':
    'ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ လိုအပ်မှ ထိသေဆေး ဖျန်းပါ။',
  'Mirid Bug':
    'ပေါင်းရှင်းပါ။ လိုအပ်မှ Dimethoate, Acetamiprid, Dinotefuran ဖျန်းပါ။',
  'Pod Sucking Bug':
    'ဥအစု ဖျက်ပါ။ ရိတ်သိမ်းချိန် ဂျပိုး စုဖျက်ပါ။ Dimethoate, Acetamiprid, Dinotefuran ဖျန်းပါ။',
  'Flea Beetle':
    'ပေါင်းရှင်းပါ။ ထယ်ထိုးထွန်မွှေပါ။ Cypermethrin, Chlorpyrifos ဖျန်းနိုင်သည်။',
  'Root Grub':
    'နွေထယ်ရေးခံပါ။ မြေပြင်ချိန် granule ပိုးသတ်ဆေး ထည့်ပါ။',

  // —— Sunflower ——
  'Sclerotinia Head Rot':
    'ပန်းပွင့်ပြီးနောက် ဒဏ်ရာမရအောင် ကာကွယ်ပါ။ အင်းဆက်/ငှက် ထိန်းပါ။ ပေါင်းနှင့် ပင်ကြွင်း ဖျက်ပါ။ မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ Mancozeb, Zineb, Chlorothalonil, Captan ဖျန်းပါ။',
  'Rhizopus Head Rot':
    'ပန်းပွင့်ပြီးနောက် ဒဏ်ရာမရအောင် ကာကွယ်ပါ။ အင်းဆက်/ငှက် ထိန်းပါ။ ပေါင်းနှင့် ပင်ကြွင်း ဖျက်ပါ။ မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ Mancozeb, Zineb, Chlorothalonil, Captan ဖျန်းပါ။',
  'Alternaria Blight':
    'သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ မစိုက်မီ ထယ်ထိုး ရေလွှမ်းနိုင်သည်။ မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ Chlorothalonil, Mancozeb, Tebuconazole, Iprodione ဖျန်းပါ။',
  'Downy Mildew':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပိုတက်ရှ်/သဘာဝမြေဩဇာ ထည့်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ ရေမဝပ်စေရန် ထိန်းပါ။ စိတ်စိတ်မစိုက်ရ။ ရောဂါကျပင် ဖယ်ပါ။ Metalaxyl, Propineb, Chlorothalonil, Mancozeb ဖျန်းပါ။',
  'Sunflower Necrosis Virus':
    'သယ်ပိုး ထိန်းပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။',
  'Septoria Leaf Spot':
    'ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Chlorothalonil, Mancozeb, Tebuconazole ဖျန်းပါ။',
  'Bacterial Stalk Rot':
    'ရေမဝပ်စေရန် ထိန်းပါ။ ပင်ကြွင်း ဖျက်ပါ။ Copper ပါဆေး သုံးနိုင်သည်။',
  'Phoma Black Stem':
    'ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Propiconazole, Tebuconazole ဖျန်းပါ။',
  'Head Caterpillar':
    'ပဲ/မြေပဲ သီးညှပ်စိုက်နိုင်သည်။ ပြောင်း ထောင်ချောက်တန်း စိုက်ပါ။ အလင်း/ဖီရိုမုန်းထောင်ချောက် ထောင်ပါ။ Trichogramma လွှတ်နိုင်သည်။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ဖျန်းပါ။',
  'Head Borer':
    'ပဲ/မြေပဲ သီးညှပ်စိုက်နိုင်သည်။ ပြောင်း ထောင်ချောက်တန်း စိုက်ပါ။ အလင်း/ဖီရိုမုန်းထောင်ချောက် ထောင်ပါ။ Trichogramma လွှတ်နိုင်သည်။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ဖျန်းပါ။',
  Semilooper:
    'ပိုးလောက် လက်ဖြင့် ဖျက်ပါ။ ပေါင်းရှင်းပါ။ Cypermethrin, Chlorpyrifos, Lambda-Cyhalothrin ဖျန်းနိုင်သည်။',
  'Seed Bug':
    'ဥအစု ဖျက်ပါ။ Dimethoate, Acetamiprid, Dinotefuran ဖျန်းပါ။',
  'Snout Beetle':
    'ပင်ကြွင်း ရှင်းပါ။ လိုအပ်မှ ထိသေဆေး ဖျန်းပါ။',
  'Stem Borer':
    'ပင်ကြွင်း ဖျက်ပါ။ သီးလှည့်စိုက်ပါ။ Acephate, Dimethoate, Dinotefuran, Thiamethoxam ဖျန်းပါ။',
  Wireworm:
    'နွေထယ်ရေးခံပါ။ မြေပြင်ချိန် granule ပိုးသတ်ဆေး ထည့်ပါ။',

  // —— Groundnut ——
  'Early Leaf Spot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Chlorothalonil, Difenoconazole, Hexaconazole, Prochloraz ဖျန်းပါ။',
  'Late Leaf Spot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ သီးလှည့်စိုက်ပါ။ Chlorothalonil, Difenoconazole, Hexaconazole, Prochloraz ဖျန်းပါ။',
  'Peanut Stem Necrosis Virus':
    'သယ်ပိုး (သရစ်) ထိန်းပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ Imidacloprid မျိုးစေ့လူးနယ်နိုင်သည်။',
  'Rosette Virus':
    'သယ်ပိုး (ပျ) ထိန်းပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။',
  'Peanut Mottle Virus':
    'သယ်ပိုး ထိန်းပါ။ ရောဂါကျပင် ဖယ်ပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။',
  'Peanut Clump Virus':
    'ရောဂါကျပင် ဖယ်ပါ။ သီးလှည့်စိုက်ပါ။ နွေထယ်ရေးခံပါ။',
  'Yellow Mold':
    'မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ စိုက်အနက် မှန်အောင် စိုက်ပါ။ Difenoconazole, Chlorothalonil, Propiconazole, Tebuconazole ဖျန်းပါ။',
  'Bacterial Wilt':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။',
  'Pod Rot':
    'ရေမဝပ်စေရန် ထိန်းပါ။ မျိုးစေ့လူးနယ်ဆေး သုံးပါ။ ပင်ကြွင်း မီးရှို့ပါ။',
  'Cylindrocladium Black Rot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ မှိုသတ်ဆေးကို တံဆိပ်အတိုင်း ပင်ခြေ ဖျန်းပါ။',
  'Groundnut Leaf Miner':
    'ပိုးကျရွက် ဖယ်ပါ။ ပေါင်းရှင်းပါ။ လိုအပ်မှ ထိသေ/ပင်လုံးပြန့်ဆေး ဖျန်းပါ။',
  'Jewel Beetle':
    'လက်ဖြင့် ကောက်ဖျက်ပါ။ လိုအပ်မှ ထိသေဆေး ဖျန်းပါ။',
  Termites:
    'ပင်ကြွင်း မီးရှို့ပါ။ မြေပြင်ချိန် granule ပိုးသတ်ဆေး ထည့်ပါ။',
  'Burrowing Nematode':
    'သီးလှည့်စိုက်ပါ။ နွေထယ်ရေးခံပါ။ လိုအပ်မှ Furadan အုပ်စု မြေခံ ထည့်ပါ။',
  Earwig:
    'ပေါင်းရှင်းပါ။ အမှိုက်ပုံ မထားပါနှင့်။ လိုအပ်မှ ထိသေဆေး ဖျန်းပါ။',

  // —— Chili / pepper (pepper.docx) ——
  'Chilli Thrips':
    'ပင်စိမ်းကို စိုက်ခင်းပတ်လည် စိုက်ပါ။ ပျိုးပင်ပေါ် ရေဖျန်း၍ သရစ်ပိုး ပေါက်ပွားမှု ဟန့်တားပါ။ မစိုက်မီ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ အပြာရောင်ထောင်ချောက် တစ်ဧက (၅) ခု ထောင်ပါ။ Dimethoate, Fipronil, Carbosulfan, Acetamiprid, Chlorfenapyr ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Broad Mite':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပေါင်းရှင်းပါ။ သဘာဝရန်သူ ထိန်းသိမ်းပါ။ အရွက်ပေါ် ရေပြင်းပြင်း ဖျန်းပါ။ ရေသွင်းနှင့် မြေဩဇာ မျှတပါ။ ဆိုးရွားမှ Dimethoate, Spirotetramat, Abamectin, Emamectin benzoate ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Yellow Mite':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပေါင်းရှင်းပါ။ သဘာဝရန်သူ ထိန်းသိမ်းပါ။ အရွက်ပေါ် ရေပြင်းပြင်း ဖျန်းပါ။ ရေသွင်းနှင့် မြေဩဇာ မျှတပါ။ ဆိုးရွားမှ Dimethoate, Spirotetramat, Abamectin, Emamectin benzoate ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Fruit Borer':
    'နွေထယ်ရေးခံပါ။ အတန်း (၅-၆) တိုင်း ပဲစင်းငုံ သီးညှပ်စိုက်ပါ။ တစ်ဧက အလင်းထောင်ချောက် (၁) ခုနှင့် ဖီရိုမုန်းထောင်ချောက် (၂) ခု ထောင်ပါ။ Trichogramma လွှတ်ပေးပြီး သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ လိုအပ်မှ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide, Indoxacarb ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Anthracnose':
    'ပင်ကြွင်း စုပုံမီးရှို့ပါ။ လေဝင်လေထွက် ကောင်းအောင် စိုက်ပါ။ ပန်းမပွင့်မီ တစ်ကြိမ်နှင့် သီးကင်းဝင်စ တစ်ကြိမ် မှိုသတ်ဆေး ဖျန်းပါ။ Chlorothalonil, Mancozeb, Azoxystrobin, Thiophanate-methyl, Difenoconazole, Trifloxystrobin ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Chili:Dieback':
    'ပင်ကြွင်း စုပုံမီးရှို့ပါ။ လေဝင်လေထွက် ကောင်းအောင် စိုက်ပါ။ ပန်းမပွင့်မီ တစ်ကြိမ်နှင့် သီးကင်းဝင်စ တစ်ကြိမ် မှိုသတ်ဆေး ဖျန်းပါ။ Chlorothalonil, Mancozeb, Azoxystrobin, Thiophanate-methyl, Difenoconazole, Trifloxystrobin ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Chili:Powdery Mildew':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပင်ကြွင်း မီးရှို့ပါ။ Difenoconazole, Tebuconazole, Sulfur, Kresoxim-methyl, Trifloxystrobin ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Bacterial Wilt':
    'ငရုတ်၊ ခရမ်းချဉ်၊ အာလူး မဟုတ်သော သီးနှံနှင့် သီးလှည့်ပါ။ ပေါင်းရှင်းပါ။ နွေထယ်ရေးခံပါ။ ရေမဝပ်စေရန် ထိန်းပါ။ နီမတုတ် ရှိပါက ပင်ညှိုး ပိုဆိုးသည်။',
  'Chili:Cercospora Leaf Spot':
    'ပင်ကြွင်း စုပုံမီးရှို့ပါ။ လေဝင်လေထွက် ကောင်းအောင် စိုက်ပါ။ ပေါင်းရှင်းပါ။ Chlorothalonil, Mancozeb, Thiophanate-methyl, Difenoconazole ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Phytophthora Blight':
    'ရေမဝပ်စေရန် ထိန်းပါ။ ပျိုးပင်ကို Azoxystrobin / Metalaxyl ဖျော်ရည်တွင် ခဏနှစ်ပြီး စိုက်ပါ။ ရောဂါစတင်ကျပါက Azoxystrobin, Metalaxyl, Fosetyl-Al, Captan, Propamocarb hydrochloride ကို တစ်ပင်လုံး စွှဲရွှဲ ဖျန်းပါ။',
  'Chili:Stem Rot':
    'ရေမဝပ်စေရန် ထိန်းပါ။ ပျိုးပင်ကို Azoxystrobin / Metalaxyl ဖျော်ရည်တွင် ခဏနှစ်ပြီး စိုက်ပါ။ ရောဂါစတင်ကျပါက Azoxystrobin, Metalaxyl, Fosetyl-Al, Captan, Propamocarb hydrochloride ကို တစ်ပင်လုံး စွှဲရွှဲ ဖျန်းပါ။',
  'Chili:Damping Off':
    'ပျိုးခင်းနှင့် စိုက်ခင်း ရေမဝပ်၊ မြေမကျပ်စေရန် ထိန်းပါ။ ပျိုးပင်ကို Azoxystrobin / Metalaxyl ဖျော်ရည်တွင် ခဏနှစ်ပါ။ ရောဂါကျပါက Azoxystrobin, Metalaxyl, Captan, Fosetyl-Al ကို အပင်နှင့် ပင်ခြေ စွှဲရွှဲ ဖျန်းပါ။',
  'Chili:Cutworm':
    'ပေါင်းရှင်းပါ။ စိုက်ခင်း ပုံမှန်စစ်ဆေးပါ။ ထယ်နက်နက်ထွန်ပါ။ ပိုးကျခင်း ရေလွှမ်းနိုင်ပါက လွှမ်းပါ။ လက်ဖြင့် ကောက်ဖျက်ပါ။ အလင်းထောင်ချောက် သုံးပါ။ တမာဆေး ရေ ၂၀ လီတာတွင် ၃၀၀ စီစီ ဖျန်းပါ။ မြေပြင်ချိန် Fipronil 3GR / Carbosulfan 5G ထည့်ပါ။ Lambda-cyhalothrin, Acephate, Chlorantraniliprole ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Chili:Aphids':
    'ပဲမျိုးရင်းဝင်ပင်နှင့် ပေါင်းရှင်းပါ။ ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ အဝါရောင်ထောင်ချောက် သုံးပါ။ မစိုက်မီ Imidacloprid ဖြင့် မျိုးစေ့လူးနယ်ပါ။ အသီးထွက်ပြီး ထိပ်ဖြတ်နိုင်သည်။ Dimethoate, Fipronil, Carbosulfan, Acetamiprid ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Tobacco Caterpillar':
    'ပေါင်းရှင်းပါ။ ပင်ကြွင်း မီးရှို့ပါ။ ထယ်ထိုးထွန်မွှေပါ။ အလင်းထောင်ချောက် ထွန်းပါ။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Armyworm':
    'ပေါင်းရှင်းပါ။ ပင်ကြွင်း မီးရှို့ပါ။ ထယ်ထိုးထွန်မွှေပါ။ အလင်းထောင်ချောက် ထွန်းပါ။ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
  'Chili:Pod Borer':
    'နွေထယ်ရေးခံပါ။ အတန်း (၅-၆) တိုင်း ပဲစင်းငုံ သီးညှပ်စိုက်ပါ။ တစ်ဧက အလင်းထောင်ချောက် (၁) ခုနှင့် ဖီရိုမုန်းထောင်ချောက် (၂) ခု ထောင်ပါ။ Trichogramma လွှတ်ပေးပြီး သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ လိုအပ်မှ Cypermethrin, Lambda-Cyhalothrin, Flubendiamide, Indoxacarb ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
};

export function fieldTreatmentMy(label?: string, crop?: string): string {
  if (!label) return '';
  if (crop) {
    const specific = FIELD_TREATMENTS_MY[`${crop}:${label}`];
    if (specific) return specific;
  }
  return FIELD_TREATMENTS_MY[label] || '';
}
