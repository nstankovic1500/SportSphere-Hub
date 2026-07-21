import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { PublicFacilitiesQuery } from './public.types';
import { getCities, getFacilities, getFacilityById, getHomeData } from './public.service';

const getHomeController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getHomeData();

  res.status(200).json({
    success: true,
    data,
  });
});

const getCitiesController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getCities();

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilitiesController = asyncHandler(async (req: Request, res: Response) => {
  const data = await getFacilities(req.query as PublicFacilitiesQuery);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityDetailsController = asyncHandler(async (req: Request, res: Response) => {
  const data = await getFacilityById(String(req.params.id));

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  getCitiesController,
  getFacilitiesController,
  getFacilityDetailsController,
  getHomeController,
};
