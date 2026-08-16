/**
 * Myanmar Admin-1 regions/states for the Weather page map tiles.
 * Coordinates point at each capital / main city for Open-Meteo lookup.
 */
export type WeatherRegion = {
  id: string;
  nameEn: string;
  nameMy: string;
  kind: 'Region' | 'State' | 'Union Territory';
  lat: number;
  lng: number;
};

export const MYANMAR_WEATHER_REGIONS: WeatherRegion[] = [
  {
    id: 'ayeyarwady',
    nameEn: 'Ayeyarwady Region',
    nameMy: 'ဧရာဝတီတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 16.7792,
    lng: 94.7321,
  },
  {
    id: 'bago',
    nameEn: 'Bago Region',
    nameMy: 'ပဲခူးတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 17.3365,
    lng: 96.4797,
  },
  {
    id: 'sagaing',
    nameEn: 'Sagaing Region',
    nameMy: 'စစ်ကိုင်းတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 21.8787,
    lng: 95.9796,
  },
  {
    id: 'mandalay',
    nameEn: 'Mandalay Region',
    nameMy: 'မန္တလေးတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 21.9588,
    lng: 96.0891,
  },
  {
    id: 'magway',
    nameEn: 'Magway Region',
    nameMy: 'မကွေးတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 20.1496,
    lng: 94.941,
  },
  {
    id: 'shan',
    nameEn: 'Shan State',
    nameMy: 'ရှမ်းပြည်နယ်',
    kind: 'State',
    lat: 20.7888,
    lng: 97.0376,
  },
  {
    id: 'kachin',
    nameEn: 'Kachin State',
    nameMy: 'ကချင်ပြည်နယ်',
    kind: 'State',
    lat: 25.3838,
    lng: 97.3956,
  },
  {
    id: 'mon',
    nameEn: 'Mon State',
    nameMy: 'မွန်ပြည်နယ်',
    kind: 'State',
    lat: 16.4821,
    lng: 97.628,
  },
  {
    id: 'kayin',
    nameEn: 'Kayin State',
    nameMy: 'ကရင်ပြည်နယ်',
    kind: 'State',
    lat: 16.889,
    lng: 97.6333,
  },
  {
    id: 'rakhine',
    nameEn: 'Rakhine State',
    nameMy: 'ရခိုင်ပြည်နယ်',
    kind: 'State',
    lat: 20.1462,
    lng: 92.8984,
  },
  {
    id: 'tanintharyi',
    nameEn: 'Tanintharyi Region',
    nameMy: 'တနင်္သာရီတိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 14.0828,
    lng: 98.1915,
  },
  {
    id: 'naypyidaw',
    nameEn: 'Nay Pyi Taw Union Territory',
    nameMy: 'နေပြည်တော် ပြည်ထောင်စုနယ်မြေ',
    kind: 'Union Territory',
    lat: 19.7633,
    lng: 96.0785,
  },
  {
    id: 'chin',
    nameEn: 'Chin State',
    nameMy: 'ချင်းပြည်နယ်',
    kind: 'State',
    lat: 22.6445,
    lng: 93.6126,
  },
  {
    id: 'kayah',
    nameEn: 'Kayah State',
    nameMy: 'ကယားပြည်နယ်',
    kind: 'State',
    lat: 19.6742,
    lng: 97.2094,
  },
  {
    id: 'yangon',
    nameEn: 'Yangon Region',
    nameMy: 'ရန်ကုန်တိုင်းဒေသကြီး',
    kind: 'Region',
    lat: 16.8661,
    lng: 96.1951,
  },
];
