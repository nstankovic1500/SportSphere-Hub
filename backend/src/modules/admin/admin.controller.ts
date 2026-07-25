import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import {
  approveRegistrationRequest as approveRegistrationRequestService,
  getRegistrationRequests as getRegistrationRequestsService,
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

export {
  approveRegistrationRequest,
  getRegistrationRequests,
  rejectRegistrationRequest,
};
