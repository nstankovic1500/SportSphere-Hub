import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  cancelReservationController,
  getProfileController,
  getReservationsController,
  updateProfileController,
} from './athlete.controller';

const athleteRouter = Router();

athleteRouter.use(authMiddleware);
athleteRouter.use(roleMiddleware(UserRole.Athlete));

athleteRouter.get('/profile', getProfileController);
athleteRouter.patch('/profile', updateProfileController);
athleteRouter.get('/reservations', getReservationsController);
athleteRouter.patch('/reservations/:id/cancel', cancelReservationController);

export { athleteRouter };
