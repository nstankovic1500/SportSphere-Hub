import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { PublicFacilitiesQuery } from './public.types';
import {
  getCities as getCitiesService,
  getFacilities as getFacilitiesService,
  getFacilityById,
  getHomeData,
  getProductById as getProductByIdService,
  getProducts as getProductsService,
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

const getProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getProductsService();

  res.status(200).json({
    success: true,
    data,
  });
});

const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await getProductByIdService(String(req.params.id));

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
  getProduct,
  getProducts,
};
