import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  cancelReservation,
  createReservation,
  getProfile,
  getResourceAvailability,
  getReservations,
  updateProfile,
} from './athlete.controller';

const athleteRouter = Router();

athleteRouter.use(authMiddleware);
athleteRouter.use(roleMiddleware(UserRole.Athlete));

athleteRouter.get('/profile', getProfile);
athleteRouter.patch('/profile', updateProfile);
athleteRouter.get('/resources/:resourceId/availability', getResourceAvailability);
athleteRouter.get('/reservations', getReservations);
athleteRouter.post('/reservations', createReservation);
athleteRouter.patch('/reservations/:id/cancel', cancelReservation);

export { athleteRouter };
