import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  acceptApplyRequest,
  closeAd,
  createAd,
  getAdRequests,
  getAds,
  applyToAd,
  rejectApplyRequest,
} from './ad.service';
import type {
  AdsQuery,
  AdBody,
} from './ad.types';

const getAdsController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const query = req.query as AdsQuery;
  const data = await getAds(athleteId, query);

  res.status(200).json({
    success: true,
    data,
  });
});

const createAdController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as AdBody;
  const data = await createAd(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const closeAdController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await closeAd(athleteId, adId);

  res.status(200).json({
    success: true,
    data,
  });
});

const applyToAdController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await applyToAd(athleteId, adId);

  res.status(201).json({
    success: true,
    data,
  });
});

const getAdRequestsController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await getAdRequests(athleteId, adId);

  res.status(200).json({
    success: true,
    data,
  });
});

const acceptApplyRequestController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const applyRequestId = String(req.params.id);
  const data = await acceptApplyRequest(athleteId, applyRequestId);

  res.status(200).json({
    success: true,
    data,
  });
});

const rejectApplyRequestController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const applyRequestId = String(req.params.id);
  const data = await rejectApplyRequest(athleteId, applyRequestId);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  acceptApplyRequestController,
  closeAdController,
  createAdController,
  getAdRequestsController,
  getAdsController,
  applyToAdController,
  rejectApplyRequestController,
};
