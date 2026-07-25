import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  createReview as createReviewService,
  getFacilityReviews as getFacilityReviewsService,
} from './review.service';
import type {
  CreateReviewBody,
} from './review.types';

const getFacilityReviews = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityReviewsService(facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateReviewBody;
  const data = await createReviewService(athleteId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

export {
  createReview,
  getFacilityReviews,
};
