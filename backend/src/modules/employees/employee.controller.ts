import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { asyncHandler } from '../../utils/asyncHandler';
import type {
  UpdateEmployeeProfileBody,
} from './employee.types';
import {
  getFacilities as getFacilitiesService,
  getProfile as getProfileService,
  updateProfile as updateProfileService,
} from './employee.service';

const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const data = await getProfileService(employeeId);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const body = req.body as UpdateEmployeeProfileBody;
  const data = await updateProfileService(employeeId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const data = await getFacilitiesService(employeeId);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  getFacilities,
  getProfile,
  updateProfile,
};
