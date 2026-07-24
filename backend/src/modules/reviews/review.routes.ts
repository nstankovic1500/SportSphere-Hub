import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  createReviewController,
  getFacilityReviewsController,
} from './review.controller';

const reviewRouter = Router({ mergeParams: true });

reviewRouter.get('/:facilityId/reviews', getFacilityReviewsController);
reviewRouter.post(
  '/:facilityId/reviews',
  authMiddleware,
  roleMiddleware(UserRole.Athlete),
  createReviewController,
);

export { reviewRouter };
