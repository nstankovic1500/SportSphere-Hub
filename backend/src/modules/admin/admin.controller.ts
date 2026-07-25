import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import {
  approveFacilityRequest as approveFacilityRequestService,
  approveRegistrationRequest as approveRegistrationRequestService,
  getFacilityRequests as getFacilityRequestsService,
  getRegistrationRequests as getRegistrationRequestsService,
  rejectFacilityRequest as rejectFacilityRequestService,
  rejectRegistrationRequest as rejectRegistrationRequestService,
} from './admin.service';

const getRegistrationRequests = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getRegistrationRequestsService();

  res.status(200).json({
    success: true,
    data,
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

export {
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  rejectFacilityRequest,
  rejectRegistrationRequest,
};
