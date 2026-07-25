import type { Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  acceptApplyRequest as acceptApplyRequestService,
  closeAd as closeAdService,
  createAd as createAdService,
  getAdRequests as getAdRequestsService,
  getAds as getAdsService,
  applyToAd as applyToAdService,
  rejectApplyRequest as rejectApplyRequestService,
} from './ad.service';
import type {
  AdsQuery,
  AdBody,
} from './ad.types';

const getAds = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const query = req.query as AdsQuery;
  const data = await getAdsService(athleteId, query);

  res.status(200).json({
    success: true,
    data,
  });
});

const createAd = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const body = req.body as AdBody;
  const data = await createAdService(athleteId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const closeAd = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await closeAdService(athleteId, adId);

  res.status(200).json({
    success: true,
    data,
  });
});

const applyToAd = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await applyToAdService(athleteId, adId);

  res.status(201).json({
    success: true,
    data,
  });
});

const getAdRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const adId = String(req.params.id);
  const data = await getAdRequestsService(athleteId, adId);

  res.status(200).json({
    success: true,
    data,
  });
});

const acceptApplyRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const applyRequestId = String(req.params.id);
  const data = await acceptApplyRequestService(athleteId, applyRequestId);

  res.status(200).json({
    success: true,
    data,
  });
});

const rejectApplyRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const applyRequestId = String(req.params.id);
  const data = await rejectApplyRequestService(athleteId, applyRequestId);

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  acceptApplyRequest,
  closeAd,
  createAd,
  getAdRequests,
  getAds,
  applyToAd,
  rejectApplyRequest,
};
