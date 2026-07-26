import { Router } from 'express';

import { createUploader } from '../../config/upload';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { runUploadMiddleware } from '../../middleware/upload.middleware';
import { UserRole } from '../../models/User';
import {
  createFacility,
  createProduct,
  createPromotion,
  createResource,
  createTrainer,
  deleteFacilityImage,
  deleteProduct,
  deletePromotion,
  deleteResource,
  deleteTrainer,
  getAttendance,
  getFacilityCalendar,
  getFacilities,
  getFacility,
  getFacilityOrders,
  getFacilityProducts,
  getFacilityPromotions,
  getFacilityResources,
  getFacilityTrainers,
  getProfile,
  markReservationAttended,
  markReservationNoShow,
  markTrainingCompleted,
  markTrainingNoShow,
  moveReservation,
  moveTrainingAppointment,
  updateFacility,
  updateOrderStatus,
  updateProduct,
  updateProductImage,
  updatePromotion,
  updateProfile,
  updateResource,
  updateTrainer,
  uploadFacilityImages,
} from './employee.controller';

const employeeRouter = Router();
const facilityImageUpload = createUploader('facilities');
const productImageUpload = createUploader('products');

employeeRouter.use(authMiddleware);
employeeRouter.use(roleMiddleware(UserRole.Employee));

employeeRouter.get('/profile', getProfile);
employeeRouter.patch('/profile', updateProfile);
employeeRouter.get('/facilities', getFacilities);
employeeRouter.post('/facilities', createFacility);
employeeRouter.get('/facilities/:facilityId', getFacility);
employeeRouter.patch('/facilities/:facilityId', updateFacility);
employeeRouter.get('/facilities/:facilityId/attendance', getAttendance);
employeeRouter.get('/facilities/:facilityId/calendar', getFacilityCalendar);
employeeRouter.get('/facilities/:facilityId/orders', getFacilityOrders);
employeeRouter.get('/facilities/:facilityId/products', getFacilityProducts);
employeeRouter.post('/facilities/:facilityId/products', createProduct);
employeeRouter.post(
  '/facilities/:facilityId/images',
  runUploadMiddleware(facilityImageUpload.array('images', 5)),
  uploadFacilityImages,
);
employeeRouter.delete('/facilities/:facilityId/images', deleteFacilityImage);
employeeRouter.get('/facilities/:facilityId/promotions', getFacilityPromotions);
employeeRouter.post('/facilities/:facilityId/promotions', createPromotion);
employeeRouter.get('/facilities/:facilityId/resources', getFacilityResources);
employeeRouter.post('/facilities/:facilityId/resources', createResource);
employeeRouter.get('/facilities/:facilityId/trainers', getFacilityTrainers);
employeeRouter.post('/facilities/:facilityId/trainers', createTrainer);
employeeRouter.patch('/products/:productId', updateProduct);
employeeRouter.patch(
  '/products/:productId/image',
  runUploadMiddleware(productImageUpload.single('image')),
  updateProductImage,
);
employeeRouter.patch('/orders/:id/status', updateOrderStatus);
employeeRouter.delete('/products/:productId', deleteProduct);
employeeRouter.patch('/promotions/:promotionId', updatePromotion);
employeeRouter.delete('/promotions/:promotionId', deletePromotion);
employeeRouter.patch('/resources/:resourceId', updateResource);
employeeRouter.delete('/resources/:resourceId', deleteResource);
employeeRouter.patch('/reservations/:reservationId/move', moveReservation);
employeeRouter.patch('/reservations/:reservationId/attended', markReservationAttended);
employeeRouter.patch('/reservations/:reservationId/no-show', markReservationNoShow);
employeeRouter.patch('/trainers/:trainerId', updateTrainer);
employeeRouter.delete('/trainers/:trainerId', deleteTrainer);
employeeRouter.patch('/training-appointments/:appointmentId/move', moveTrainingAppointment);
employeeRouter.patch('/training-appointments/:appointmentId/completed', markTrainingCompleted);
employeeRouter.patch('/training-appointments/:appointmentId/no-show', markTrainingNoShow);

export { employeeRouter };
