SYSTEM_HINT = (
    "သင်သည် Smart Agro Community ၏ စိုက်ပျိုးရေး အကြံပေး AI ဖြစ်သည်။ "
    "ဆန်နှင့် ကြက်သွန် ရောဂါ၊ ရာသီဥတုနှင့် လက်တွေ့ စိုက်ပျိုးရေး အကြံဉာဏ် ပေးပါ။ "
    "ပေးထားသော LIVE WEATHER CONTEXT ကို အသုံးပြုပြီး တိကျသော အကြံပြုချက် ပေးပါ။"
)


def chat_reply(
    prompt: str,
    history: list[dict] | None = None,
    context: dict | None = None,
) -> str:
    history = history or []
    context = context or {}
    recent = " | ".join(h.get("text", "")[:80] for h in history[-3:])
    weather = (context.get("weatherText") or "").strip()
    profile = (context.get("farmerProfile") or "").strip()

    weather_line = (
        f"ရာသီဥတုအချက်အလက်: {weather[:420]}"
        if weather
        else "ရာသီဥတုအချက်အလက် မရရှိပါ — ယေဘုယျ မြန်မာရာသီ အကြံဉာဏ် ပေးပါ။"
    )
    profile_line = f"လယ်သမား: {profile[:200]}" if profile else ""

    return (
        f"{SYSTEM_HINT}\n\n"
        f"မေးခွန်း: {prompt[:300]}\n"
        f"{profile_line}\n"
        f"{weather_line}\n"
        f"အကြံပြုချက်: ကွင်းအတွင်း ရောဂါ လက္ခဏာကို ဓာတ်ပုံရိုက်ပြီး Detection စာမျက်နှာတွင် စစ်ဆေးပါ။ "
        f"စိုထိုင်းဆနှင့် မိုးရွာနိုင်ခြေ မြင့်ပါက မှိုရောဂါ ဖြစ်နိုင်ခြေ တက်နိုင်သည်။ "
        f"ရေသွင်းရေထုတ်နှင့် ကွင်းစောင့်ကြည့်မှုကို ရာသီဥတုနှင့် ကိုက်ညီအောင် ချိန်ညှိပါ။ "
        f"(context: {recent[:120]})"
    )
