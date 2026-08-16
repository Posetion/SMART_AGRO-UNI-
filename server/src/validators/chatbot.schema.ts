import { z } from 'zod';

const emptyToUndef = (v: unknown) => {
  if (v === '' || v === undefined || v === null) return undefined;
  return v;
};

export const chatMessageSchema = z.object({
  text: z.string().optional().default(''),
  sessionId: z.preprocess(emptyToUndef, z.string().optional()),
  lat: z.preprocess(emptyToUndef, z.coerce.number().min(-90).max(90).optional()),
  lng: z.preprocess(emptyToUndef, z.coerce.number().min(-180).max(180).optional()),
  township: z.preprocess(emptyToUndef, z.string().max(120).optional()),
});
