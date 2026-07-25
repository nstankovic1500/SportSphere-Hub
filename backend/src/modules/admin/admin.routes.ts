import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  rejectFacilityRequest,
  rejectRegistrationRequest,
} from './admin.controller';

const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(roleMiddleware(UserRole.Admin));

adminRouter.get('/registrationRequests', getRegistrationRequests);
adminRouter.patch('/registrationRequests/:id/approve', approveRegistrationRequest);
adminRouter.patch('/registrationRequests/:id/reject', rejectRegistrationRequest);
adminRouter.get('/facility-requests', getFacilityRequests);
adminRouter.patch('/facility-requests/:id/approve', approveFacilityRequest);
adminRouter.patch('/facility-requests/:id/reject', rejectFacilityRequest);

export { adminRouter };
