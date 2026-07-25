import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type {
  AuthenticatedAthleteRequest,
  CreateReservationBody,
  UpdateAthleteProfileBody,
} from './athlete.types';
import {
  cancelReservation as cancelReservationService,
  createReservation as createReservationService,
  getProfile as getProfileService,
  getReservations as getReservationsService,
  getResourceAvailability as getResourceAvailabilityService,
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

export {
  cancelReservation,
  createReservation,
  getProfile,
  getResourceAvailability,
  getReservations,
  updateProfile,
};
