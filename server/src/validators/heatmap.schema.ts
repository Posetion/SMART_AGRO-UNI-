import { z } from 'zod';

export const heatmapFilterSchema = z.object({
  disease: z.string().optional(),
  from: z.string().datetime().or(z.string().min(1)).optional(),
  to: z.string().datetime().or(z.string().min(1)).optional(),
  /** Calendar day (YYYY-MM-DD or ISO). Aggregates ALL users' detections for that Myanmar day. */
  day: z.string().min(1).optional(),
});
