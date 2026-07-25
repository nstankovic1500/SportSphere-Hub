import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  cancelTrainingAppointment,
  cancelReservation,
  createTrainingAppointment,
  createReservation,
  getProfile,
  getResourceAvailability,
  getReservations,
  getTrainingAppointments,
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
athleteRouter.get('/training-appointments', getTrainingAppointments);
athleteRouter.post('/training-appointments', createTrainingAppointment);
athleteRouter.patch('/training-appointments/:id/cancel', cancelTrainingAppointment);

export { athleteRouter };
