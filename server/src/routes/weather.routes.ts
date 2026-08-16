import { Router } from 'express';
import * as weatherController from '../controllers/weather.controller.js';
import { validate } from '../middleware/validate.js';
import { latLngQuerySchema, placeQuerySchema, townshipParamSchema } from '../validators/weather.schema.js';

const router = Router();

router.get('/forecast', validate({ query: latLngQuerySchema }), weatherController.forecast);
router.get('/current', validate({ query: latLngQuerySchema }), weatherController.current);
router.get('/alerts', validate({ query: latLngQuerySchema }), weatherController.alerts);
router.get(
  '/recommendations',
  validate({ query: latLngQuerySchema }),
  weatherController.recommendations
);
router.get('/townships', weatherController.townships);
router.get('/place', validate({ query: placeQuerySchema }), weatherController.byCoords);
router.get(
  '/township/:township',
  validate({ params: townshipParamSchema }),
  weatherController.byTownship
);

export default router;
