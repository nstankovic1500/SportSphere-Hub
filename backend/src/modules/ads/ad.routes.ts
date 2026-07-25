import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  acceptApplyRequest,
  closeAd,
  createAd,
  getAdRequests,
  getAds,
  applyToAd,
  rejectApplyRequest,
} from './ad.controller';

const adRouter = Router();
const applyRequestRouter = Router();

adRouter.use(authMiddleware);
adRouter.use(roleMiddleware(UserRole.Athlete));

adRouter.get('/', getAds);
adRouter.post('/', createAd);
adRouter.patch('/:id/close', closeAd);
adRouter.post('/:id/apply', applyToAd);
adRouter.get('/:id/requests', getAdRequests);

applyRequestRouter.use(authMiddleware);
applyRequestRouter.use(roleMiddleware(UserRole.Athlete));

applyRequestRouter.patch('/:id/accept', acceptApplyRequest);
applyRequestRouter.patch('/:id/reject', rejectApplyRequest);

export { adRouter, applyRequestRouter };
