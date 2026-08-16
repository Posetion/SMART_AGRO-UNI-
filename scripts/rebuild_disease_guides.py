# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
import zipfile
from html import unescape
from pathlib import Path

DOCX = Path(r"c:\Users\ASUS\Downloads\Telegram Desktop\Disease.docx")
OUT = Path(r"D:\SMART-AGRO\client\src\data\diseaseGuides.ts")


def docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    text = re.sub(r"</w:p>", "\n", xml)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text)


def split_my_sentences(para: str) -> list[str]:
    para = re.sub(r"\s+", " ", para).strip()
    if not para:
        return []
    parts = [p.strip() for p in para.split("။") if p.strip()]
    return [p + "။" for p in parts]


def dash_bullets(section: str) -> list[str]:
    items: list[str] = []
    for ln in section.splitlines():
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r"^[-–—•\*]", ln) or ln.startswith("-"):
            ln = re.sub(r"^[-–—•\*]+\s*", "", ln).strip()
            # stop at chemical spray intro
            if "အောက်ပါ" in ln and "ဆေး" in ln:
                continue
            if ln:
                items.append(re.sub(r"\s+", " ", ln))
        elif items and not re.search(r"ရောဂါလက္ခဏာ|ကာကွယ်|ရောဂါပိုးအမည်|ရောဂါဖြစ်စေ", ln):
            # continuation line of previous bullet
            if "အောက်ပါ" in ln and "ဆေး" in ln:
                continue
            if re.match(r"^\*", ln):
                continue
            items[-1] = re.sub(r"\s+", " ", (items[-1] + " " + ln).strip())
    return items


def parse_chemicals(block: str) -> list[str]:
    found: list[str] = []
    for m in re.finditer(
        r"([A-Za-z][A-Za-z0-9\+\- ]{1,40}?)\s*\(([^)]*[\u1000-\u109F][^)]*)\)",
        block,
    ):
        en = m.group(1).strip().rstrip(",")
        my = m.group(2).strip()
        if len(en.split()) > 4:
            continue
        item = f"{en} ({my})"
        if item not in found:
            found.append(item)
    return found


def parse_my(text: str) -> dict[str, dict]:
    idx = text.find("Here is the complete English translation")
    my = text[:idx] if idx >= 0 else text
    # Only split on disease headers, not mid-sentence (၁) / (၃၅) sizes
    blocks = re.split(r"\([၀-၉0-9]+\)\s*(?=ရောဂါပိုးအမည်)", my)
    # More-specific names first (Narrow Brown Spot before Brown Spot)
    key_order = [
        ("Blast", r"ဂုတ်ကျိုး|\(Blast\)"),
        ("Narrow Brown Spot", r"Narrow Brown Spot|ရွက်ညိုပြောက်ရှည်"),
        ("Brown Spot", r"Brown Spot|ရွက်ညိုပြောက်ရောဂါ"),
        ("Bacterial Leaf Blight", r"Bacterial leaf blight|ရွက်ခြောက်ရောဂါ"),
        ("Bacterial Leaf Streak", r"Bacterial leaf streak|ရွက်စင်းရောဂါ"),
        ("Bakanae", r"Bakanae|ပင်ရှည်ရောဂါ"),
        ("False Smut", r"False Smut|မှိုသီးရောဂါ"),
        ("Sheath Blight", r"Sheath Blight|ရွက်ဖုံးခြောက်ရောဂါ"),
        ("Sheath Rot", r"Sheath Rot|ရွက်ဖုံးပုပ်ရောဂါ"),
        ("Stem Rot", r"ပင်စည်ပုပ်|sigmoideum|Magnaporthe"),
    ]
    out: dict[str, dict] = {}
    for block in blocks:
        block = block.replace("\u200b", "").replace("\ufeff", "")
        if "ရောဂါ" not in block[:120]:
            continue
        key = None
        for k, pat in key_order:
            if re.search(pat, block[:280], re.I):
                key = k
                break
        if not key or key in out:
            continue

        # symptoms between လက္ခဏာ and ကာကွယ်
        m = re.search(
            r"ရောဂါလက္ခဏာ(?:များ|ရပ်)?\s*(.*?)ကာကွယ်နှိမ်နင်းနည်း",
            block,
            re.S,
        )
        symptoms = split_my_sentences(m.group(1)) if m else []

        m2 = re.search(r"ကာကွယ်နှိမ်နင်းနည်း(?:များ)?[-–—:]?\s*(.*)", block, re.S)
        controls_raw = m2.group(1) if m2 else ""
        # cut chemicals part
        controls_raw = re.split(r"အောက်ပါ.*ဆေး", controls_raw)[0]
        first_line, _, rest = controls_raw.partition("\n")
        first_line = first_line.strip(" -\t")
        controls = dash_bullets(rest if rest else controls_raw)
        if first_line and not first_line.startswith("*") and "ဆေး" not in first_line[:6]:
            # header leftover control sentence (common for Blast)
            if not controls or controls[0] != first_line:
                controls = [re.sub(r"\s+", " ", first_line), *controls]

        # Drop incomplete trailing intros (e.g. "ရောဂါကျရောက်ပါက" before chemical list)
        controls = [
            c
            for c in controls
            if c
            and not re.fullmatch(r"ရောဂါကျရောက်ပါက။?", c)
            and len(c) > 8
        ]

        chems = parse_chemicals(block)
        out[key] = {
            "symptomsMy": symptoms,
            "controlsMy": controls,
            "chemicalsMy": chems,
        }
    return out


def parse_en(text: str) -> dict[str, dict]:
    idx = text.find("Here is the complete English translation")
    en = text[idx:] if idx >= 0 else text
    blocks = re.split(r"\(\d+\)\s*Disease Name:\s*", en)[1:]
    key_map = {
        "Rice Blast": "Blast",
        "Blast": "Blast",
        "Brown Spot": "Brown Spot",
        "Bacterial Leaf Blight": "Bacterial Leaf Blight",
        "Bacterial Leaf Streak": "Bacterial Leaf Streak",
        "Bakanae (Foolish Seedling Disease)": "Bakanae",
        "Bakanae": "Bakanae",
        "False Smut": "False Smut",
        "Narrow Brown Leaf Spot": "Narrow Brown Spot",
        "Narrow Brown Spot": "Narrow Brown Spot",
        "Sheath Blight": "Sheath Blight",
        "Sheath Rot": "Sheath Rot",
        "Stem Rot": "Stem Rot",
    }
    out: dict[str, dict] = {}
    for b in blocks:
        lines = [ln.strip() for ln in b.splitlines() if ln.strip()]
        if not lines:
            continue
        name = lines[0]
        key = key_map.get(name)
        if not key:
            for kn, kv in key_map.items():
                if kn.lower() in name.lower():
                    key = kv
                    break
        if not key:
            continue
        organism = ""
        symptoms: list[str] = []
        controls: list[str] = []
        chemicals: list[str] = []
        mode = None
        for ln in lines[1:]:
            if ln.startswith("Causal Organism:"):
                organism = ln.split(":", 1)[1].strip()
                mode = None
                continue
            if ln == "Symptoms":
                mode = "sym"
                continue
            if ln == "Control Measures":
                mode = "ctrl"
                continue
            if ln.startswith("If infected") or ln.startswith("Spray the following"):
                mode = "chem"
                continue
            if mode == "sym":
                symptoms.append(ln)
            elif mode == "ctrl":
                if re.match(
                    r"^(Isoprothiolane|Tricyclazole|Thiophanate|Prochloraz|Propiconazole|Difenoconazole|Kasugamycin|Copper|Oxolinic|Benomyl|Carbendazim|Mancozeb|Hexaconazole|Azoxystrobin|Chlorothalonil|Validamycin|Bismerthiazol)",
                    ln,
                ):
                    for part in re.split(r",\s*", ln):
                        part = part.strip()
                        if part:
                            chemicals.append(part)
                else:
                    controls.append(ln)
            elif mode == "chem":
                for part in re.split(r",\s*", ln):
                    part = part.strip()
                    if part:
                        chemicals.append(part)
        # normalize chemicals
        chem_fix = {
            "Bacterial Leaf Blight": [
                "Isoprothiolane",
            ]
        }
        # apply known clean lists later
        out[key] = {
            "nameEn": key,
            "organism": organism,
            "symptomsEn": symptoms,
            "controlsEn": controls,
            "chemicals": chemicals,
        }
    # clean chem lists
    clean = {
        "Blast": ["Isoprothiolane", "Tricyclazole", "Thiophanate-methyl", "Prochloraz"],
        "Brown Spot": ["Propiconazole", "Thiophanate-methyl", "Difenoconazole"],
        "Bacterial Leaf Blight": [
            "Kasugamycin",
            "Bismerthiazol",
            "Copper Oxychloride",
            "Oxolinic Acid",
        ],
        "Bacterial Leaf Streak": [
            "Kasugamycin",
            "Bismerthiazol",
            "Copper Oxychloride",
            "Oxolinic Acid",
            "Thiophanate-methyl",
        ],
        "Bakanae": [
            "Propiconazole",
            "Benomyl",
            "Carbendazim",
            "Mancozeb",
            "Hexaconazole",
        ],
        "False Smut": ["Propiconazole", "Azoxystrobin", "Benomyl", "Carbendazim"],
        "Narrow Brown Spot": [
            "Propiconazole",
            "Tricyclazole",
            "Thiophanate-methyl + Thiram",
            "Chlorothalonil",
            "Carbendazim",
        ],
        "Sheath Blight": [
            "Azoxystrobin",
            "Hexaconazole",
            "Propiconazole",
            "Validamycin",
            "Thiophanate-methyl",
        ],
        "Sheath Rot": [
            "Propiconazole",
            "Difenoconazole",
            "Chlorothalonil",
            "Thiophanate-methyl",
            "Benomyl",
        ],
        "Stem Rot": [
            "Propiconazole",
            "Chlorothalonil",
            "Thiophanate-methyl",
            "Benomyl",
        ],
    }
    for k, chems in clean.items():
        if k in out:
            out[k]["chemicals"] = chems
    return out


MY_NAMES = {
    "Blast": "စပါးဂုတ်ကျိုးရောဂါ (Blast)",
    "Brown Spot": "စပါးရွက်ညိုပြောက်ရောဂါ (Brown Spot)",
    "Bacterial Leaf Blight": "ဘက်တီးရီးယားရွက်ခြောက်ရောဂါ (Bacterial leaf blight)",
    "Bacterial Leaf Streak": "ဘက်တီးရီးယားရွက်စင်းရောဂါ (Bacterial leaf streak)",
    "Bakanae": "ပင်ရှည်ရောဂါ / ပျိုးပင်နာကျရောဂါ (Bakanae)",
    "False Smut": "စပါးမှိုသီးရောဂါ (False Smut)",
    "Narrow Brown Spot": "ရွက်ညိုပြောက်ရှည်ရောဂါ (Narrow Brown Spot)",
    "Sheath Blight": "စပါးရွက်ဖုံးခြောက်ရောဂါ (Sheath Blight)",
    "Sheath Rot": "ရွက်ဖုံးပုပ်ရောဂါ (Sheath Rot)",
    "Stem Rot": "စပါးပင်စည်ပုပ်ရောဂါ (Stem Rot)",
}


def main() -> None:
    text = docx_text(DOCX)
    en = parse_en(text)
    my = parse_my(text)

    # Blast first control line special case from "ကာကွယ်နှိမ်နင်းနည်း- ..."
    if "Blast" in my and my["Blast"]["controlsMy"]:
        # ensure seed treatment line present
        pass

    # Special: Blast symptoms were one paragraph - ok
    # Brown Spot first control after header without leading dash on first? dash_bullets handles -

    lines: list[str] = []
    lines.append(
        "/** Official rice disease guides from Disease.docx (Smart Agro lab report source). */"
    )
    lines.append("export type DiseaseGuide = {")
    lines.append("  key: string;")
    lines.append("  nameEn: string;")
    lines.append("  nameMy: string;")
    lines.append("  organism: string;")
    lines.append("  symptomsEn: string[];")
    lines.append("  symptomsMy: string[];")
    lines.append("  controlsEn: string[];")
    lines.append("  controlsMy: string[];")
    lines.append("  chemicals: string[];")
    lines.append("  chemicalsMy: string[];")
    lines.append("};")
    lines.append("")
    lines.append("export const DISEASE_GUIDES: Record<string, DiseaseGuide> = {")

    order = [
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
    ]
    for key in order:
        g = en[key]
        m = my.get(key, {})
        obj = {
            "key": key,
            "nameEn": g["nameEn"],
            "nameMy": MY_NAMES[key],
            "organism": g["organism"],
            "symptomsEn": g["symptomsEn"],
            "symptomsMy": m.get("symptomsMy", []),
            "controlsEn": g["controlsEn"],
            "controlsMy": m.get("controlsMy", []),
            "chemicals": g["chemicals"],
            "chemicalsMy": m.get("chemicalsMy", []),
        }
        # fallback: if chemicalsMy empty, synthesize from EN only
        if not obj["chemicalsMy"] and obj["chemicals"]:
            obj["chemicalsMy"] = list(obj["chemicals"])
        lines.append(f"  {json.dumps(key, ensure_ascii=False)}: {{")
        for field, val in obj.items():
            lines.append(f"    {field}: {json.dumps(val, ensure_ascii=False)},")
        lines.append("  },")
        print(
            key,
            "EN",
            len(obj["symptomsEn"]),
            len(obj["controlsEn"]),
            "MY",
            len(obj["symptomsMy"]),
            len(obj["controlsMy"]),
            len(obj["chemicalsMy"]),
        )

    lines.append("};")
    lines.append("")
    lines.append("export function getDiseaseGuide(disease?: string): DiseaseGuide | null {")
    lines.append("  if (!disease) return null;")
    lines.append("  if (DISEASE_GUIDES[disease]) return DISEASE_GUIDES[disease];")
    lines.append("  const lower = disease.toLowerCase();")
    lines.append("  for (const g of Object.values(DISEASE_GUIDES)) {")
    lines.append(
        "    if (g.key.toLowerCase() === lower || g.nameEn.toLowerCase() === lower) return g;"
    )
    lines.append("    if (lower.includes(g.key.toLowerCase())) return g;")
    lines.append("  }")
    lines.append("  return null;")
    lines.append("}")
    lines.append("")
    lines.append(
        'export function treatmentProtocolFromGuide(disease?: string, lang: "en" | "my" = "en"): string {'
    )
    lines.append("  const g = getDiseaseGuide(disease);")
    lines.append('  if (!g) return "";')
    lines.append(
        "  const steps = lang === \"my\" && g.controlsMy.length ? [...g.controlsMy] : [...g.controlsEn];"
    )
    lines.append("  const chems = lang === \"my\" && g.chemicalsMy.length ? g.chemicalsMy : g.chemicals;")
    lines.append("  if (chems.length) {")
    lines.append(
        '    steps.push(lang === "my" ? `ဆေးဖြန်း: ${chems.join(", ")}` : `Spray if needed: ${chems.join(", ")}`);'
    )
    lines.append("  }")
    lines.append('  return steps.join("\\n");')
    lines.append("}")
    lines.append("")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
