import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  approveRegistrationRequestController,
  getRegistrationRequestsController,
  rejectRegistrationRequestController,
} from './admin.controller';

const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(roleMiddleware(UserRole.Admin));

adminRouter.get('/registrationRequests', getRegistrationRequestsController);
adminRouter.patch('/registrationRequests/:id/approve', approveRegistrationRequestController);
adminRouter.patch('/registrationRequests/:id/reject', rejectRegistrationRequestController);

export { adminRouter };
