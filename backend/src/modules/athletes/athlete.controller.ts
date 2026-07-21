import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedAthleteRequest, UpdateAthleteProfileBody } from './athlete.types';
import { cancelReservation, getProfile, getReservations, updateProfile } from './athlete.service';

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

export {
  cancelReservationController,
  getProfileController,
  getReservationsController,
  updateProfileController,
};
