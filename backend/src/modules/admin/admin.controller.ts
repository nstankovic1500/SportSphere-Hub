import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import {
  approveRegistrationRequest,
  getRegistrationRequests,
  rejectRegistrationRequest,
} from './admin.service';

const getRegistrationRequestsController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getRegistrationRequests();

  res.status(200).json({
    success: true,
    data,
  });
});

const approveRegistrationRequestController = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await approveRegistrationRequest(id);

  res.status(200).json({
    success: true,
    data,
  });
});

const rejectRegistrationRequestController = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await rejectRegistrationRequest(id);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  approveRegistrationRequestController,
  getRegistrationRequestsController,
  rejectRegistrationRequestController,
};
