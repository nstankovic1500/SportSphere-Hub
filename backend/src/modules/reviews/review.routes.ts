import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  createReview,
  getFacilityReviews,
} from './review.controller';

const reviewRouter = Router({ mergeParams: true });

reviewRouter.get('/:facilityId/reviews', getFacilityReviews);
reviewRouter.post(
  '/:facilityId/reviews',
  authMiddleware,
  roleMiddleware(UserRole.Athlete),
  createReview,
);

export { reviewRouter };
