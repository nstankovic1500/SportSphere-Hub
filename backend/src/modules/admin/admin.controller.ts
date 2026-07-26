import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import {
  createSport as createSportService,
  deactivateTrainer as deactivateTrainerService,
  approveFacilityRequest as approveFacilityRequestService,
  approveRegistrationRequest as approveRegistrationRequestService,
  getFacilityRequests as getFacilityRequestsService,
  getRegistrationRequests as getRegistrationRequestsService,
  getSports as getSportsService,
  getTrainers as getTrainersService,
  getUsers as getUsersService,
  rejectFacilityRequest as rejectFacilityRequestService,
  rejectRegistrationRequest as rejectRegistrationRequestService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from './admin.service';
import type { CreateAdminSportBody, UpdateAdminUserBody } from './admin.types';

const getRegistrationRequests = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getRegistrationRequestsService();

  res.status(200).json({
    success: true,
    data,
  });
});

const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getUsersService();

  res.status(200).json({
    success: true,
    data,
  });
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const body = req.body as UpdateAdminUserBody;
  const data = await updateUserService(id, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await deleteUserService(id);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

const approveRegistrationRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await approveRegistrationRequestService(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const rejectRegistrationRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await rejectRegistrationRequestService(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityRequests = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getFacilityRequestsService();

  res.status(200).json({
    success: true,
    data,
  });
});

const approveFacilityRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await approveFacilityRequestService(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const rejectFacilityRequest = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await rejectFacilityRequestService(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const getTrainers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getTrainersService();

  res.status(200).json({
    success: true,
    data,
  });
});

const deactivateTrainer = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await deactivateTrainerService(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const getSports = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getSportsService();

  res.status(200).json({
    success: true,
    data,
  });
});

const createSport = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateAdminSportBody;
  const data = await createSportService(body);

  res.status(201).json({
    success: true,
    data,
  });
});

export {
  createSport,
  deactivateTrainer,
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  getSports,
  getTrainers,
  getUsers,
  rejectFacilityRequest,
  rejectRegistrationRequest,
  updateUser,
  deleteUser,
};
