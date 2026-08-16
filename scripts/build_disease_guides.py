import json
from pathlib import Path

guides = json.loads(Path(r"D:\SMART-AGRO\disease_guides_en.json").read_text(encoding="utf-8"))

fixes = {
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
    "Sheath Blight": [
        "Azoxystrobin",
        "Hexaconazole",
        "Propiconazole",
        "Validamycin",
        "Thiophanate-methyl",
    ],
    "Stem Rot": [
        "Propiconazole",
        "Chlorothalonil",
        "Thiophanate-methyl",
        "Benomyl",
    ],
}
for k, v in fixes.items():
    guides[k]["chemicals"] = v

my_names = {
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


def esc(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


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
lines.append("  controlsEn: string[];")
lines.append("  chemicals: string[];")
lines.append("};")
lines.append("")
lines.append("export const DISEASE_GUIDES: Record<string, DiseaseGuide> = {")

for key, g in guides.items():
    lines.append(f"  {esc(key)}: {{")
    lines.append(f"    key: {esc(key)},")
    lines.append(f"    nameEn: {esc(g['nameEn'])},")
    lines.append(f"    nameMy: {esc(my_names.get(key, key))},")
    lines.append(f"    organism: {esc(g['organism'])},")
    lines.append(f"    symptomsEn: {json.dumps(g['symptomsEn'], ensure_ascii=False)},")
    lines.append(f"    controlsEn: {json.dumps(g['controlsEn'], ensure_ascii=False)},")
    lines.append(f"    chemicals: {json.dumps(g['chemicals'], ensure_ascii=False)},")
    lines.append("  },")

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
lines.append("/** Short treatment protocol string for UI / API fallback. */")
lines.append(
    'export function treatmentProtocolFromGuide(disease?: string, lang: "en" | "my" = "en"): string {'
)
lines.append("  const g = getDiseaseGuide(disease);")
lines.append('  if (!g) return "";')
lines.append("  const steps = [...g.controlsEn];")
lines.append("  if (g.chemicals.length) {")
lines.append("    steps.push(")
lines.append("      lang === \"my\"")
lines.append('        ? `ဆေးဖြန်း: ${g.chemicals.join(", ")}`')
lines.append('        : `Spray if needed: ${g.chemicals.join(", ")}`')
lines.append("    );")
lines.append("  }")
lines.append('  return steps.join("\\n");')
lines.append("}")
lines.append("")

out = Path(r"D:\SMART-AGRO\client\src\data\diseaseGuides.ts")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("wrote", out)
