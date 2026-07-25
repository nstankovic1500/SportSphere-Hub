import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { asyncHandler } from '../../utils/asyncHandler';
import type {
  CreateEmployeeFacilityBody,
  CreateEmployeeResourceBody,
  UpdateEmployeeFacilityBody,
  UpdateEmployeeProfileBody,
  UpdateEmployeeResourceBody,
} from './employee.types';
import {
  createFacility as createFacilityService,
  createResource as createResourceService,
  deleteResource as deleteResourceService,
  getFacilities as getFacilitiesService,
  getFacility as getFacilityService,
  getFacilityResources as getFacilityResourcesService,
  getProfile as getProfileService,
  updateFacility as updateFacilityService,
  updateProfile as updateProfileService,
  updateResource as updateResourceService,
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

const getFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const body = req.body as CreateEmployeeFacilityBody;
  const data = await createFacilityService(employeeId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as UpdateEmployeeFacilityBody;
  const data = await updateFacilityService(employeeId, facilityId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityResources = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityResourcesService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateEmployeeResourceBody;
  const data = await createResourceService(employeeId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const resourceId = String(req.params.resourceId);
  const body = req.body as UpdateEmployeeResourceBody;
  const data = await updateResourceService(employeeId, resourceId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const deleteResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const resourceId = String(req.params.resourceId);
  const data = await deleteResourceService(employeeId, resourceId);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

export {
  createFacility,
  createResource,
  deleteResource,
  getFacilities,
  getFacility,
  getFacilityResources,
  getProfile,
  updateFacility,
  updateProfile,
  updateResource,
};
