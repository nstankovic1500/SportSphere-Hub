import { Router } from 'express';

import {
  getCitiesController,
  getFacilitiesController,
  getFacilityDetailsController,
  getHomeController,
} from './public.controller';

const publicRouter = Router();

publicRouter.get('/home', getHomeController);
publicRouter.get('/cities', getCitiesController);
publicRouter.get('/facilities', getFacilitiesController);
publicRouter.get('/facilities/:id', getFacilityDetailsController);

export { publicRouter };
