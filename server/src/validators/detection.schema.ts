import { z } from 'zod';
import { CROP_TYPES } from '../config/constants.js';
import { ALL_DETECT_LABELS } from '../config/diseases.js';

const detectLabels = [...ALL_DETECT_LABELS] as unknown as [string, ...string[]];
const detectLabelEnum = z.enum(detectLabels);

export const predictSchema = z.object({
  cropType: z.enum(CROP_TYPES).optional(),
  disease: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  rainfall: z.number().optional(),
});

export const updateDiagnosisSchema = z.object({
  disease: detectLabelEnum.optional(),
  severityIndex: z.number().min(0).max(100).optional(),
  treatmentProtocol: z.string().optional(),
  cropType: z.enum(CROP_TYPES).optional(),
});

/** Accept + optional disease/pest correction and expert advice. */
export const verifyDiagnosisSchema = z.object({
  disease: detectLabelEnum.optional(),
  severityIndex: z.number().min(0).max(100).optional(),
  treatmentProtocol: z.string().trim().max(2000).optional(),
  expertSuggestion: z.string().trim().max(2000).optional().default(''),
  expertBooks: z.string().trim().max(1000).optional().default(''),
  expertDrugs: z.string().trim().max(1000).optional().default(''),
});

export const rejectDiagnosisSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a short reason').max(500),
});

export const requestReapprovalSchema = z.object({
  message: z.string().trim().min(3, 'Please write a short message').max(500),
});
