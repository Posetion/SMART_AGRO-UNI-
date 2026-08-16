"""Parse Myanmar Disease.docx section and merge symptoms/controls into diseaseGuides.ts"""
from __future__ import annotations

import json
import re
from pathlib import Path

RAW = Path(r"D:\SMART-AGRO\disease_my_raw.txt").read_text(encoding="utf-8")
GUIDES_TS = Path(r"D:\SMART-AGRO\client\src\data\diseaseGuides.ts")

# Map Myanmar heading blocks to canonical keys by English name in parentheses / known titles
KEY_PATTERNS = [
    (r"Blast|ဂုတ်ကျိုး", "Blast"),
    (r"Brown Spot|ရွက်ညိုပြောက်ရောဂါ\s*\(", "Brown Spot"),
    (r"Bacterial leaf blight|ဘက်တီးရီးယားရွက်ခြောက်", "Bacterial Leaf Blight"),
    (r"Bacterial leaf streak|ဘက်တီးရီးယားရွက်စင်း", "Bacterial Leaf Streak"),
    (r"Bakanae|ပင်ရှည်ရောဂါ|ပျိုးပင်နာကျ", "Bakanae"),
    (r"False Smut|မှိုသီးရောဂါ", "False Smut"),
    (r"Narrow Brown Spot|ရွက်ညိုပြောက်ရှည်", "Narrow Brown Spot"),
    (r"Sheath Blight|ရွက်ဖုံးခြောက်ရောဂါ", "Sheath Blight"),
    (r"Sheath Rot|ရွက်ဖုံးပုပ်ရောဂါ", "Sheath Rot"),
    (r"ပင်စည်ပုပ်|Stem Rot|Magnaporthe", "Stem Rot"),
]


def split_blocks(text: str) -> list[str]:
    # Split on Myanmar numbered disease headers like (၁) (၂) ...
    parts = re.split(r"\([၀-၉0-9]+\)\s*", text)
    return [p.strip() for p in parts if p.strip() and "ရောဂါ" in p[:80]]


def detect_key(block: str) -> str | None:
    head = block[:220]
    for pat, key in KEY_PATTERNS:
        if re.search(pat, head, re.I):
            return key
    return None


def extract_section(block: str, start_pats: list[str], end_pats: list[str]) -> str:
    start = None
    for pat in start_pats:
        m = re.search(pat, block)
        if m:
            start = m.end()
            break
    if start is None:
        return ""
    end = len(block)
    for pat in end_pats:
        m = re.search(pat, block[start:])
        if m:
            end = start + m.start()
            break
    return block[start:end].strip()


def bullets_from_text(section: str) -> list[str]:
    if not section:
        return []
    # Normalize
    s = section.replace("\u00a0", " ")
    # Prefer dash bullets
    chunks = re.split(r"\n\s*[-–—•\*]\s*", "\n" + s)
    items = [c.strip(" \n\t-–—•*") for c in chunks if c.strip(" \n\t-–—•*")]
    # If too few, split by sentence-ish Myanmar periods / newlines
    if len(items) <= 1:
        lines = [ln.strip(" \t-–—•*") for ln in s.splitlines() if ln.strip()]
        items = []
        buf = ""
        for ln in lines:
            if re.match(r"^[\*•]", ln) or ln.startswith("-"):
                if buf:
                    items.append(buf.strip())
                buf = re.sub(r"^[\*•\-]\s*", "", ln)
            else:
                buf = (buf + " " + ln).strip() if buf else ln
        if buf:
            items.append(buf.strip())
    # Clean chemical-only lines out of control bullets sometimes mixed
    cleaned = []
    for it in items:
        it = re.sub(r"\s+", " ", it).strip()
        if len(it) < 8:
            continue
        cleaned.append(it)
    return cleaned


def extract_chemicals_my(block: str) -> list[str]:
    chems = []
    for m in re.finditer(
        r"\*\s*([A-Za-z][A-Za-z0-9\+\-\s]+?)\s*\(([^)]+)\)", block
    ):
        en = m.group(1).strip().rstrip(",")
        my = m.group(2).strip()
        # skip if looks like sentence
        if len(en.split()) > 5:
            continue
        chems.append(f"{en} ({my})")
    # also lines like Kasugamycin (ကာ...), Bismerthiazol (...)
    for m in re.finditer(
        r"([A-Z][A-Za-z\-]+(?:\s[A-Z][A-Za-z\-]+)?)\s*\(([^)]*[\u1000-\u109F][^)]*)\)",
        block,
    ):
        en = m.group(1).strip()
        my = m.group(2).strip()
        item = f"{en} ({my})"
        if item not in chems and len(en) < 40:
            chems.append(item)
    # dedupe keeping order
    seen = set()
    out = []
    for c in chems:
        k = c.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(c)
    return out


my_data: dict[str, dict] = {}
for block in split_blocks(RAW):
    key = detect_key(block)
    if not key:
        print("UNMAPPED", block[:80].replace("\n", " "))
        continue
    symptoms = extract_section(
        block,
        [r"ရောဂါလက္ခဏာများ", r"ရောဂါလက္ခဏာရပ်", r"ရောဂါလက္ခဏာ"],
        [r"ကာကွယ်နှိမ်နင်းနည်း", r"ကာကွယ်နှိမ်နင်း"],
    )
    controls = extract_section(
        block,
        [r"ကာကွယ်နှိမ်နင်းနည်းများ?", r"ကာကွယ်နှိမ်နင်းနည်း[-–—:]?"],
        [],
    )
    # Drop chemical header fluff from controls text for bulletizing; keep dashes
    ctrl_text = re.split(r"အောက်ပါ.*ဆေး", controls)[0]
    my_data[key] = {
        "symptomsMy": bullets_from_text(symptoms),
        "controlsMy": bullets_from_text(ctrl_text),
        "chemicalsMy": extract_chemicals_my(block),
    }
    print(
        key,
        "sym",
        len(my_data[key]["symptomsMy"]),
        "ctrl",
        len(my_data[key]["controlsMy"]),
        "chem",
        len(my_data[key]["chemicalsMy"]),
    )

# Load existing guides by evaluating JSON-like from TS is hard; rewrite via regex replace per disease
ts = GUIDES_TS.read_text(encoding="utf-8")

# Update type
ts = ts.replace(
    """export type DiseaseGuide = {
  key: string;
  nameEn: string;
  nameMy: string;
  organism: string;
  symptomsEn: string[];
  controlsEn: string[];
  chemicals: string[];
};""",
    """export type DiseaseGuide = {
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
};""",
)

for key, data in my_data.items():
    # Find disease object and inject fields after symptomsEn / controlsEn / chemicals
    pat = rf'("{re.escape(key)}": \{{.*?"symptomsEn": )(\[.*?\])(,\s*"controlsEn": )(\[.*?\])(,\s*"chemicals": )(\[.*?\])(,\s*\}})'
    m = re.search(pat, ts, re.S)
    if not m:
        print("NO MATCH for", key)
        continue
    sym_my = json.dumps(data["symptomsMy"], ensure_ascii=False)
    ctrl_my = json.dumps(data["controlsMy"], ensure_ascii=False)
    chem_my = json.dumps(data["chemicalsMy"], ensure_ascii=False)
    repl = (
        m.group(1)
        + m.group(2)
        + f',\n    "symptomsMy": {sym_my}'
        + m.group(3)
        + m.group(4)
        + f',\n    "controlsMy": {ctrl_my}'
        + m.group(5)
        + m.group(6)
        + f',\n    "chemicalsMy": {chem_my}'
        + m.group(7)
    )
    ts = ts[: m.start()] + repl + ts[m.end() :]

# For any disease missing MY arrays, add empty arrays
for key in [
    "Blast",
    "Brown Spot",
    "Bacterial Leaf Blight",
    "Bacterial Leaf Streak",
    "Bakanae",
    "False Smut",
    "Narrow Brown Spot",
    "Sheath Blight",
    "Sheath Rot",
    "Stem Rot",
]:
    if f'"{key}"' not in ts:
        continue
    block_m = re.search(rf'"{re.escape(key)}": \{{.*?\n  \}},', ts, re.S)
    if not block_m:
        continue
    block = block_m.group(0)
    if '"symptomsMy"' not in block:
        block = block.replace(
            '"symptomsEn":',
            '"symptomsEn":',
        )
        # insert before controlsEn
        block = re.sub(
            r'("symptomsEn": \[.*?\]),(\s*"controlsEn")',
            r'\1,\n    "symptomsMy": [],\2',
            block,
            count=1,
            flags=re.S,
        )
        block = re.sub(
            r'("controlsEn": \[.*?\]),(\s*"chemicals")',
            r'\1,\n    "controlsMy": [],\2',
            block,
            count=1,
            flags=re.S,
        )
        block = re.sub(
            r'("chemicals": \[.*?\]),(\s*\})',
            r'\1,\n    "chemicalsMy": [],\2',
            block,
            count=1,
            flags=re.S,
        )
        ts = ts[: block_m.start()] + block + ts[block_m.end() :]

GUIDES_TS.write_text(ts, encoding="utf-8")
print("updated", GUIDES_TS)
