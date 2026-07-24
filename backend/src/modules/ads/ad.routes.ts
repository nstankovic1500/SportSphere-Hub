import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  acceptApplyRequestController,
  closeAdController,
  createAdController,
  getAdRequestsController,
  getAdsController,
  applyToAdController,
  rejectApplyRequestController,
} from './ad.controller';

const adRouter = Router();
const applyRequestRouter = Router();

adRouter.use(authMiddleware);
adRouter.use(roleMiddleware(UserRole.Athlete));

adRouter.get('/', getAdsController);
adRouter.post('/', createAdController);
adRouter.patch('/:id/close', closeAdController);
adRouter.post('/:id/join', applyToAdController);
adRouter.get('/:id/requests', getAdRequestsController);

applyRequestRouter.use(authMiddleware);
applyRequestRouter.use(roleMiddleware(UserRole.Athlete));

applyRequestRouter.patch('/:id/accept', acceptApplyRequestController);
applyRequestRouter.patch('/:id/reject', rejectApplyRequestController);

export { adRouter, applyRequestRouter };
