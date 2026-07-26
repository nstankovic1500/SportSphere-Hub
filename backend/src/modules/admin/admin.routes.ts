import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  createSport,
  deactivateTrainer,
  approveFacilityRequest,
  approveRegistrationRequest,
  getFacilityRequests,
  getRegistrationRequests,
  getSports,
  getTrainers,
  getUsers,
  rejectFacilityRequest,
  rejectRegistrationRequest,
  updateUser,
  deleteUser,
} from './admin.controller';

const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(roleMiddleware(UserRole.Admin));

adminRouter.get('/registrationRequests', getRegistrationRequests);
adminRouter.patch('/registrationRequests/:id/approve', approveRegistrationRequest);
adminRouter.patch('/registrationRequests/:id/reject', rejectRegistrationRequest);
adminRouter.get('/users', getUsers);
adminRouter.patch('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.get('/facility-requests', getFacilityRequests);
adminRouter.patch('/facility-requests/:id/approve', approveFacilityRequest);
adminRouter.patch('/facility-requests/:id/reject', rejectFacilityRequest);
adminRouter.get('/trainers', getTrainers);
adminRouter.patch('/trainers/:id/deactivate', deactivateTrainer);
adminRouter.get('/sports', getSports);
adminRouter.post('/sports', createSport);

export { adminRouter };
