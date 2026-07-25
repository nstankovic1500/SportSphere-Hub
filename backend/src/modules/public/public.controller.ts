import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { PublicFacilitiesQuery } from './public.types';
import {
  getCities as getCitiesService,
  getFacilities as getFacilitiesService,
  getFacilityById,
  getHomeData,
} from './public.service';

const getHome = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getHomeData();

  res.status(200).json({
    success: true,
    data,
  });
});

const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getCitiesService();

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilities = asyncHandler(async (req: Request, res: Response) => {
  const data = await getFacilitiesService(req.query as PublicFacilitiesQuery);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityDetails = asyncHandler(async (req: Request, res: Response) => {
  const data = await getFacilityById(String(req.params.id));

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  getCities,
  getFacilities,
  getFacilityDetails,
  getHome,
};
