import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppointmentStatus } from '../../models/Appointment';
import { ReservationStatus } from '../../models/Reservation';
import type { AttendanceQuery } from './attendance.types';
import type {
  CreateEmployeeFacilityBody,
  EmployeeProductBody,
  CreateEmployeePromotionBody,
  CreateEmployeeResourceBody,
  CreateEmployeeTrainerBody,
  UpdateEmployeeFacilityBody,
  UpdateEmployeeOrderStatusBody,
  UpdateEmployeePromotionBody,
  UpdateEmployeeProfileBody,
  UpdateEmployeeResourceBody,
  UpdateEmployeeTrainerBody,
} from './employee.types';
import {
  createFacility as createFacilityService,
  createProduct as createProductService,
  createPromotion as createPromotionService,
  createResource as createResourceService,
  createTrainer as createTrainerService,
  deleteProduct as deleteProductService,
  deletePromotion as deletePromotionService,
  deleteResource as deleteResourceService,
  deleteTrainer as deleteTrainerService,
  getAttendance as getAttendanceService,
  getFacilities as getFacilitiesService,
  getFacility as getFacilityService,
  getFacilityOrders as getFacilityOrdersService,
  getFacilityProducts as getFacilityProductsService,
  getFacilityPromotions as getFacilityPromotionsService,
  getFacilityResources as getFacilityResourcesService,
  getFacilityTrainers as getFacilityTrainersService,
  markReservationAttendance as markReservationAttendanceService,
  markTrainingAttendance as markTrainingAttendanceService,
  getProfile as getProfileService,
  updateFacility as updateFacilityService,
  updateOrderStatus as updateOrderStatusService,
  updateProduct as updateProductService,
  updatePromotion as updatePromotionService,
  updateProfile as updateProfileService,
  updateResource as updateResourceService,
  updateTrainer as updateTrainerService,
} from './employee.service';

const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const data = await getProfileService(employeeId);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const body = req.body as UpdateEmployeeProfileBody;
  const data = await updateProfileService(employeeId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const data = await getFacilitiesService(employeeId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getAttendance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const query = req.query as AttendanceQuery;
  const data = await getAttendanceService(employeeId, facilityId, query);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityPromotions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityPromotionsService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const active =
    typeof req.query.active === 'string' ? req.query.active : undefined;
  const data = await getFacilityProductsService(employeeId, facilityId, active);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityOrdersService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const body = req.body as CreateEmployeeFacilityBody;
  const data = await createFacilityService(employeeId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const createPromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateEmployeePromotionBody;
  const data = await createPromotionService(employeeId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as EmployeeProductBody;
  const data = await createProductService(employeeId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateFacility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as UpdateEmployeeFacilityBody;
  const data = await updateFacilityService(employeeId, facilityId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const updatePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const promotionId = String(req.params.promotionId);
  const body = req.body as UpdateEmployeePromotionBody;
  const data = await updatePromotionService(employeeId, promotionId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const productId = String(req.params.productId);
  const body = req.body as EmployeeProductBody;
  const data = await updateProductService(employeeId, productId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const orderId = String(req.params.id);
  const body = req.body as UpdateEmployeeOrderStatusBody;
  const data = await updateOrderStatusService(employeeId, orderId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityResources = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityResourcesService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateEmployeeResourceBody;
  const data = await createResourceService(employeeId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const resourceId = String(req.params.resourceId);
  const body = req.body as UpdateEmployeeResourceBody;
  const data = await updateResourceService(employeeId, resourceId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const deleteResource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const resourceId = String(req.params.resourceId);
  const data = await deleteResourceService(employeeId, resourceId);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

const deletePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const promotionId = String(req.params.promotionId);
  const data = await deletePromotionService(employeeId, promotionId);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const productId = String(req.params.productId);
  const data = await deleteProductService(employeeId, productId);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

const markReservationAttended = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const reservationId = String(req.params.reservationId);
  const data = await markReservationAttendanceService(
    employeeId,
    reservationId,
    ReservationStatus.Attended,
  );

  res.status(200).json({
    success: true,
    data,
  });
});

const markReservationNoShow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const reservationId = String(req.params.reservationId);
  const data = await markReservationAttendanceService(
    employeeId,
    reservationId,
    ReservationStatus.NoShow,
  );

  res.status(200).json({
    success: true,
    data,
  });
});

const getFacilityTrainers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const data = await getFacilityTrainersService(employeeId, facilityId);

  res.status(200).json({
    success: true,
    data,
  });
});

const createTrainer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const body = req.body as CreateEmployeeTrainerBody;
  const data = await createTrainerService(employeeId, facilityId, body);

  res.status(201).json({
    success: true,
    data,
  });
});

const updateTrainer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const trainerId = String(req.params.trainerId);
  const body = req.body as UpdateEmployeeTrainerBody;
  const data = await updateTrainerService(employeeId, trainerId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const deleteTrainer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const trainerId = String(req.params.trainerId);
  const data = await deleteTrainerService(employeeId, trainerId);

  res.status(200).json({
    success: true,
    message: data.message,
    data: {},
  });
});

const markTrainingCompleted = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const appointmentId = String(req.params.appointmentId);
  const data = await markTrainingAttendanceService(
    employeeId,
    appointmentId,
    AppointmentStatus.Completed,
  );

  res.status(200).json({
    success: true,
    data,
  });
});

const markTrainingNoShow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const appointmentId = String(req.params.appointmentId);
  const data = await markTrainingAttendanceService(
    employeeId,
    appointmentId,
    AppointmentStatus.NoShow,
  );

  res.status(200).json({
    success: true,
    data,
  });
});

export {
  createFacility,
  createProduct,
  createPromotion,
  createResource,
  createTrainer,
  deleteProduct,
  deletePromotion,
  deleteResource,
  deleteTrainer,
  getAttendance,
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
  updateFacility,
  updateOrderStatus,
  updateProduct,
  updatePromotion,
  updateProfile,
  updateResource,
  updateTrainer,
};
