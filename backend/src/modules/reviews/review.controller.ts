import type { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { createReview, getFacilityReviews } from './review.service';
import type {
  CreateReviewBody,
} from './review.types';

const getFacilityReviewsController = asyncHandler(async (req: Request, res: Response) => {
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityReviews(facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createReviewController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const athleteId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateReviewBody;
  const data = await createReview(athleteId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

export {
  createReviewController,
  getFacilityReviewsController,
};
