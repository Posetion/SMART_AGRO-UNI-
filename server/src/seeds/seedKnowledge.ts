import { Knowledge } from '../models/Knowledge.js';
import type { Types } from 'mongoose';

type SeedItem = {
  title: string;
  category: 'Book' | 'Article' | 'Journal';
  description: string;
  content: string;
  author: string;
  tags: string[];
  views: number;
  fileUrl?: string;
};

const DEMO_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const ITEMS: SeedItem[] = [
  {
    title: 'Complete Guide to Rice Disease Prevention',
    category: 'Book',
    description:
      'This comprehensive guide covers all aspects of rice disease prevention, including early detection, treatment methods, and integrated pest management strategies.',
    content: `Chapter 1: Introduction to Rice Diseases
Chapter 2: Rice Blast - Identification and Treatment
Chapter 3: Brown Spot Management
Chapter 4: Bacterial Leaf Blight
Chapter 5: Field Checklist`,
    author: 'Dr. Aung Kyaw',
    tags: ['rice', 'disease', 'farming'],
    views: 2345,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'Onion Farming Handbook',
    category: 'Book',
    description: 'Practical handbook for bulb development, spacing, and harvest timing for Myanmar onion growers.',
    content: `Chapter 1: Preparing Onion Beds
Chapter 2: Spacing and Airflow
Chapter 3: Irrigation Timing
Chapter 4: Harvest and Storage`,
    author: 'Daw Khin Win',
    tags: ['onion', 'farming'],
    views: 1876,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'Pest Management Guide',
    category: 'Book',
    description: 'Field guide to common pests on rice and onion with organic options.',
    content: `Chapter 1: Scouting Basics
Chapter 2: Organic Options
Chapter 3: Chemical Rotation
Chapter 4: Record Keeping`,
    author: 'U Myo Min',
    tags: ['pest', 'organic', 'disease'],
    views: 1543,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'Organic Fertilizer Guide',
    category: 'Book',
    description: 'Compost, green manure, and organic nutrient plans for smallholders.',
    content: `Chapter 1: Building Compost
Chapter 2: Application Timing
Chapter 3: Soil Testing
Chapter 4: Green Manure`,
    author: 'Smart Agro Team',
    tags: ['organic', 'farming', 'irrigation'],
    views: 1234,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'How to Identify Rice Blast Early',
    category: 'Article',
    description: 'Learn the early signs of Rice Blast and how to prevent spread in the field.',
    content: `Introduction
Rice Blast is one of the most devastating diseases affecting rice crops in Myanmar. Early identification is crucial for effective management and crop protection.

Key Symptoms to Look For:
1. Small, water-soaked lesions on leaves
2. Lesions expand into diamond-shaped spots
3. Gray centers with brown borders
4. Lesions appear on stems and panicles

Treatment Recommendations:
- Apply fungicide with recommended active ingredients
- Remove infected leaves when practical
- Improve drainage after heavy rain
- Practice crop rotation where possible`,
    author: 'Dr. Aung Kyaw',
    tags: ['rice', 'disease', 'RiceBlast'],
    views: 1876,
  },
  {
    title: 'Organic Farming Techniques for Onions',
    category: 'Article',
    description: 'Discover sustainable onion farming methods that increase yield and soil health.',
    content: `Introduction
Organic onion production focuses on soil biology, mulching, and careful irrigation for healthier bulbs.

Field Practices:
1. Prepare beds with compost before planting
2. Mulch to keep moisture steady
3. Avoid overhead watering in the evening
4. Rotate beds each season

Treatment Recommendations:
- Use compost tea for soft nutrient support
- Encourage beneficial insects for soft pest pressure
- Document each bed so you can improve season after season
- Scout weekly for Stemphylium and thrips`,
    author: 'Daw Khin Win',
    tags: ['onion', 'organic', 'farming'],
    views: 1650,
  },
  {
    title: 'Understanding Soil pH for Rice Cultivation',
    category: 'Article',
    description: 'Why soil pH matters for rice and how to adjust it safely.',
    content: `Introduction
Rice generally prefers slightly acidic soils. Knowing your pH helps fertilizer work better and plants resist disease.

Key Steps to Follow:
1. Test pH before the season and after floods
2. Lime carefully if pH is too low
3. Avoid sudden large corrections
4. Recheck after amendments

Treatment Recommendations:
- Keep records of each plot
- Combine organic matter with mineral adjustments
- Share verified soil tips in the community feed
- Pair soil health with healthy seedling selection`,
    author: 'U Myo Min',
    tags: ['rice', 'farming', 'research'],
    views: 980,
  },
  {
    title: 'Weather-Smart Irrigation for Small Farms',
    category: 'Article',
    description: 'Use forecasts to time irrigation and reduce disease pressure.',
    content: `Introduction
Check the Smart Agro weather page before irrigating. Timing water wisely saves costs and reduces leaf disease.

Key Steps to Follow:
1. Skip watering when rain chance is high
2. Irrigate early morning so leaves dry during the day
3. Keep records of rainfall and irrigation for each plot
4. Adjust after dry monsoon breaks

Treatment Recommendations:
- Prefer light first irrigations after a break
- Watch fungal risk when humidity rises again
- Pair irrigation plans with disease scouting
- Share township forecasts with neighbors`,
    author: 'Smart Agro Team',
    tags: ['weather', 'irrigation', 'farming'],
    views: 870,
  },
  {
    title: 'Impact of Climate Change on Rice Production in Myanmar',
    category: 'Journal',
    description:
      'Study examining climate patterns and rice yields in major Myanmar growing regions.',
    content: `Abstract: This study examines the correlation between changing climate patterns and rice production yields in major Myanmar growing regions. Using multi-year observations, we discuss adaptation options for smallholders.

Keywords: Climate Change, Rice Production, Myanmar, Sustainability

Citation (APA):
Smart Agro Research Team. (2026). Impact of climate change on rice production in Myanmar. Myanmar Agricultural Research, 12(3), 45–62.`,
    author: 'Prof. U Myo Min, Dr. Daw Khin Win, et al.',
    tags: ['rice', 'weather', 'research'],
    views: 720,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'Organic Pest Control Methods for Onion Crops',
    category: 'Journal',
    description: 'Research on natural pest control solutions suitable for onion beds.',
    content: `Abstract: Research on natural pest control solutions for onion crops, including botanical extracts and habitat management.

Keywords: Organic, Pest, Onion, IPM

Citation (APA):
Daw Khin Win. (2026). Organic pest control methods for onion crops. Asian Journal of Agriculture, 8(2), 22–39.`,
    author: 'Daw Khin Win',
    tags: ['onion', 'pest', 'organic', 'research'],
    views: 650,
    fileUrl: DEMO_PDF,
  },
  {
    title: 'Irrigation Scheduling After Monsoon Breaks',
    category: 'Article',
    description: 'Practical tips for restarting irrigation safely after dry spells.',
    content: `Introduction
After a monsoon break, soil can crust and roots may be stressed. Restart irrigation gently.

Key Steps to Follow:
1. Irrigate lightly first
2. Deepen watering as plants recover
3. Watch for fungal risk when humidity rises
4. Record rainfall gaps for next season

Treatment Recommendations:
- Avoid evening overhead irrigation
- Combine with mulch where possible
- Scout for heat stress and leaf scorch
- Share township weather alerts`,
    author: 'Field Expert',
    tags: ['irrigation', 'weather', 'farming'],
    views: 540,
  },
  {
    title: 'Disease Guide: Brown Spot Quick Reference',
    category: 'Article',
    description: 'Short field card for Brown Spot on rice leaves.',
    content: `Introduction
Brown Spot often rises after cloudy humid nights. Early scouting protects yield.

Key Symptoms to Look For:
1. Brown oval spots on leaf tips
2. Spots with yellow halos in humid weather
3. Weak plants after nutrient stress
4. Spread after continuous cloud cover

Treatment Recommendations:
- Scout leaf tips twice a week
- Improve nutrition and drainage
- Share photos in the community feed if unsure
- Link a verified diagnosis when posting`,
    author: 'Field Expert',
    tags: ['disease', 'rice'],
    views: 1100,
  },
];

export async function seedKnowledge(uploadedBy: Types.ObjectId) {
  // Refresh demo library so TOC/sections stay aligned with the Knowledge Center UI
  await Knowledge.deleteMany({});
  await Knowledge.insertMany(
    ITEMS.map((item) => ({
      ...item,
      isPublished: true,
      uploadedBy,
      version: 1,
      downloads: Math.floor(item.views / 10),
    }))
  );

  return { created: ITEMS.length, skipped: false as const };
}
