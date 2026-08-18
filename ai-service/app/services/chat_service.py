import re

GREETING_RE = re.compile(
    r"^(hi|hii+|hello|hey|yo|mingalaba|မင်္ဂလာပါ|ဟိုင်း|ဟယ်လို)[\s!.]*$",
    re.I,
)


def _is_greeting(prompt: str) -> bool:
    return bool(GREETING_RE.match((prompt or "").strip()))


def _looks_myanmar(text: str) -> bool:
    return bool(re.search(r"[\u1000-\u109F]", text or ""))


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def chat_reply(
    prompt: str,
    history: list[dict] | None = None,
    context: dict | None = None,
) -> str:
    """Farmer-facing reply only — never echo system/profile/weather blocks."""
    del context  # never quote private notes
    text = (prompt or "").strip() or "hello"
    myanmar = _looks_myanmar(text) or _looks_myanmar(
        " ".join(h.get("text", "") for h in (history or [])[-2:])
    )
    q = _norm(text)

    if _is_greeting(text):
        if myanmar or not re.search(r"[A-Za-z]", text):
            return (
                "မင်္ဂလာပါ။ ဘကြီးပျိုး ဖြစ်ပါတယ်။ "
                "သီးနှံရောဂါ၊ ပိုးမွှား၊ ရာသီဥတု၊ ရေသွင်းရေထုတ် အကြောင်း မေးနိုင်ပါတယ်။ "
                "ဘာကူညီရမလဲ။"
            )
        return (
            "Hello — this is BaGyi Pyoe. "
            "Ask me about crop disease, pests, weather, or what to do in the field today."
        )

    if re.search(r"what.{0,12}(is|are).{0,12}(a |the )?rice|rice plant|paddy plant|စပါးပင်|စပါးဆို", q):
        if myanmar:
            return (
                "စပါးပင် (Oryza sativa) သည် မြန်မာတွင် အဓိက စားကျက်သီးနှံ ဖြစ်သည်။ "
                "ရေထိုင်းသော လယ်ကွင်းတွင် စိုက်ပြီး ပျိုးထောင်၊ ကျဲစိုက် သို့မဟုတ် စက်စိုက် ပြုလုပ်သည်။ "
                "ပင်ပွား၊ အနှံထွက်၊ နို့ရည်၊ ရင့်မှည့် အဆင့်များ ရှိသည်။ "
                "ရွက်အနာ/အဝါ/ပိုးစားရာ တွေ့ရင် Detection တွင် ဓာတ်ပုံတင်ပါ။"
            )
        return (
            "A rice plant (Oryza sativa) is Myanmar’s main food crop. "
            "It grows in wet paddy fields after nursery or direct seeding, then tillers, "
            "heads, fills grain, and ripens. Watch leaves for spots, yellowing, or pest chewing — "
            "you can also send a leaf photo on the Detect page for a name."
        )

    if re.search(r"blast|ရွက်ဖောက်|leaf blast", q):
        return (
            "Rice blast makes diamond or spindle spots on leaves, often with a grey centre. "
            "Use a resistant variety, keep potassium up, avoid excess nitrogen, and do not leave "
            "infected debris. If it spreads, field guides list Isoprothiolane or Tricyclazole — "
            "follow the label and a local agronomist."
            if not myanmar
            else "စပါးရွက်ဖောက်ရောဂါသည် ရွက်ပေါ် စပယ်ပုံ/လေးထောင့်စက် အနာ ထွက်တတ်သည်။ "
            "ခံနိုင်မျိုး စိုက်ပါ။ ပိုတက်ရှ် ထည့်ပါ။ နိုက်ထရိုဂျင် မလွန်ပါနှင့်။ ရောဂါပင်ကြွင်း မီးရှို့ပါ။"
        )

    if re.search(r"cotton|ဝါ|gossypium", q):
        return (
            "Cotton is a dry-season field crop. Watch leaves for blight, spots, and sucking pests. "
            "Upload a clear leaf photo on Detect — Smart Agro can name several cotton problems, "
            "not only rice."
            if not myanmar
            else "ဝါသည် ခြောက်သွေ့ရာသီ သီးနှံ ဖြစ်သည်။ ရွက်အနာ၊ ပိုးစုပ်ရာကို စစ်ပါ။ "
            "Detection တွင် ဓာတ်ပုံရှင်းရှင်း တင်ပါ။"
        )

    if re.search(r"weather|rain|မိုး|ရာသီဥတု|humidity|အပူ", q):
        return (
            "Open the Weather page for your township’s 7-day forecast. "
            "After heavy rain or long humidity, scout for fungal leaf spots and delay spraying until leaves dry."
            if not myanmar
            else "Weather စာမျက်နှာတွင် သင့်မြို့နယ် ၇ ရက် ခန့်မှန်းချက် ကြည့်ပါ။ "
            "မိုးများ/စိုထိုင်းဆမြင့်ရင် မှိုရောဂါ စစ်ပါ။ ရွက်မခြောက်ခင် ဆေးမဖျန်းပါနှင့်။"
        )

    if myanmar:
        return (
            f"«{text[:80]}» အကြောင်း — ကွင်းထဲမှာ ရွက်အနာ၊ အဝါ၊ ပိုးစားရာကို စစ်ပါ။ "
            "ရှင်းသော ရွက်ဓာတ်ပုံကို Detection တွင် တင်ရင် အမည်ပေးနိုင်သည်။ "
            "စိုထိုင်းဆ/မိုးများရင် မှိုရောဂါ သတိထားပါ။ ရေသွင်းရေထုတ်ကို ရာသီနှင့် ကိုက်အောင် ချိန်ပါ။"
        )

    return (
        f"On “{text[:80]}”: check the field for spots, yellowing, or pest chewing. "
        "A clear leaf photo on Detect can name the problem. "
        "If it has been humid or rainy, watch for fungal disease and match irrigation to the weather."
    )
