export const ROLES = ['farmer', 'expert', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export {
  CROP_TYPES,
  CROP_NAME_MY,
  cropNameMy,
  CROP_DISEASES,
  CROP_PESTS,
  RICE_DISEASES,
  RICE_PESTS,
  ONION_DISEASES,
  ALL_DETECT_LABELS,
  DISEASE_NAME_MY,
  diseaseNameMy,
  labelsForCrop,
  cropProblemsPromptBlock,
} from './diseases.js';
export type { CropType, RiceDisease, RicePest, OnionDisease, DetectLabel } from './diseases.js';

export const RISK_LEVELS = ['Low', 'Medium', 'High', 'Outbreak_Imminent'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const KNOWLEDGE_CATEGORIES = ['Book', 'Article', 'Journal'] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const MAX_POST_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_KNOWLEDGE_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_CHAT_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_CHAT_ATTACHMENTS = 8;
