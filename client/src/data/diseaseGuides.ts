/** Official rice disease guides from Disease.docx (Smart Agro lab report source). */
import { diseaseNameMy } from './diseaseNames';
import { CROP_TREATMENT_FALLBACK_MY, fieldTreatmentMy } from './fieldTreatments';

export type DiseaseGuide = {
  key: string;
  nameEn: string;
  nameMy: string;
  organism: string;
  symptomsEn: string[];
  symptomsMy: string[];
  controlsEn: string[];
  controlsMy: string[];
  chemicals: string[];
  chemicalsMy: string[];
};

export const DISEASE_GUIDES: Record<string, DiseaseGuide> = {
  "Blast": {
    key: "Blast",
    nameEn: "Blast",
    nameMy: "စပါးဂုတ်ကျိုးရောဂါ",
    organism: "Pyricularia oryzae",
    symptomsEn: ["The disease can initiate right from the nursery stage.", "Spindle-shaped spots appear on rice leaves. As these spots enlarge, gray centers typically develop.", "Individual spots coalesce, leading to leaf death.", "When infection attacks the panicle, brown spots develop on the neck, causing it to break (neck blast)."],
    symptomsMy: ["ပျိုးခင်းကတည်းက ရောဂါစတင်ဖြစ်ပေါ်နိုင်သည်။", "စပါးရွက်ပေါ်တွင် လွန်းပုံသဏ္ဌာန်ရှိသော အကွက်များတွေ့ရသည်။", "အကွက်များကြီးခဲ့လျှင် အလယ်တွင် မီးခိုးရောင်ပေါ်တတ်သည်။", "ရောဂါကွက်တစ်ခုနှင့်တစ်ခုဆက်သွားပြီး စပါးရွက်များ သေသွားတတ်သည်။", "အနှံတွင် ရောဂါကျရောက်ပါက ဂုတ်တွင်အညိုရောင် အကွက်များဖြစ်ပေါ်ပြီး ကျိုးကျတတ်သည်။"],
    controlsEn: ["Plant disease-resistant varieties.", "Burn and destroy infected crop residues.", "Maintain standing water in summer rice fields.", "Clear alternate host plants and weeds.", "Temperatures around 18–20 °C promote disease development.", "Apply potash fertilizer in disease-prone areas.", "Avoid planting too densely.", "Use locally adapted resistant varieties.", "Treat seeds before planting using an appropriate seed-treatment fungicide."],
    controlsMy: ["ရောဂါဒဏ်ခံနိုင်ရည်ရှိသော မျိုးများစိုက်ပျိုးခြင်း။", "ရောဂါပင်ကြွင်းပင်ကျန်များကို မီးရှို့ဖျက်ဆီးပါ။", "နွေစပါးစိုက်ခင်းတွင်ရေအမြဲရှိနေရန် ဆောင်ရွက်ပါ။", "ရောဂါလက်ခံပင်များ၊ ပေါင်းမြက်များကို ရှင်းလင်းပေးပါ။", "အပူချိန် ၁၈-၂၀ °C ရှိခြင်းသည် ရောဂါဖြစ် ထွန်းမှု ကိုအားပေးသည်။", "ရောဂါရဒေသများတွင် ပိုတက်ရှ်ဓာတ်မြေဩဇာကို မဖြစ်မနေ ထည့်ပေးပါ။", "အပင်စိတ်စိတ်စိုက်ခြင်းကို ရှောင်ပါ။", "ဒေသအလိုက် ခံနိုင်ရည်ရှိသောမျိုးများကို အသုံးပြုပါ။", "မှိုရောဂါအတွက်မျိုးစေ့လူးနယ်ဆေးအဖြစ်အသုံးပြုနိုင်သည့်မှိုသတ်ဆေး တစ်မျိုးမျိုး ဖြင့် လူးနယ်စိုက်ပျိုးပါ။"],
    chemicals: ["Isoprothiolane", "Tricyclazole", "Thiophanate-methyl", "Prochloraz"],
    chemicalsMy: ["Isoprothiolane (အိုက်ဆိုပရိုသိုင်အိုလိန်း)", "Tricyclazole (ထရိုင်ဆိုက်ကလာဇိုး)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)", "Prochloraz (ပရိုကလိုရက်)"],
  },
  "Brown Spot": {
    key: "Brown Spot",
    nameEn: "Brown Spot",
    nameMy: "စပါးရွက်ညိုပြောက်ရောဂါ",
    organism: "Helminthosporium oryzae Breda de Haan",
    symptomsEn: ["Oval brown spots ranging from tiny specks to the size of sesame seeds (sometimes up to 1 cm) are uniformly distributed on the leaves.", "Spots feature dark brown margins with small gray centers.", "Brown lesions can also form between the nodes of the panicle branches."],
    symptomsMy: ["အရွက်ပေါ်တွင် အကွက်ငယ်မှ နှမ်းစေ့အရွယ်၊ တစ်ခါတစ်ရံ (၁)စင်တီမီတာအရွယ်ရှိ သော ဘဲဥပုံအညိုရောင်ပြောက်များ ညီညာစွာပြန့်ကျဲနေသည်ကိုတွေ့ရသည်။", "အညိုရောင်အနားရစ်၊ မီးခိုး ရောင် ဗဟိုအကွက်သေးများတွေ့ရသည်။", "အနှံခက်၏အဆစ်များကြားတွင် အညိုရောင် ရောဂါကွက် များတွေ့နိုင်သည်။"],
    controlsEn: ["Select seeds from healthy, disease-free fields.", "Burn and destroy infected crop residue and weeds.", "Maintain plant health by applying balanced amounts of organic manure, chemical fertilizers, and micronutrients. Combine potash and superphosphate (TSP) with every application of nitrogen.", "Plant resistant rice varieties.", "Use sound agronomic practices: improve soil fertility, maintain proper irrigation and drainage, and sow at the recommended planting time."],
    controlsMy: ["ရောဂါကင်းသောစိုက်ခင်းမှ မျိုးစေ့ကို ရွေးချယ်စိုက်ပါ။", "ရောဂါကျပင်ကြွင်းပင်ကျန်များနှင့် အခြားပေါင်းပင်များကို မီးရှို့ဖျက်ဆီးပစ်ပါ။", "ကျန်းမာသန်စွမ်းသော စပါးခင်းဖြစ်အောင်သဘာဝ မြေဩဇာ၊ ဓာတ်မြေဩဇာ၊ အနည်းလို အာဟာရဓာတ်များကို အချိုးညီညီသုံးစွဲပါ။ နိုက်ထရိုဂျင် မြေဩဇာထည့် သော အကြိမ်တိုင်းတွင် ပိုတက်ရှ်နှင့် တီစူပါကို တွဲထည့်ပါ။", "ခံနိုင်ရည်ရှိသော စပါးမျိုးကို ရွေးချယ်စိုက်ပါ။", "စပါးစိုက်မြေကို မြေဆီဩဇာ တိုးတက်ကောင်းမွန်လာအောင် ပြုပြင်ဆောင်ရွက်ပေးခြင်း၊ ရေသွင်း၊ ရေထုတ်မှန်မှန်ပြုလုပ်ပေးခြင်း၊ သင့်တော်သောစိုက်ချိန်ကို ချိန်ဆ၍ စိုက်ပျိုးခြင်း စသော စိုက်ပျိုးနည်းစနစ်များကို စနစ်တကျမှန်ကန်အောင်ဆောင်ရွက်ပါ။"],
    chemicals: ["Propiconazole", "Thiophanate-methyl", "Difenoconazole"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)", "Difenoconazole (ဒီဖီနိုကိုနာဇိုး)"],
  },
  "Bacterial Leaf Blight": {
    key: "Bacterial Leaf Blight",
    nameEn: "Bacterial Leaf Blight",
    nameMy: "ဘက်တီးရီးယားရွက်ခြောက်ရောဂါ",
    organism: "Xanthomonas oryzae pv. oryzae (Ishiyama 1922) Swings et al. 1990",
    symptomsEn: ["On young plants, small water-soaked lesions start at the leaf tips or margins and expand along the leaf blade.", "On mature plants, water-soaked lesions also begin at the tips or margins and spread down the leaf blade.", "Infected tissue turns straw-colored to bright white with wavy, irregular margins.", "Early in the morning under dew, bacterial ooze exudes from infected areas; as sunlight opens, these dry into tiny amber-colored droplets."],
    symptomsMy: ["အပင်ငယ်စဉ်တွင်အောက်ရွက်၏ ရွက်ဖျား၊ ရွက်နားများတွင် သေးငယ်သော ရေစိုနာကွက်စ တင်ဖြစ်ပြီး ရွက်ပြားတစ်လျှောက်ကျယ်ပြန့်သွားသည်။", "အပင်ကြီးများတွင် ရွက်ဖျား၊ ရွက်နားမှ ရေစို နာကွက် စတင်ဖြစ်ပေါ်သည်။", "ရွက်ပြားတစ်လျှောက် ကျယ်ပြန့်လာသည်။", "ရောဂါကျရောက်သော တစ်သျှူးသားသည် ကောက်ရိုး ခြောက်ရောင်မှ ဖြူဖွေး သော အရောင်သို့တိုင် ဖြစ်သွားသည်။", "အနား မညီဘဲလှိုင်းတွန့်ပုံရှိနေသည်ကို တွေ့ရသည်။", "နံနက်စောစောနှင်းကျပြီး ရောဂါကျအပိုင်းမှ ဘက်တီး ရီးယား စိမ့်ထွက်ရည်များထုတ်ပြီး နေပွင့်လာသောအခါ ပယင်းရောင်အလုံးကလေးများအဖြစ် မြင် တွေ့နိုင်သည်။"],
    controlsEn: ["Plant resistant rice varieties.", "Do not reuse seed from infected fields.", "Avoid dense planting.", "Avoid excessive urea (nitrogen) fertilizer; split applications if needed. Potash fertilizer must be applied.", "Manage irrigation and drainage in areas with water-control capability.", "Clear weeds, wild rice, and rice stubble.", "Plow under rice stubble in infected fields to encourage rapid decomposition."],
    controlsMy: ["ရောဂါဒဏ်ခံနိုင်ရည်ရှိသော စပါးမျိုးကို စိုက်ပါ။", "ရောဂါကျစိုက်ခင်းမှ မျိုးစေ့ကိုပြန်လည်မစိုက်ပျိုးပါနှင့်။", "ကောက်ပင်စိတ်စိတ်မစိုက်ရ။", "ပုလဲဓာတ်မြေဩဇာကို လွန်ကဲစွာ အသုံးမပြုဘဲ လိုအပ်ပါက အကြိမ်ကြိမ်ခွဲ၍ ကျဲပက်အသုံးပြုပါ။ ပိုတက်ရှ်မြေဩဇာကို မဖြစ်မနေ အသုံးပြုပါ။", "ရေထိန်းနိုင်သောဒေသများတွင် ရေသွင်းရေထုတ်ဆောင်ရွက်ပေးပါ။", "ပေါင်းမြက်များ၊ ကောက်လေများ နှင့် စပါးရိုးပြတ်များကို ရှင်းလင်းပါ။", "ရောဂါကျစိုက်ခင်းမှ စပါးရိုးပြတ်များအား ထယ်ထိုးမြေ မြှုပ်၍ မြန်မြန်ဆွေးအောင် ဆောင်ရွက်ပါ။"],
    chemicals: ["Kasugamycin", "Bismerthiazol", "Copper Oxychloride", "Oxolinic Acid"],
    chemicalsMy: ["Kasugamycin (ကာဆူဂါမိုင်စင်)", "Bismerthiazol (ဗစ်မာသီယာဇိုး)", "Copper Oxychloride (ကော့ပါးအောက်ဆီကလိုရိုဒ်)", "Oxolinic Acid (အောက်ဆိုလင်းနစ် အက်ဆစ်)"],
  },
  "Bacterial Leaf Streak": {
    key: "Bacterial Leaf Streak",
    nameEn: "Bacterial Leaf Streak",
    nameMy: "ဘက်တီးရီးယားရွက်စင်းရောဂါ",
    organism: "Xanthomonas oryzae pv. oryzicola (Fang et al. 1957) Swings et al. 1990",
    symptomsEn: ["Interveinal, translucent, water-soaked streaks appear parallel to leaf veins.", "In severe cases, the streaks turn from yellow to orange, giving the entire field an orange tint when viewed from a distance."],
    symptomsMy: ["ရွက်ကြောနှင့်အပြိုင် ရေစိုနာအစင်းများ ရောဂါအနာကွက်များမှာ အလင်း ပေါက်နေ သည်ကို တွေ့ရသည်။", "ရောဂါပြင်းထန်ပါက အစင်းများ အဝါရောင်မှ လိမ္မော်ရောင် ပြောင်း သွားပြီး အဝေးမှကြည့်ပါက တစ်ခင်းလုံး လိမ္မော်ရောင်သန်းနေသည်ကို တွေ့ရမည်။"],
    controlsEn: ["Plant resistant rice varieties.", "Do not reuse seed from infected fields.", "Avoid dense planting.", "Avoid excessive urea (nitrogen) fertilizer; split applications into multiple doses. Potash fertilizer must be applied.", "Manage irrigation and drainage in areas with water-control capability.", "Clear weeds, wild rice, and rice stubble.", "Plow under stubble in infected fields for fast decomposition."],
    controlsMy: ["ရောဂါဒဏ်ခံနိုင်ရည်ရှိသော စပါးမျိုးကို စိုက်ပါ။", "ရောဂါကျစိုက်ခင်းမှ မျိုးစေ့ကိုပြန်လည်မစိုက်ပျိုးပါနှင့်။", "ကောက်ပင်စိတ်စိတ်မစိုက်ရ။", "ပုလဲဓာတ်မြေဩဇာကို လွန်ကဲစွာ အသုံးမပြုဘဲ လိုအပ်ပါက အကြိမ်ကြိမ်ခွဲ၍ ကျဲပက်အသုံးပြုပါ။ ပိုတက်ရှ်မြေဩဇာကို မဖြစ်မနေ အသုံးပြုပါ။", "ရေထိန်းနိုင်သောဒေသများတွင် ရေသွင်းရေထုတ်ဆောင်ရွက်ပေးပါ။", "ပေါင်းမြက်များ၊ ကောက်လေများနှင့် စပါးရိုးပြတ်များကို ရှင်းလင်းပါ။", "ရောဂါကျစိုက်ခင်းမှ စပါးရိုးပြတ်များအား ထယ်ထိုးမြေ မြှုပ်၍ မြန်မြန်ဆွေးအောင် ဆောင်ရွက်ပါ။"],
    chemicals: ["Kasugamycin", "Bismerthiazol", "Copper Oxychloride", "Oxolinic Acid", "Thiophanate-methyl"],
    chemicalsMy: ["Kasugamycin (ကာဆူဂါမိုင်စင်)", "Bismerthiazol (ဗစ်မာသီယာဇိုး)", "Copper Oxychloride (ကော့ပါးအောက်ဆီကလိုရိုဒ်)", "Oxolinic Acid (အောက်ဆိုလင်းနစ် အက်ဆစ်)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)"],
  },
  "Bakanae": {
    key: "Bakanae",
    nameEn: "Bakanae",
    nameMy: "ပင်ရှည်ရောဂါ",
    organism: "Fusarium moniliforme (Gibberella fujikuroi)",
    symptomsEn: ["Infected plants grow noticeably taller and thinner than healthy plants, taking on a yellowish-green color.", "Symptoms occur in nurseries as well as fields.", "Severely infected seedlings in the nursery die before transplanting; those that survive often die soon after transplanting.", "Plants that survive to maturity fail to produce filled panicles (grains).", "Infected seeds appear discolored with spots or blotches.", "When infected plants die, white or pink fungal growth can be seen around their lower nodes."],
    symptomsMy: ["ရောဂါရအပင်သည် ပုံမှန်အပင်ထက် ရှည်ထွက်နေခြင်းဖြစ်သည်။", "စိုက်ခင်းတွင်သာမက ပျိုးခင်းတွင်လည်း တွေ့နိုင်ပြီး အပင်မှာသေးသွယ်ရှည်လျားကာ စိမ်းဝါရောင် ပြောင်းလျက်ရှိသည်။", "ပျိုးခင်းတွင် ရောဂါပြင်းထန်စွာ ကျရောက်ပါက စိုက်ခင်းသို့ရွှေ့မစိုက်မီတွင် သေဆုံးသွားပြီး ပျိုးခင်းတွင် ရှင်သန်နေပါသော်လည်း စိုက်ခင်းသို့ရွှေ့စိုက်ပြီးသောအခါတွင် သေဆုံးသွားတတ်သည်။", "ရင့်မှည့်ချိန်အထိရှင်သန်ပါသော်လည်း အနှံများတွင် စပါးစေ့မဖြစ်ပေါ်ပေ။", "ရောဂါရစပါးစေ့များမှာ အစွန်းအကွက်များဖြင့် အရောင်ပျက်လျက်ရှိသည်။", "ရောဂါရအပင်များ သေဆုံးသွားသောအခါတွင် ၎င်းတို့၏ အောက်ခြေအဆစ် အပိုင်းများတွင် အဖြူရောင်(သို့)ပန်းရောင်ရှိသော ရောဂါဖြစ်စေသည့် မှို၏ကြီးထွားမှုကိုတွေ့နိုင်သည်။"],
    controlsEn: ["Practice field sanitation and cultural management.", "Most effective measure: Treat and soak seeds in a preventive or systemic fungicide prior to sowing."],
    controlsMy: ["စိုက်ခင်းသန့်ရှင်းရေးကို ဂရုပြုဆောင်ရွက်ခြင်း အပါအဝင် စိုက်ပျိုးခြင်းနည်းစနစ်များဖြင့် ကာကွယ်နှိမ်နင်းခြင်း", "၎င်းရောဂါအတွက် အထိရောက်ဆုံးသော ကာကွယ်နှိမ်နင်းနည်းမှာ မစိုက်ပျိုးမီတွင် မျိုးစေ့ကို ကာကွယ်မှိုသတ်ဆေးတစ်မျိုးမျိုး(သို့)ပင်လုံးပြန့် မှိုသတ်ဆေးတစ်မျိုးမျိုးဖြင့် လူးနယ်၍ မျိုးစေ့စိမ်ပြုပြင်မှ စိုက်ပျိုးခြင်းဖြစ်သည်။"],
    chemicals: ["Propiconazole", "Benomyl", "Carbendazim", "Mancozeb", "Hexaconazole"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Benomyl (ဘီနိုမိုင်း)", "Carbendazim (ကာဗန်ဒါဇင်)", "Mancozeb (မန်းကိုဇက်)", "Hexaconazole (ဟက်ဆာကိုနာဇိုး)"],
  },
  "False Smut": {
    key: "False Smut",
    nameEn: "False Smut",
    nameMy: "စပါးမှိုသီးရောဂါ",
    organism: "Ustilaginoidea virens",
    symptomsEn: ["Individual rice grains swell to about twice their normal size, developing into velvety, green to yellowish-green fungal masses (smut balls).", "As the smut balls mature, they turn dark greenish-black."],
    symptomsMy: ["စပါးစေ့များတွင် ပုံမှန်ထက် (၂) ဆခန့် ကြီးမားပြီး အစိမ်းရောင်၊ စိမ်းဝါရောင် မှိုအစုအခဲများ ဖုံးအုပ်ပြီး မှိုသီးများအဖြစ်တွေ့ရသည်။", "မှိုသီးများရင့်လွန်ချိန်တွင် စိမ်းညိုရောင် ပြောင်းသွားသည်။"],
    controlsEn: ["Do not use seeds harvested from infected fields.", "Treat seeds with a fungicide before planting.", "Apply a fungicide spray a few days prior to panicle emergence (heading stage)."],
    controlsMy: ["ရောဂါကျစိုက်ခင်းမှ မျိုးစေ့ကိုပြန်မသုံးပါနှင့်။", "မျိုးစေ့ကိုမှိုသတ်ဆေးတစ်မျိုးမျိုးဖြင့်လူးနယ်ပြီးမှစိုက်ပါ။", "အနှံမထွက်မီရက်အနည်းငယ်အလိုတွင်မှိုသတ်ဆေးဖျန်းပါ။"],
    chemicals: ["Propiconazole", "Azoxystrobin", "Benomyl", "Carbendazim"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Azoxystrobin (အဇိုစီစထိုဘင်)", "Benomyl (ဘီနိုမိုင်း)", "Carbendazim (ကာဗန်ဒါဇင်)"],
  },
  "Narrow Brown Spot": {
    key: "Narrow Brown Spot",
    nameEn: "Narrow Brown Spot",
    nameMy: "ရွက်ညိုပြောက်ရှည်ရောဂါ",
    organism: "Cercospora janseana (Sphaerulina oryzina)",
    symptomsEn: ["Short, narrow, brown linear spots develop parallel to the leaf veins.", "Spots measure up to 1.5 mm wide and 35 mm long, with a dark brown center.", "Spots may also develop on leaf sheaths and glumes.", "When spots are severe, leaves dry out and wither starting from the tip toward the base.", "On resistant varieties, lesions remain tiny, narrow, reddish-brown streaks with dark centers.", "The disease thrives in nutrient-deficient soils (especially nitrogen-deficient)."],
    symptomsMy: ["ရွက်ပြားများပေါ်တွင် ရွက်ကြောများနှင့်အပြိုင် သေးရှည်ရှည်အညိုရောင် အပြောက်များ ဖြစ်ပေါ်စေသည်။", "အကျယ်မှာ(၁.၅)မီလီမီတာနှင့် အလျား(၃၅)မီလီမီတာအထိ ရှိနိုင်၍ အလယ်တွင်ညိုနက်ရောင်ရှိသည်။", "ရွက်ဖုံးနှင့်စပါးခွံများတွင်လည်း အစက်အပြောက်များ ဖြစ်ပေါ်နိုင်သည်။", "အရွက်ပေါ်တွင် ကွက်ပြောက်များ များလာပါက အရွက်ထိပ်ဖျားပိုင်းမှစ၍ ရွက်ရင်းဘက်သို့ ခြောက်လာပြီးညှိုးကျသွားသည်။", "ခံနိုင်ရည်ရှိသောမျိုးများတွင် နီညိုရောင်တည်းတည်းရှိသော သေးရှည်ရှည်အနာကွက် ဖြစ်ပေါ်နိုင်ပြီး အလယ်တွင်ညိုမြဲရောင် ဖြစ်နေသည်။", "အာဟာရဓာတ်ချို့တဲ့သော(အထူးသဖြင့်နိုက်ထရိုဂျင်ချို့တဲ့သော)မြေများတွင် ဤရောဂါဖြစ်လွယ်သည်။"],
    controlsEn: ["Planting resistant varieties is the best preventive method.", "Use disease-free seed.", "Apply balanced fertilizers containing complete nutrients.", "Ensure fields do not suffer from water stress/drought."],
    controlsMy: ["ခံနိုင်ရည်ရှိမျိုးများကိုရွေးချယ်စိုက်ပျိုးခြင်းသည်ဤရောဂါကိုအကောင်းဆုံးကာကွယ်ခြင်းဖြစ်သည်။", "ရောဂါကင်းသောမျိုးစေ့ကိုသုံးပါ။", "အာဟာရဓာတ် ပြည့်စုံသောမြေဩဇာကိုသုံးပါ။", "စိုက်ခင်းရေငတ်ခြင်းမရှိစေရ။"],
    chemicals: ["Propiconazole", "Tricyclazole", "Thiophanate-methyl + Thiram", "Chlorothalonil", "Carbendazim"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Tricyclazole (ထရိုင်ဆိုက်ကလာဇိုး)", "Thiophanate methyl + Thiram (သိုင်အိုဖာနိတ်မီသိုင်း+သိုင်ရမ်)", "Chlorothalonil (ကလိုရိုသာလိုနီး)", "Carbendazim (ကာဗန်ဒါဇင်)"],
  },
  "Sheath Blight": {
    key: "Sheath Blight",
    nameEn: "Sheath Blight",
    nameMy: "ရွက်ဖုံးခြောက်ရောဂါ",
    organism: "Rhizoctonia solani J.G. Kühn, 1858",
    symptomsEn: ["Greenish-brown, oblong to oval spots form on leaf sheaths just above the water line.", "Spots turn gray with dark brown borders. Tiny black structures may appear on the lesions.", "Affected leaf blades turn yellow and rot.", "Small white, brown, or black fungal bodies (sclerotia) can be found at the base of the plant and in the surrounding soil."],
    symptomsMy: ["ရေမျက်နှာပြင်၏ အထက်နား ရွက်ဖုံးပေါ်တွင် ရောဂါအနာကွက်သည် စိမ်းညို ရောင် ရှိ၍ လုံးရှည်ပုံ၊ ဘဲဥပုံ အကွက်စတင်ဖြစ်ပေါ်သည်။", "ညိုနက်ရောင် အနားသတ် ရှိသော မီးခိုး ရောင်အနာကွက်ဖြစ်ပေါ်သည်။", "အနာကွက်ပေါ်တွင် အနက်ရောင် အလုံးငယ်များ တွေ့နိုင် သည်။", "ရွက်ဖုံးရှိရွက်ပြားများဝါလာပြီး ပုပ်သွားသည်။", "အဖြူရောင် အညိုရောင် အနက်ရောင် ရှိသော မှိုအလုံးငယ်များ (စကလယ်ရိုးရှား)များကို ပင်ခြေနှင့်မြေကြီးထဲ တွင် တွေ့နိုင်သည်။"],
    controlsEn: ["Avoid over-dense planting.", "Avoid applying excessive nitrogen fertilizer in fields with a history of the disease; split applications into smaller doses.", "Rotate crops with legumes to reduce disease pressure.", "Remove and destroy infected crop residues.", "Keep soil weed-free and allow it to dry/air out under moist conditions for at least one month.", "Avoid passing irrigation water through infected fields to uninfected ones."],
    controlsMy: ["ကောက်ပင် စိတ်လွန်းစွာ မစိုက်သင့်ပါ။", "ရောဂါကျရောက်ဖူးသောခင်းတွင် နိုက်ထရိုဂျင်ဓာတ်ပါသော မြေဩဇာ လွန်ကဲစွာမကျွေးရ၊ လိုအပ်ပါက အကြိမ်ခွဲ၍ ထည့်သွင်းပါ။", "ပဲမျိုးသီးနှံဖြင့် သီးလှည့်စိုက်ခြင်းသည် ရောဂါဖြစ်စေနိုင်မှုနည်းစေပါသည်။", "ရောဂါကျ ပင်ကြွင်းပင်ကျန် ဖယ်ရှားဖျက်ဆီးပါ။", "မြေကို အနည်းဆုံးတစ်လ ပေါင်းမြက်ရှင်းလင်းစေပြီး အစိုဓာတ်ရှိသော အခြေ အနေတွင် မြေလှပ်ထားပါ။", "ရောဂါစိုက်ခင်းကို ဖြတ်၍ ရေသွင်းရေထုတ်ပြုခြင်းမှ ရှောင်ကျဉ်ပါ။"],
    chemicals: ["Azoxystrobin", "Hexaconazole", "Propiconazole", "Validamycin", "Thiophanate-methyl"],
    chemicalsMy: ["Azoxystrobin (အဇိုဆီထရောရိုဘင်)", "Hexaconazole (ဟက်ဆာကိုနာဇိုး)", "Propiconazole (ပရိုပီကိုနာဇိုး)", "Validamycin (ဗယ်လီဒါမိုင်စင်)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)"],
  },
  "Sheath Rot": {
    key: "Sheath Rot",
    nameEn: "Sheath Rot",
    nameMy: "ရွက်ဖုံးပုပ်ရောဂါ",
    organism: "Acrocylindrium oryzae (Sarocladium oryzae)",
    symptomsEn: ["Grayish-brown oblong or diamond-shaped lesions (0.1–0.5 mm) with dark brown borders appear on the flag leaf sheath, eventually expanding across the entire sheath.", "Adjacent lesions merge together to cover the whole leaf sheath.", "Severe infection prevents panicles from emerging completely, causing them to rot inside the sheath.", "White fungal growth is visible inside infected sheaths, accompanied by panicle rot.", "Partially emerged panicles turn light to dark brown and become covered with light pink mycelium and grains.", "Infected grains exhibit brown discolorations/blotches."],
    symptomsMy: ["အလံရွက်၏ ရွက်ဖုံးပေါ်တွင် လုံးရှည်ပုံ(သို့) မှန်(၀.၅)မှ(၀.၁)မမ အရွယ်အညိုရောင် အနားရစ်ရှိသော မီးခိုးရောင်အနာကွက်မှ တစ်ပြင်လုံး မီးခိုးရောင်အနာကွက် အထိတွေ့ရှိနိုင်ပါသည်။", "အနာကွက်များတစ်ခုကွက်နှင့်တစ်ခု ကွက် ပေါင်းစပ်သွားပြီး ရွက်ဖုံးတစ်ခုလုံး ဖုံးလွှမ်းသွား နိုင်သည်။", "ရောဂါပြင်းလျှင် အနှံမထွက်နိုင်ဘဲ တံစိမ်းတစ်ဖြစ် နိုင်သည်။", "ရောဂါရရွက်ဖုံး၏ အတွင်းဘက်တွင် ဖြူဖွေးသော မှိုကိုတွေ့ရှိနိုင်ပြီး အနှံမှာပုပ်နေတတ်သည်။", "တံစိမ်းတစ်ပိုင်း ထွက်နေသော အနှံမှာအညိုဖျော့မှအညိုရင့်ရောင်ရှိပြီး ပန်းရောင်ဖျော့မှိုမျှင်နှင့် စပါးများ ဖုံးအုပ်နေတတ်သည်။", "ရောဂါရစပါးစေ့များတွင်အညိုရောင် စွန်းထင်းနေသည်။"],
    controlsEn: ["Use disease-free seed.", "Burn and destroy infected panicles and sheaths.", "Apply balanced fertilizers according to soil needs.", "Avoid excessive nitrogen fertilizer and increase potash fertilizer applications.", "Avoid planting too densely."],
    controlsMy: ["ရောဂါကင်းမျိုးစေ့သုံးပါ။", "ရောဂါရအနှံနှင့်ရွက်ဖုံးများကို မီးရှို့ဖျက်ဆီးပါ။", "အာဟာရကိုမျှတစွာရရှိနိုင်ရန်မြေဩဇာများကိုချိန်ညှိ၍သုံးပါ။", "နိုက်ထရိုဂျင်ဓာတ်မြေဩဇာများအားလွန်ကဲစွာသုံးခြင်းကို ရှောင်ပြီး ပိုတက်မြေဩဇာကဲ၍သုံးပါ။", "အပင်စိတ်လွန်းစွာ မစိုက်သင့်ပါ။"],
    chemicals: ["Propiconazole", "Difenoconazole", "Chlorothalonil", "Thiophanate-methyl", "Benomyl"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Difenoconazole (ဒီဖီနိုကိုနာဇိုး)", "Chlorothalonil (ကလိုရိုသာလိုနီး)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)", "Benomyl (ဘီနိုမိုင်း)"],
  },
  "Stem Rot": {
    key: "Stem Rot",
    nameEn: "Stem Rot",
    nameMy: "စပါးပင်စည်ပုပ်ရောဂါ",
    organism: "Helminthosporium sigmoideum (Magnaporthe salvinii)",
    symptomsEn: ["Appears during later stages of growth as black lesions near the water line.", "Lesions enlarge, and the fungus penetrates through the sheath into the stem, causing the stem to lodge (fall over).", "Splitting the internode reveals black fungal mycelium inside the stem cavity—a key diagnostic feature distinguishing it from other diseases.", "In tropical regions, it occasionally attacks young plants soon after transplanting, causing leaves to turn yellow, then brown, and die."],
    symptomsMy: ["အပင်ကြီးထွားမှု၏ နောက်ပိုင်းအဆင့်တွင် တွေ့ရသည်။", "ရေမျက်နှာပြင်နှင့် ထိစပ်နေသော အမည်းရောင်အနာကွက်များ စတင်ဖြစ်လာသည်။", "၎င်းအမည်းရောင်အနာကွက်များမှ ကျယ်ပြန့်လာပြီးရောဂါဖြစ်မှိုသည် ရွက်ဖုံးထဲမှတစ်ဆင့် ပင်စည်သို့ ရောဂါကူးကာ ပင်စည်ယိုင်လဲသွားသည်။", "ဆစ်ကြားကို ခွဲကြည့်ပါက ပင်စည်အခေါင်းအတွင်းတွင် အမည်းရောင် မှိုမျှင်များသည် စပါးပင်တွင်၎င်းရောဂါဝင်ရောက်တိုက်ခိုက်ခံရကြောင်း သင်္ကေတဖြစ်ပြီး အခြားရောဂါများမှ လွယ်ကူစွာ ခွဲခြားဖော်ထုတ်နိုင်သည်။", "အပူပိုင်းဒေသများတွင် စိုက်ခင်းသို့ ပြောင်းရွှေ့စိုက်ပျိုးပြီးခါစ အပင်ငယ်စဉ်တွင်လည်းရံဖန်းရံခါ ကျရောက်တတ်သည်။", "ပျိုးပင်အရွယ်တွင် ဝင်ရောက်တိုက်ခိုက်ခြင်းခံရပါက အရွက်များဝါလာမည်။", "ထို့နောက် အညိုရောင်ပြောင်းပြီး သေသွားသည်။"],
    controlsEn: ["Use lodging-resistant varieties.", "Burn straw, stubble, and crop residue after harvest.", "Allow the field to crack dry before re-irrigating.", "Avoid over-applying nitrogen and phosphorus fertilizers; apply nitrate-based fertilizers to help reduce severity.", "Prevent irrigation water from flowing through infected fields.", "Avoid deep flooding during the tillering stage; maintaining adequate shallow water helps prevent the disease."],
    controlsMy: ["အထူးသဖြင့် အပင်ယိုင်လဲမှုမရှိသောမျိုးများကိုအသုံးပြုရမည်။", "ရိတ်သိမ်းပြီးကောက်ရိုးရိုးပြတ်နှင့်ပင်ကြွင်းပင်ကျန်များကို မီးရှို့ရမည်။", "ရေမသွင်းမီမြေကိုပတ်ကြားအက်အောင်ထားပြီးမှရေသွင်းပါ။", "နိုက်ထရိုဂျင်နှင့်ဖော့စဖောရုစ်ဓာတ်မြေဩဇာကိုလွန်ကဲစွာ အသုံးမပြုရန်နှင့်ရောဂါပြင်းထန်မှုလျော့နည်းစေတက် ယမ်းမြေဩဇာကိုထည့်သွင်းပေးပါ။ ဈာရောဂါကျစပါးခင်းများကိုဖြတ်၍ ရေသွင်းရေထုတ် မပြုလုပ်မိစေရန် ဂရုစိုက်ပါ။", "ပင်ပွားထွက်ချိန်တွင် ရေနက်နက်သို့လှောင်ထားခြင်းကို ရှောင်ပါ။ ရေကိုလုံလောက်ရုံသာပေးသွင်းထားခြင်းဖြင့် ဤရောဂါကိုကာကွယ်နိုင်သည်။"],
    chemicals: ["Propiconazole", "Chlorothalonil", "Thiophanate-methyl", "Benomyl"],
    chemicalsMy: ["Propiconazole (ပရိုပီကိုနာဇိုး)", "Chlorothalonil (ကလိုရိုသာလိုနီး)", "Thiophanate methyl (သိုင်အိုဖာနိတ်မီသိုင်း)", "Benomyl (ဘီနိုမိုင်း)"],
  },
  "Yellow Stem Borer": {
    key: "Yellow Stem Borer",
    nameEn: "Yellow Stem Borer",
    nameMy: "စပါးပင်စည်ထိုးပိုး",
    organism: "Scirpophaga incertulas",
    symptomsEn: [
      "Dead hearts in the vegetative stage: central tiller turns yellow/brown and pulls out easily.",
      "Whiteheads at reproductive stage: empty white panicles that stand upright.",
      "Bored stems with larval frass inside tillers.",
    ],
    symptomsMy: [
      "ပင်ပွားအဆင့်တွင် ပင်သေ (dead heart) — အလယ်ပင်ဝါ/ညိုပြီး လွယ်ကူစွာ ဆွဲထုတ်ရသည်။",
      "အနှံထွက်အဆင့်တွင် နှံဖြူ (whitehead) — အနှံဖြူပြီး စပါးမဖြစ်။",
      "ပင်စည်အတွင်း ပိုးလောက်နှင့် အညစ်အကြေးများ တွေ့ရသည်။",
    ],
    controlsEn: [
      "Plant resistant or tolerant varieties where available.",
      "Remove and destroy dead hearts and whiteheads.",
      "Avoid staggered planting in the same area.",
      "Use light traps to monitor moth flights.",
      "Conserve natural enemies; spray only when economic threshold is reached.",
    ],
    controlsMy: [
      "ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။",
      "ပင်သေ/နှံဖြူပင်များကို ဖယ်ရှားဖျက်ဆီးပါ။",
      "တစ်နေရာတည်းတွင် စိုက်ချိန် ကွဲလွန်းခြင်း ရှောင်ပါ။",
      "အလင်းထောင်ချောက်ဖြင့် ပိုးလိပ်ပြာ စောင့်ကြည့်ပါ။",
      "သဘာဝရန်သူများ ထိန်းသိမ်းပြီး လိုအပ်မှသာ ဆေးဖျန်းပါ။",
    ],
    chemicals: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
    chemicalsMy: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
  },
  "Brown Planthopper": {
    key: "Brown Planthopper",
    nameEn: "Brown Planthopper",
    nameMy: "အညိုရောင် ပင်စည်ခုန်ပိုး",
    organism: "Nilaparvata lugens",
    symptomsEn: [
      "Hopperburn: leaves yellow from tip then turn brown; patches of dried plants.",
      "Many small brown hoppers at the plant base, especially when water is stagnant.",
      "Heavy infestation can lodge plants and reduce yield sharply.",
    ],
    symptomsMy: [
      "ဟော့ပါဘန် — ရွက်ဖျားမှ ဝါပြီး ညိုခြောက်၊ စိုက်ခင်းတွင် အစက်အပြောက်သေများ။",
      "ပင်ခြေတွင် အညိုရောင် ပိုးကောင်ငယ်များ များပြားစွာ တွေ့ရသည်။",
      "ပြင်းထန်ပါက အပင်ယိုင်လဲပြီး အထွက်ကျသည်။",
    ],
    controlsEn: [
      "Avoid excessive nitrogen fertilizer.",
      "Alternate wetting and drying; do not keep deep stagnant water continuously.",
      "Avoid broad-spectrum insecticides that kill natural enemies early in the season.",
      "Scout the plant base regularly; treat only above threshold.",
    ],
    controlsMy: [
      "နိုက်ထရိုဂျင် မြေဩဇာ မလွန်ပါနှင့်။",
      "ရေသွင်းရေထုတ် လှည့်ပတ်လုပ်ပါ။ ရေနက်နက် အမြဲမထားပါနှင့်။",
      "အစောပိုင်းတွင် သဘာဝရန်သူသေစေသော ဆေးကျယ်များကို ရှောင်ပါ။",
      "ပင်ခြေကို ပုံမှန် စစ်ဆေးပြီး သတ်မှတ်အဆင့်ကျော်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Buprofezin", "Pymetrozine", "Dinotefuran"],
    chemicalsMy: ["Buprofezin", "Pymetrozine", "Dinotefuran"],
  },
  "Rice Leaf Folder": {
    key: "Rice Leaf Folder",
    nameEn: "Rice Leaf Folder",
    nameMy: "စပါးရွက်လိပ်ပိုး",
    organism: "Cnaphalocrocis medinalis",
    symptomsEn: [
      "Leaves longitudinally folded or rolled into tubes.",
      "Green caterpillars feed inside the fold, leaving white scraped patches.",
      "Severe folding reduces photosynthesis and grain filling.",
    ],
    symptomsMy: [
      "အရွက်များ အလျားလိုက် လိပ်နေခြင်း။",
      "လိပ်အတွင်း အစိမ်းရောင် ပိုးလောက်များ ရှိပြီး ရွက်မျက်နှာပြင် ခြစ်စားခံရသည်။",
      "ပြင်းထန်ပါက အစာချက်လုပ်မှု ကျဆင်းပြီး စပါးအဆန် မပြည့်။",
    ],
    controlsEn: [
      "Avoid dense planting and excess nitrogen.",
      "Hand-pick folded leaves with larvae when infestation is light.",
      "Keep field bunds weed-free.",
      "Use insecticides only when leaf damage exceeds threshold.",
    ],
    controlsMy: [
      "အပင်စိတ်လွန်းခြင်းနှင့် နိုက်ထရိုဂျင် လွန်ကဲခြင်း ရှောင်ပါ။",
      "ပိုးနည်းချိန်တွင် ရွက်လိပ်များကို လက်ဖြင့် ဖယ်ပါ။",
      "ကန်သင်းပေါင်းများ ရှင်းလင်းပါ။",
      "ရွက်ထိခိုက်မှု သတ်မှတ်အဆင့်ကျော်မှသာ ပိုးသတ်ဆေး သုံးပါ။",
    ],
    chemicals: ["Cartap hydrochloride", "Chlorantraniliprole", "Emamectin benzoate"],
    chemicalsMy: ["Cartap hydrochloride", "Chlorantraniliprole", "Emamectin benzoate"],
  },
  "Rice Gall Midge": {
    key: "Rice Gall Midge",
    nameEn: "Rice Gall Midge",
    nameMy: "စပါးဂေါ်လ်မစ်ပိုး",
    organism: "Orseolia oryzae",
    symptomsEn: [
      "Silver shoots / onion-like tubular galls instead of normal tillers.",
      "Affected tillers do not produce panicles.",
      "More common in wet seasons with continuous flooding.",
    ],
    symptomsMy: [
      "ပုံမှန်ပင်ပွားအစား ငွေရောင်/ကြက်သွန်ပုံ ပြွန်ပင် (silver shoot) ဖြစ်သည်။",
      "ထိခိုက်သော ပင်များတွင် အနှံ မထွက်။",
      "မိုးရာသီနှင့် ရေလှောင်ခင်းများတွင် ပိုတွေ့ရသည်။",
    ],
    controlsEn: [
      "Plant resistant varieties recommended for your region.",
      "Synchronize planting dates in the community.",
      "Remove and destroy silver shoots.",
      "Avoid prolonged deep flooding at early tillering when possible.",
    ],
    controlsMy: [
      "ဒေသအတွက် ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။",
      "စိုက်ချိန်ကို အနီးအနားခင်းများနှင့် ညီညာအောင် စိုက်ပါ။",
      "ငွေရောင်ပင်များကို ဖယ်ရှားဖျက်ဆီးပါ။",
      "ပင်ပွားအစောပိုင်းတွင် ရေနက်နက် ကြာကြာ မထားပါနှင့်။",
    ],
    chemicals: ["Carbosulfan", "Fipronil", "Cartap hydrochloride"],
    chemicalsMy: ["Carbosulfan", "Fipronil", "Cartap hydrochloride"],
  },
  "Rice Hispa": {
    key: "Rice Hispa",
    nameEn: "Rice Hispa",
    nameMy: "စပါးဟစ်စပါပိုး",
    organism: "Dicladispa armigera",
    symptomsEn: [
      "White parallel scraping streaks on the upper leaf surface.",
      "Spiny blue-black adult beetles may be seen on leaves.",
      "Heavy scraping turns leaves white and reduces vigor.",
    ],
    symptomsMy: [
      "ရွက်မျက်နှာပြင်ပေါ် အဖြူရောင် အစင်းခြစ်ရာများ။",
      "အရွက်ပေါ်တွင် အမဲ/ပြာမည်းရောင် ဆူးရှိ ပိုးကောင်များ တွေ့နိုင်သည်။",
      "ပြင်းထန်ပါက အရွက်ဖြူပြီး အပင်အားနည်းသည်။",
    ],
    controlsEn: [
      "Clear grassy weeds on bunds that harbor beetles.",
      "Hand-collect adults early in the morning when numbers are low.",
      "Avoid unnecessary insecticide sprays that disrupt predators.",
      "Treat when scraped leaf area becomes economically damaging.",
    ],
    controlsMy: [
      "ကန်သင်းပေါင်းမြက်များကို ရှင်းလင်းပါ။",
      "ပိုးနည်းချိန်တွင် နံနက်စောစော ပိုးကောင်များကို စုဆောင်းပါ။",
      "မလိုအပ်ဘဲ ပိုးသတ်ဆေး မဖျန်းပါနှင့်။",
      "ရွက်ထိခိုက်မှု စီးပွားရေးအရ ထိခိုက်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Malathion", "Lambda-cyhalothrin", "Cartap hydrochloride"],
    chemicalsMy: ["Malathion", "Lambda-cyhalothrin", "Cartap hydrochloride"],
  },
  "Pink Stem Borer": {
    key: "Pink Stem Borer",
    nameEn: "Pink Stem Borer",
    nameMy: "ပန်းရောင် ပင်စည်ထိုးပိုး",
    organism: "Sesamia inferens",
    symptomsEn: [
      "Dead hearts and whiteheads similar to yellow stem borer.",
      "Pinkish larvae often found near nodes inside the stem.",
      "Damage may appear later and near panicle base.",
    ],
    symptomsMy: [
      "ပင်သေနှင့် နှံဖြူများ ဖြစ်တတ်သည် (ဝါရောင်ပိုးနှင့် ဆင်တူ)။",
      "ပင်စည်အတွင်း ပန်းရောင် ပိုးလောက်များကို ဆစ်အနီးတွင် တွေ့ရတတ်သည်။",
      "အနှံခြေနားတွင် ထိခိုက်မှု ပိုတွေ့ရနိုင်သည်။",
    ],
    controlsEn: [
      "Remove dead hearts and whiteheads.",
      "Do not leave straw piles that shelter larvae/pupae.",
      "Use light traps to monitor moths.",
      "Apply insecticide only above threshold.",
    ],
    controlsMy: [
      "ပင်သေ/နှံဖြူပင် ဖယ်ရှားပါ။",
      "ကောက်ရိုးပုံများ မထားပါနှင့်။",
      "အလင်းထောင်ချောက်ဖြင့် စောင့်ကြည့်ပါ။",
      "သတ်မှတ်အဆင့်ကျော်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
    chemicalsMy: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
  },
  "Whitebacked Planthopper": {
    key: "Whitebacked Planthopper",
    nameEn: "Whitebacked Planthopper",
    nameMy: "အဖြူကျော ပင်စည်ခုန်ပိုး",
    organism: "Sogatella furcifera",
    symptomsEn: [
      "Hopperburn patches; plants yellow then dry from the tip.",
      "Pale hoppers with a white stripe on the back at the plant base.",
      "Often appears with or before brown planthopper outbreaks.",
    ],
    symptomsMy: [
      "ဟော့ပါဘန် — အပင်ဝါ/ခြောက်အစက်အပြောက်များ။",
      "ပင်ခြေတွင် ကျောဖြူအစင်းရှိ ပိုးကောင်များ။",
      "အညိုရောင်ခုန်ပိုးနှင့် အတူ/အရင် ကျရောက်တတ်သည်။",
    ],
    controlsEn: [
      "Avoid excess nitrogen and continuous deep water.",
      "Scout plant bases regularly.",
      "Conserve natural enemies; avoid early broad-spectrum sprays.",
      "Treat only when hopper counts exceed threshold.",
    ],
    controlsMy: [
      "နိုက်ထရိုဂျင် မလွန်ပါနှင့်။ ရေနက်နက် အမြဲမထားပါနှင့်။",
      "ပင်ခြေကို ပုံမှန် စစ်ဆေးပါ။",
      "သဘာဝရန်သူများ ထိန်းသိမ်းပါ။",
      "သတ်မှတ်အဆင့်ကျော်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Buprofezin", "Pymetrozine", "Dinotefuran"],
    chemicalsMy: ["Buprofezin", "Pymetrozine", "Dinotefuran"],
  },
  "Green Leafhopper": {
    key: "Green Leafhopper",
    nameEn: "Green Leafhopper",
    nameMy: "စပါးရွက်စိမ်းခုန်ပိုး",
    organism: "Nephotettix spp.",
    symptomsEn: [
      "Green wedge-shaped hoppers on leaves and tillers.",
      "Can transmit Tungro virus — yellow-orange leaves and stunting.",
      "High populations cause leaf yellowing and reduced vigor.",
    ],
    symptomsMy: [
      "အရွက်/ပင်ပေါ်တွင် အစိမ်းရောင် သပ်ပုံ ခုန်ပိုးများ။",
      "တန်ဂရိုဗိုင်းရပ်စ် သယ်ဆောင်နိုင် — ရွက်ဝါလိမ္မော်နှင့် ပင်ပုခြင်း။",
      "ပိုးများပါက အရွက်ဝါပြီး အပင်အားနည်းသည်။",
    ],
    controlsEn: [
      "Plant Tungro-resistant varieties where recommended.",
      "Remove diseased plants early.",
      "Keep bunds weed-free to reduce alternate hosts.",
      "Monitor and treat vectors when needed.",
    ],
    controlsMy: [
      "တန်ဂရိုခံနိုင်မျိုး စိုက်ပါ။",
      "ရောဂါကျပင်များကို စောစီးစွာ ဖယ်ပါ။",
      "ကန်သင်းပေါင်းများ ရှင်းပါ။",
      "ပိုးသယ်ဆောင်သူကို လိုအပ်မှ ထိန်းချုပ်ပါ။",
    ],
    chemicals: ["Imidacloprid", "Buprofezin", "Pymetrozine"],
    chemicalsMy: ["Imidacloprid", "Buprofezin", "Pymetrozine"],
  },
  "Rice Caseworm": {
    key: "Rice Caseworm",
    nameEn: "Rice Caseworm",
    nameMy: "စပါးအိတ်ပိုး",
    organism: "Parapoynx stagnalis",
    symptomsEn: [
      "Leaf tips cut and rolled into small floating or hanging cases.",
      "Larvae feed from inside leaf cases on the water surface.",
      "Common in continuously flooded nurseries and young fields.",
    ],
    symptomsMy: [
      "ရွက်ဖျားကို ဖြတ်ပြီး အရွက်အိတ်ငယ်များ ပြုလုပ်သည်။",
      "ပိုးလောက်များ ရေပေါ်အိတ်အတွင်းမှ စားသည်။",
      "ရေလှောင်ပျိုးခင်း/အပင်ငယ်ခင်းတွင် ပိုတွေ့ရသည်။",
    ],
    controlsEn: [
      "Drain the field briefly when infestation is high.",
      "Collect and destroy leaf cases.",
      "Avoid prolonged deep flooding in nurseries.",
      "Use insecticide only if damage is severe.",
    ],
    controlsMy: [
      "ပိုးများချိန်တွင် ရေကို ခဏချပါ။",
      "အရွက်အိတ်များကို စုဆောင်းဖျက်ဆီးပါ။",
      "ပျိုးခင်းတွင် ရေနက်နက် ကြာကြာ မထားပါနှင့်။",
      "ပြင်းထန်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
    chemicalsMy: ["Cartap hydrochloride", "Chlorantraniliprole", "Fipronil"],
  },
  "Whorl Maggot": {
    key: "Whorl Maggot",
    nameEn: "Whorl Maggot",
    nameMy: "စပါးပင်ထိပ်ယင်ပိုး",
    organism: "Hydrellia philippina",
    symptomsEn: [
      "Center leaves of young tillers become ragged with transparent patches.",
      "Deformed or pinholed emerging leaves from the whorl.",
      "Most damaging in early vegetative stage after transplanting.",
    ],
    symptomsMy: [
      "အပင်ငယ်၏ အလယ်ရွက်များ စုတ်ပြတ်/ဖောက်ထွင်း ပွင့်လင်းကွက်များ။",
      "ပင်ထိပ်မှ ထွက်သော ရွက်များ ပုံပျက်/အပေါက်များ။",
      "စိုက်ပြီးစ ပင်ပွားအစောပိုင်းတွင် ပိုထိခိုက်သည်။",
    ],
    controlsEn: [
      "Avoid very late transplanting into continuously flooded fields when flies are abundant.",
      "Maintain good early plant vigor with balanced fertilizer.",
      "Scout whorls for damage in the first weeks after transplanting.",
      "Treat only when damage is widespread.",
    ],
    controlsMy: [
      "ယင်များများချိန်တွင် နောက်ကျစိုက်ခြင်း ရှောင်ပါ။",
      "အစောပိုင်း အာဟာရ မျှတစွာ ပေးပါ။",
      "စိုက်ပြီးပထမပတ်များတွင် ပင်ထိပ်ကို စစ်ဆေးပါ။",
      "ထိခိုက်မှု ကျယ်ပြန့်မှသာ ဆေးသုံးပါ။",
    ],
    chemicals: ["Cartap hydrochloride", "Fipronil", "Chlorantraniliprole"],
    chemicalsMy: ["Cartap hydrochloride", "Fipronil", "Chlorantraniliprole"],
  },
  "Rice Armyworm": {
    key: "Rice Armyworm",
    nameEn: "Rice Armyworm",
    nameMy: "နှံဖြတ်ပိုး",
    organism: "Spodoptera / Mythimna spp.",
    symptomsEn: [
      "Sudden patches of skeletonized or cut leaves, often overnight.",
      "Smooth caterpillars feeding in groups, hiding by day.",
      "Can defoliate young plants rapidly during outbreaks.",
    ],
    symptomsMy: [
      "ညအတွင်း ရွက်များ စုတ်ပြတ်/အရိုးသာကျန်သော အစက်အပြောက်များ။",
      "ချောမွေ့သော ပိုးလောက်များ အစုလိုက် စားပြီး နေ့ခင်းတွင် ပုန်းနေတတ်သည်။",
      "ပေါက်ကွဲကျရောက်ချိန်တွင် အပင်ငယ်များကို မြန်မြန် စားနိုင်သည်။",
    ],
    controlsEn: [
      "Scout fields at night or early morning during outbreak seasons.",
      "Hand-collect caterpillar clusters when found early.",
      "Flood briefly or drain as locally recommended to disrupt larvae.",
      "Apply selective insecticides when defoliation risks yield.",
    ],
    controlsMy: [
      "ပေါက်ကွဲရာသီတွင် ည/နံနက်စောစော စိုက်ခင်း စစ်ဆေးပါ။",
      "ပိုးလောက်အစုများကို စောစီးစွာ လက်ဖြင့် ဖယ်ပါ။",
      "ဒေသအကြံပြုချက်အတိုင်း ရေစီမံခန့်ခွဲပါ။",
      "အရွက်ဆုံးရှုံးမှု အထွက်ထိခိုက်နိုင်မှ ဆေးသုံးပါ။",
    ],
    chemicals: ["Chlorantraniliprole", "Emamectin benzoate", "Cartap hydrochloride"],
    chemicalsMy: ["Chlorantraniliprole", "Emamectin benzoate", "Cartap hydrochloride"],
  },
  "Rice Bug": {
    key: "Rice Bug",
    nameEn: "Rice Bug",
    nameMy: "စပါးနှံစုပ်ပိုး",
    organism: "Leptocorisa spp.",
    symptomsEn: [
      "Bugs suck milky grains; spikelets become empty or half-filled.",
      "Strong bug odor when plants are disturbed.",
      "Most critical from flowering to milky/dough stage.",
    ],
    symptomsMy: [
      "နို့ရည်စပါးကို စုပ်သောကြောင့် အဆန်မပြည့်/အခွံတက်များ။",
      "အပင်လှုပ်လိုက်ပါက ပိုးနံ့ပြင်းပြင်း ရတတ်သည်။",
      "ပန်းပွင့်မှ နို့ရည်/မုန့်ဆန်အဆင့်တွင် အရေးကြီးဆုံး။",
    ],
    controlsEn: [
      "Keep bunds free of grassy weeds that host rice bugs.",
      "Synchronize planting to shorten the vulnerable period.",
      "Scout panicles at milky stage in the early morning.",
      "Spray only when bug counts exceed threshold.",
    ],
    controlsMy: [
      "ကန်သင်းပေါင်းမြက်များ ရှင်းပါ။",
      "စိုက်ချိန်ညီအောင် စိုက်၍ ထိခိုက်ကာလ တိုအောင်လုပ်ပါ။",
      "နို့ရည်အဆင့်တွင် နံနက်စောစော အနှံကို စစ်ဆေးပါ။",
      "သတ်မှတ်အရေအတွက်ကျော်မှသာ ဆေးဖျန်းပါ။",
    ],
    chemicals: ["Ethofenprox", "Malathion", "Lambda-cyhalothrin"],
    chemicalsMy: ["Ethofenprox", "Malathion", "Lambda-cyhalothrin"],
  },
  "Rice Thrips": {
    key: "Rice Thrips",
    nameEn: "Rice Thrips",
    nameMy: "စပါးသရစ်ပိုး",
    organism: "Stenchaetothrips biformis",
    symptomsEn: [
      "Young leaves roll inward; tips turn silvery or yellow.",
      "Tiny dark thrips inside rolled leaves.",
      "Common in nurseries and water-stressed young plants.",
    ],
    symptomsMy: [
      "အပင်ငယ်ရွက်များ အတွင်းလိပ်ပြီး ဖျားပိုင်း ငွေရောင်/ဝါရောင်။",
      "လိပ်အတွင်း သရစ်ပိုးငယ်များ တွေ့ရသည်။",
      "ပျိုးခင်းနှင့် ရေငတ်အပင်ငယ်များတွင် ပိုတွေ့ရသည်။",
    ],
    controlsEn: [
      "Keep nursery soil moist; avoid drought stress.",
      "Remove severely rolled leaves when infestation is light.",
      "Encourage rapid early growth with balanced nutrition.",
      "Treat nurseries when rolling becomes widespread.",
    ],
    controlsMy: [
      "ပျိုးခင်း မြေစိုထိန်းပါ။ ရေငတ်မထားပါနှင့်။",
      "ပိုးနည်းချိန်တွင် လိပ်နေသော ရွက်များကို ဖယ်ပါ။",
      "အစောပိုင်း ကြီးထွားမှု မြန်စေရန် အာဟာရ မျှတစွာ ပေးပါ။",
      "ရွက်လိပ်မှု ကျယ်ပြန့်မှ ပျိုးခင်းကို ဆေးသုံးပါ။",
    ],
    chemicals: ["Imidacloprid", "Spinosad", "Fipronil"],
    chemicalsMy: ["Imidacloprid", "Spinosad", "Fipronil"],
  },
};

const CHEM_STOP = new Set([
  'Field',
  'Follow',
  'Myanmar',
  'Default',
  'Healthy',
  'Always',
  'Apply',
  'Remove',
  'Confirm',
  'Treat',
  'Repeat',
  'Scout',
  'Keep',
  'Use',
  'Plant',
  'Burn',
  'Clear',
  'Avoid',
  'Select',
  'Maintain',
  'Improve',
  'Spray',
]);

export function extractChemicalsFromText(text: string): string[] {
  if (!text) return [];
  const matches =
    text.match(
      /[A-Z][A-Za-z]+(?:-[A-Za-z]+)+|[A-Z][a-z]{4,}(?:\s(?:Al|methyl|Hydroxide|Oxychloride|hydrochloride|benzoate|thuringiensis))?/g
    ) || [];
  const out: string[] = [];
  for (const raw of matches) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (name.length < 5 || CHEM_STOP.has(name)) continue;
    if (!out.some((x) => x.toLowerCase() === name.toLowerCase())) out.push(name);
  }
  return out.slice(0, 12);
}

function splitMySentences(text: string): string[] {
  return text
    .split(/(?<=။)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type LabTreatment = {
  stepsMy: string[];
  stepsEn: string[];
  chemicals: string[];
  chemicalsMy: string[];
};

/** Dedicated "how to treat now" copy for lab reports and the Detect page — all crops. */
export function labTreatmentFor(opts: {
  disease?: string;
  crop?: string;
  guide?: DiseaseGuide | null;
  expertProtocol?: string;
}): LabTreatment {
  const disease = opts.disease || '';
  const isHealthy = !disease || disease.toLowerCase() === 'healthy';
  if (isHealthy) {
    return {
      stepsMy: [
        'ကျန်းမာသော အပင်ဖြစ်၍ ဓာတုဆေးဖျန်းရန် မလိုပါ။ ပုံမှန် စိုက်ခင်း စစ်ဆေးမှု ဆက်လုပ်ပါ။',
      ],
      stepsEn: [
        'No chemical spray is needed. Continue regular field scouting and keep the crop healthy.',
      ],
      chemicals: [],
      chemicalsMy: [],
    };
  }

  const specificField = fieldTreatmentMy(disease, opts.crop);
  const cropFallback =
    (opts.crop && CROP_TREATMENT_FALLBACK_MY[opts.crop]) || CROP_TREATMENT_FALLBACK_MY.Default;
  const expert = opts.expertProtocol?.trim() || '';
  const guide = opts.guide;
  const chemicals = (
    guide?.chemicals?.length
      ? guide.chemicals
      : extractChemicalsFromText(expert || specificField || cropFallback)
  ).filter(Boolean);
  const chemicalsMy = guide?.chemicalsMy?.length ? guide.chemicalsMy : chemicals;

  let stepsMy: string[];
  if (expert) {
    const parts = splitMySentences(expert);
    stepsMy = parts.length > 1 ? parts : [expert];
  } else if (specificField) {
    stepsMy = splitMySentences(specificField);
  } else if (chemicals.length) {
    stepsMy = [
      'ရောဂါ/ပိုးကျပင်များကို ဖယ်ရှားပြီး ကွင်းသန့်ရှင်းရေး လုပ်ပါ။',
      `အကြံပြု ဆေးများ — ${chemicalsMy.join('၊ ')} ကို တံဆိပ်အတိုင်း ဖျန်းပါ။ ရွက်ဖျန်းအဖြစ် သုံးပါ (မျိုးစေ့/မြေသုံးဟု သတ်မှတ်မှသာ ထိုနည်းသုံးပါ)။`,
      'တံဆိပ်နှုန်းနှင့် ရိတ်သိမ်းမီ ကာလကို လိုက်နာပါ။ ဆေးသုံးမီ ဒေသကျွမ်းကျင်သူနှင့် တိုင်ပင်ပါ။',
    ];
  } else {
    stepsMy = splitMySentences(cropFallback);
  }

  const stepsEn: string[] = [
    'Treat the current outbreak first: remove heavily infected leaves, stems, or plants and keep the field clean.',
  ];
  if (chemicals.length) {
    stepsEn.push(
      `Apply at the product label rate (foliar spray unless seed or soil treatment is specified): ${chemicals.join(', ')}.`
    );
    stepsEn.push(
      'Repeat only as the label allows. Observe the pre-harvest interval before picking or harvesting.'
    );
  } else {
    stepsEn.push(
      'If a pesticide is needed, choose a labeled product for this crop and pest/disease after confirming the diagnosis.'
    );
  }
  stepsEn.push('Confirm chemical choice and rate with a local agronomist before spraying.');

  return { stepsMy, stepsEn, chemicals, chemicalsMy };
}

function genericGuide(disease: string, crop?: string): DiseaseGuide {
  const nameMy = diseaseNameMy(disease);
  const fieldMy =
    fieldTreatmentMy(disease, crop) ||
    (crop && CROP_TREATMENT_FALLBACK_MY[crop]) ||
    CROP_TREATMENT_FALLBACK_MY.Default;
  const chemicals = extractChemicalsFromText(fieldMy);
  return {
    key: disease,
    nameEn: disease,
    nameMy: nameMy !== '—' ? nameMy : disease,
    organism: fieldMy ? 'Field diagnosis (DOA field guide)' : '—',
    symptomsEn: [
      'Symptoms vary by crop — match leaf, stem, fruit, or pest damage carefully.',
      'Compare with known field guides and confirm with a local agronomist when unsure.',
    ],
    symptomsMy: [
      'ရောဂါ/ပိုး လက္ခဏာများသည် သီးနှံအလိုက် ကွဲပြားနိုင်သည်။',
      'ဒေသခံ စိုက်ပျိုးရေး ကျွမ်းကျင်သူနှင့် တိုင်ပင်အတည်ပြုပါ။',
    ],
    controlsEn: [
      'Remove heavily infected plant parts and keep the field clean.',
      'Improve air flow; avoid excess nitrogen where fungal disease pressure is high.',
      'Use resistant varieties when available and rotate crops where practical.',
      'Scout regularly and treat early using the treatment protocol.',
    ],
    controlsMy: [
      'ရောဂါ/ပိုးကျပင်ကြွင်းများကို ဖယ်ရှားပြီး ကွင်းသန့်ရှင်းရေး လုပ်ပါ။',
      'လေဝင်လေထွက် ကောင်းအောင် ထားပါ။ ရေမဝပ်စေရန်၊ နိုက်ထရိုဂျင် မလွန်အောင် ထိန်းပါ။',
      'ခံနိုင်ရည်ရှိမျိုးနှင့် သီးလှည့်စိုက်ပျိုးမှုကို အသုံးပြုပါ။',
      'ပုံမှန်ကင်းထောက်ပြီး ကုသနည်းအတိုင်း စောစီးစွာ ဆောင်ရွက်ပါ။',
    ],
    chemicals,
    chemicalsMy: chemicals,
  };
}

export function getDiseaseGuide(disease?: string, crop?: string): DiseaseGuide | null {
  if (!disease) return null;
  if (disease === 'Healthy' || disease.toLowerCase() === 'healthy') {
    return {
      key: 'Healthy',
      nameEn: 'Healthy',
      nameMy: 'ကျန်းမာသည်',
      organism: '—',
      symptomsEn: ['No disease or pest symptoms detected.'],
      symptomsMy: ['ရောဂါ/ပိုး လက္ခဏာ မတွေ့ရပါ။'],
      controlsEn: ['Continue regular field scouting.'],
      controlsMy: ['ပုံမှန် စိုက်ခင်း စစ်ဆေးမှု ဆက်လုပ်ပါ။'],
      chemicals: [],
      chemicalsMy: [],
    };
  }
  if (DISEASE_GUIDES[disease]) return DISEASE_GUIDES[disease];
  const lower = disease.toLowerCase();
  for (const g of Object.values(DISEASE_GUIDES)) {
    const key = g.key.toLowerCase();
    if (key === lower || g.nameEn.toLowerCase() === lower) return g;
    // Only allow substring match for longer names (avoid false hits like "al" in "healthy")
    if (key.length >= 5 && lower.includes(key)) return g;
  }
  return genericGuide(disease, crop);
}

export function treatmentProtocolFromGuide(disease?: string, lang: "en" | "my" = "my", crop?: string): string {
  const treatment = labTreatmentFor({
    disease,
    crop,
    guide: getDiseaseGuide(disease, crop),
  });
  return (lang === 'en' ? treatment.stepsEn : treatment.stepsMy).join('\n');
}

