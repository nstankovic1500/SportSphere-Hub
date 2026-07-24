import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type {
  AuthenticatedAthleteRequest,
  CreateReservationBody,
  UpdateAthleteProfileBody,
} from './athlete.types';
import {
  cancelReservation,
  createReservation,
  getProfile,
  getReservations,
  getResourceAvailability,
  updateProfile,
} from './athlete.service';

const getProfileController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getProfile(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateProfileController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as UpdateAthleteProfileBody;
  const data = await updateProfile(athleteId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getReservationsController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const data = await getReservations(athleteId);

  res.status(200).json({
    success: true,
    data,
  });
});

const cancelReservationController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const reservationId = String(req.params.id);
  const data = await cancelReservation(athleteId, reservationId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getResourceAvailabilityController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const resourceId = String(req.params.resourceId);
  const date = String(req.query.date ?? '');
  const data = await getResourceAvailability(resourceId, date);

  res.status(200).json({
    success: true,
    data,
  });
});

const createReservationController = asyncHandler(async (req: AuthenticatedAthleteRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as CreateReservationBody;
  const data = await createReservation(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

export {
  cancelReservationController,
  createReservationController,
  getProfileController,
  getResourceAvailabilityController,
  getReservationsController,
  updateProfileController,
};
