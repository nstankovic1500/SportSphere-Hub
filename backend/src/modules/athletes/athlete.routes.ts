import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  cancelReservationController,
  createReservationController,
  getProfileController,
  getResourceAvailabilityController,
  getReservationsController,
  updateProfileController,
} from './athlete.controller';

const athleteRouter = Router();

athleteRouter.use(authMiddleware);
athleteRouter.use(roleMiddleware(UserRole.Athlete));

athleteRouter.get('/profile', getProfileController);
athleteRouter.patch('/profile', updateProfileController);
athleteRouter.get('/resources/:resourceId/availability', getResourceAvailabilityController);
athleteRouter.get('/reservations', getReservationsController);
athleteRouter.post('/reservations', createReservationController);
athleteRouter.patch('/reservations/:id/cancel', cancelReservationController);

export { athleteRouter };
