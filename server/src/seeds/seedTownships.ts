import { Township } from '../models/Township.js';
import { TownshipBoundary } from '../models/TownshipBoundary.js';

/** Major Myanmar cities / township centers for quick pick + map tiles. */
export const TOWNSHIPS = [
  { name: 'Yangon', nameEn: 'Yangon', nameMy: 'ရန်ကုန်', region: 'Yangon', lng: 96.1951, lat: 16.8661 },
  { name: 'Mandalay', nameEn: 'Mandalay', nameMy: 'မန္တလေး', region: 'Mandalay', lng: 96.0891, lat: 21.9588 },
  { name: 'Naypyidaw', nameEn: 'Naypyidaw', nameMy: 'နေပြည်တော်', region: 'Naypyidaw', lng: 96.0785, lat: 19.7633 },
  { name: 'Bago', nameEn: 'Bago', nameMy: 'ပဲခူး', region: 'Bago', lng: 96.4797, lat: 17.3352 },
  { name: 'Pathein', nameEn: 'Pathein', nameMy: 'ပုသိမ်', region: 'Ayeyarwady', lng: 94.735, lat: 16.7792 },
  { name: 'Mawlamyine', nameEn: 'Mawlamyine', nameMy: 'မော်လမြိုင်', region: 'Mon', lng: 97.6283, lat: 16.4905 },
  { name: 'Taunggyi', nameEn: 'Taunggyi', nameMy: 'တောင်ကြီး', region: 'Shan', lng: 97.0378, lat: 20.7892 },
  { name: 'Monywa', nameEn: 'Monywa', nameMy: 'မုံရွာ', region: 'Sagaing', lng: 95.1358, lat: 22.1086 },
  { name: 'Myitkyina', nameEn: 'Myitkyina', nameMy: 'မြစ်ကြီးနား', region: 'Kachin', lng: 97.3986, lat: 25.3865 },
  { name: 'Sittwe', nameEn: 'Sittwe', nameMy: 'စစ်တွေ', region: 'Rakhine', lng: 92.9000, lat: 20.1462 },
  { name: 'Magway', nameEn: 'Magway', nameMy: 'မကွေး', region: 'Magway', lng: 94.9167, lat: 20.15 },
  { name: 'Pyay', nameEn: 'Pyay', nameMy: 'ပြည်', region: 'Bago', lng: 95.2156, lat: 18.8246 },
  { name: 'Meiktila', nameEn: 'Meiktila', nameMy: 'မိတ္ထီလာ', region: 'Mandalay', lng: 95.8667, lat: 20.8667 },
  { name: 'Lashio', nameEn: 'Lashio', nameMy: 'လားရှိုး', region: 'Shan', lng: 97.75, lat: 22.9333 },
  { name: 'Dawei', nameEn: 'Dawei', nameMy: 'ထားဝယ်', region: 'Tanintharyi', lng: 98.1946, lat: 14.0823 },
  { name: 'Hpa-An', nameEn: 'Hpa-An', nameMy: 'ဘားအံ', region: 'Kayin', lng: 97.6333, lat: 16.8833 },
  { name: 'Loikaw', nameEn: 'Loikaw', nameMy: 'လွိုင်ကော်', region: 'Kayah', lng: 97.2094, lat: 19.677 },
  { name: 'Hakha', nameEn: 'Hakha', nameMy: 'ဟားခါး', region: 'Chin', lng: 93.6167, lat: 22.65 },
  { name: 'Pakokku', nameEn: 'Pakokku', nameMy: 'ပခုက္ကူ', region: 'Magway', lng: 94.8833, lat: 21.3333 },
  { name: 'Thanlyin', nameEn: 'Thanlyin', nameMy: 'သန်လျင်', region: 'Yangon', lng: 96.25, lat: 16.7667 },
  { name: 'Taungoo', nameEn: 'Taungoo', nameMy: 'တောင်ငူ', region: 'Bago', lng: 96.4333, lat: 18.9333 },
  { name: 'Kalay', nameEn: 'Kalay', nameMy: 'ကလေး', region: 'Sagaing', lng: 94.0167, lat: 23.1833 },
  { name: 'Myingyan', nameEn: 'Myingyan', nameMy: 'မြင်းခြံ', region: 'Mandalay', lng: 95.3883, lat: 21.46 },
  { name: 'Sagaing', nameEn: 'Sagaing', nameMy: 'စစ်ကိုင်း', region: 'Sagaing', lng: 95.9667, lat: 21.8833 },
];

function squarePolygon(lng: number, lat: number, delta = 0.15) {
  return [
    [
      [lng - delta, lat - delta],
      [lng + delta, lat - delta],
      [lng + delta, lat + delta],
      [lng - delta, lat + delta],
      [lng - delta, lat - delta],
    ],
  ];
}

export async function seedTownships() {
  for (const t of TOWNSHIPS) {
    await Township.findOneAndUpdate(
      { nameEn: t.nameEn },
      {
        name: t.name,
        nameEn: t.nameEn,
        nameMy: t.nameMy,
        region: t.region,
        coordinates: { type: 'Point', coordinates: [t.lng, t.lat] },
        isActive: true,
      },
      { upsert: true, new: true }
    );

    await TownshipBoundary.findOneAndUpdate(
      { name: t.name, region: t.region },
      {
        name: t.name,
        region: t.region,
        geometry: { type: 'Polygon', coordinates: squarePolygon(t.lng, t.lat) },
        riskLevel: 'Low',
        outbreakCount: 0,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  return TOWNSHIPS.length;
}
