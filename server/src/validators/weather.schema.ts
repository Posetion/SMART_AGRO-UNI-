import { z } from 'zod';

export const latLngQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const placeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  name: z.string().trim().min(1).max(120).optional(),
  region: z.string().trim().min(1).max(120).optional(),
});

export const townshipParamSchema = z.object({
  township: z.string().min(1),
});
