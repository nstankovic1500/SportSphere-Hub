import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  addCartItem,
  cancelTrainingAppointment,
  cancelReservation,
  checkoutOrders,
  createTrainingAppointment,
  createReservation,
  deleteCartItem,
  getCart,
  getOrders,
  getProfile,
  getResourceAvailability,
  getReservations,
  getTrainingAppointments,
  updateCartItem,
  updateProfile,
} from './athlete.controller';

const athleteRouter = Router();

athleteRouter.use(authMiddleware);
athleteRouter.use(roleMiddleware(UserRole.Athlete));

athleteRouter.get('/profile', getProfile);
athleteRouter.patch('/profile', updateProfile);
athleteRouter.get('/cart', getCart);
athleteRouter.get('/orders', getOrders);
athleteRouter.get('/resources/:resourceId/availability', getResourceAvailability);
athleteRouter.get('/reservations', getReservations);
athleteRouter.post('/reservations', createReservation);
athleteRouter.patch('/reservations/:id/cancel', cancelReservation);
athleteRouter.post('/cart/items', addCartItem);
athleteRouter.patch('/cart/items/:id', updateCartItem);
athleteRouter.delete('/cart/items/:id', deleteCartItem);
athleteRouter.get('/training-appointments', getTrainingAppointments);
athleteRouter.post('/training-appointments', createTrainingAppointment);
athleteRouter.patch('/training-appointments/:id/cancel', cancelTrainingAppointment);
athleteRouter.post('/orders', checkoutOrders);

export { athleteRouter };
