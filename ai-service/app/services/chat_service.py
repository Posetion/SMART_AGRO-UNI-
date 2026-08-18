import re

GREETING_RE = re.compile(
    r"^(hi|hii+|hello|hey|yo|mingalaba|မင်္ဂလာပါ|ဟိုင်း|ဟယ်လို)[\s!.]*$",
    re.I,
)


def _is_greeting(prompt: str) -> bool:
    return bool(GREETING_RE.match((prompt or "").strip()))


def _looks_myanmar(text: str) -> bool:
    return bool(re.search(r"[\u1000-\u109F]", text or ""))


def chat_reply(
    prompt: str,
    history: list[dict] | None = None,
    context: dict | None = None,
) -> str:
    """Farmer-facing reply only — never echo system/profile/weather blocks."""
    text = (prompt or "").strip() or "hello"
    myanmar = _looks_myanmar(text) or _looks_myanmar(" ".join(h.get("text", "") for h in (history or [])[-2:]))

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

    if myanmar:
        return (
            "ကွင်းထဲမှာ ရွက်အနာ၊ အဝါရောင်၊ ပိုးစားရာကို စစ်ပါ။ "
            "ဓာတ်ပုံရိုက်ပြီး Detection တွင် တင်ပါ။ "
            "စိုထိုင်းဆ/မိုးများရင် မှိုရောဂါ သတိထားပါ။ "
            "ရေသွင်းရေထုတ်ကို ရာသီနှင့် ကိုက်အောင် ချိန်ပါ။ "
            "မသေချာရင် ဒေသခံ စိုက်ပျိုးရေး ကျွမ်းကျင်သူနှင့် တိုင်ပင်ပါ။"
        )

    return (
        "Check the field for spots, yellowing, or pest chewing. "
        "Take a clear leaf photo on the Detect page if you want a name for it. "
        "If it has been humid or rainy, watch for fungal disease. "
        "Match irrigation to the weather, and ask a local agronomist before spraying."
    )
