import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../models/User';
import {
  createFacility,
  createResource,
  createTrainer,
  deleteResource,
  deleteTrainer,
  getFacilities,
  getFacility,
  getFacilityResources,
  getFacilityTrainers,
  getProfile,
  updateFacility,
  updateProfile,
  updateResource,
  updateTrainer,
} from './employee.controller';

const employeeRouter = Router();

employeeRouter.use(authMiddleware);
employeeRouter.use(roleMiddleware(UserRole.Employee));

employeeRouter.get('/profile', getProfile);
employeeRouter.patch('/profile', updateProfile);
employeeRouter.get('/facilities', getFacilities);
employeeRouter.post('/facilities', createFacility);
employeeRouter.get('/facilities/:facilityId', getFacility);
employeeRouter.patch('/facilities/:facilityId', updateFacility);
employeeRouter.get('/facilities/:facilityId/resources', getFacilityResources);
employeeRouter.post('/facilities/:facilityId/resources', createResource);
employeeRouter.get('/facilities/:facilityId/trainers', getFacilityTrainers);
employeeRouter.post('/facilities/:facilityId/trainers', createTrainer);
employeeRouter.patch('/resources/:resourceId', updateResource);
employeeRouter.delete('/resources/:resourceId', deleteResource);
employeeRouter.patch('/trainers/:trainerId', updateTrainer);
employeeRouter.delete('/trainers/:trainerId', deleteTrainer);

export { employeeRouter };
