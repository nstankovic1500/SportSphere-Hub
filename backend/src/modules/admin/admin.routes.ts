import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  approveRegistrationRequest,
  getRegistrationRequests,
  rejectRegistrationRequest,
} from './admin.controller';

const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(roleMiddleware(UserRole.Admin));

adminRouter.get('/registrationRequests', getRegistrationRequests);
adminRouter.patch('/registrationRequests/:id/approve', approveRegistrationRequest);
adminRouter.patch('/registrationRequests/:id/reject', rejectRegistrationRequest);

export { adminRouter };
