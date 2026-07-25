import { Router } from 'express';

import {
  getCities,
  getFacilities,
  getFacilityDetails,
  getHome,
} from './public.controller';

const publicRouter = Router();

publicRouter.get('/home', getHome);
publicRouter.get('/cities', getCities);
publicRouter.get('/facilities', getFacilities);
publicRouter.get('/facilities/:id', getFacilityDetails);

export { publicRouter };
