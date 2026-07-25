import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type {
  AuthenticatedAthleteRequest,
  CartItemBody,
  CreateReservationBody,
  CreateTrainingAppointmentBody,
  UpdateAthleteOrderStatusBody,
  UpdateCartItemBody,
  UpdateAthleteProfileBody,
} from './athlete.types';
import {
  addCartItem as addCartItemService,
  checkoutOrders as checkoutOrdersService,
  cancelTrainingAppointment as cancelTrainingAppointmentService,
  cancelReservation as cancelReservationService,
  createTrainingAppointment as createTrainingAppointmentService,
  createReservation as createReservationService,
  deleteCartItem as deleteCartItemService,
  getCart as getCartService,
  getOrders as getOrdersService,
  getProfile as getProfileService,
  getReservations as getReservationsService,
  getResourceAvailability as getResourceAvailabilityService,
  getTrainingAppointments as getTrainingAppointmentsService,
  updateOrderStatus as updateOrderStatusService,
  updateCartItem as updateCartItemService,
  updateProfile as updateProfileService,
} from './athlete.service';

const getProfile = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getProfileService(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateProfile = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as UpdateAthleteProfileBody;
  const data = await updateProfileService(athleteId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getReservations = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getReservationsService(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const cancelReservation = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const reservationId = String(req.params.id);
  const data = await cancelReservationService(athleteId, reservationId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getResourceAvailability = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const resourceId = String(req.params.resourceId);
  const date = String(req.query.date ?? '');
  const data = await getResourceAvailabilityService(resourceId, date);

  res.status(200).json({
    success: true,
    data,
  });
});

const createReservation = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as CreateReservationBody;
  const data = await createReservationService(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const getCart = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getCartService(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const addCartItem = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as CartItemBody;
  const data = await addCartItemService(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateCartItem = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const itemId = String(req.params.id);
  const body = req.body as UpdateCartItemBody;
  const data = await updateCartItemService(athleteId, itemId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const deleteCartItem = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const itemId = String(req.params.id);
  const data = await deleteCartItemService(athleteId, itemId);

  res.status(200).json({
    success: true,
    data,
  });
});

const checkoutOrders = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await checkoutOrdersService(athleteId);

  res.status(201).json({
    success: true,
    data,
  });
});

const getTrainingAppointments = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getTrainingAppointmentsService(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getOrders = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getOrdersService(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateOrderStatus = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const orderId = String(req.params.id);
  const body = req.body as UpdateAthleteOrderStatusBody;
  const data = await updateOrderStatusService(athleteId, orderId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const createTrainingAppointment = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as CreateTrainingAppointmentBody;
  const data = await createTrainingAppointmentService(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const cancelTrainingAppointment = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const appointmentId = String(req.params.id);
  const data = await cancelTrainingAppointmentService(athleteId, appointmentId);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
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
  updateOrderStatus,
  updateCartItem,
  updateProfile,
};
