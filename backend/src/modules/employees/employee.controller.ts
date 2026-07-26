import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppointmentStatus } from '../../models/Appointment';
import { ReservationStatus } from '../../models/Reservation';
import type { AttendanceQuery } from './attendance.types';
import type {
  EmployeeCalendarQuery,
  MoveReservationBody,
} from './employee-calendar.types';
import type { MonthlyReportQuery } from './employee-reports.types';
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
  deleteFacilityImage as deleteFacilityImageService,
  deleteProduct as deleteProductService,
  deletePromotion as deletePromotionService,
  deleteResource as deleteResourceService,
  deleteTrainer as deleteTrainerService,
  getAttendance as getAttendanceService,
  getFacilityCalendar as getFacilityCalendarService,
  getFacilities as getFacilitiesService,
  getFacility as getFacilityService,
  getMonthlyEquipmentPdf as getMonthlyEquipmentPdfService,
  getMonthlyOccupancyPdf as getMonthlyOccupancyPdfService,
  getFacilityOrders as getFacilityOrdersService,
  getFacilityProducts as getFacilityProductsService,
  getFacilityPromotions as getFacilityPromotionsService,
  getFacilityResources as getFacilityResourcesService,
  getFacilityTrainers as getFacilityTrainersService,
  markReservationAttendance as markReservationAttendanceService,
  markTrainingAttendance as markTrainingAttendanceService,
  moveReservation as moveReservationService,
  moveTrainingAppointment as moveTrainingAppointmentService,
  getProfile as getProfileService,
  updateFacility as updateFacilityService,
  updateOrderStatus as updateOrderStatusService,
  updateProduct as updateProductService,
  updateProductImage as updateProductImageService,
  updatePromotion as updatePromotionService,
  updateProfile as updateProfileService,
  updateResource as updateResourceService,
  updateTrainer as updateTrainerService,
  uploadFacilityImages as uploadFacilityImagesService,
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

const getFacilityCalendar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const query = req.query as EmployeeCalendarQuery;
  const data = await getFacilityCalendarService(employeeId, facilityId, query);

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

const getMonthlyReportPdf = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const query = req.query as MonthlyReportQuery;
  const month = typeof query.month === 'string' ? query.month : '';
  const type = query.type === 'equipment' ? 'equipment' : 'occupancy';

  const data =
    type === 'equipment'
      ? await getMonthlyEquipmentPdfService(employeeId, facilityId, month)
      : await getMonthlyOccupancyPdfService(employeeId, facilityId, month);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${data.fileName}"`);
  res.setHeader('Content-Length', String(data.pdf.length));
  res.status(200).end(data.pdf);
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

const uploadFacilityImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const files = Array.isArray(req.files) ? req.files : undefined;
  const data = await uploadFacilityImagesService(employeeId, facilityId, files);

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

const updateProductImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const productId = String(req.params.productId);
  const data = await updateProductImageService(employeeId, productId, req.file);

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

const moveReservation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const reservationId = String(req.params.reservationId);
  const body = req.body as MoveReservationBody;
  const data = await moveReservationService(employeeId, reservationId, body);

  res.status(200).json({
    success: true,
    data,
  });
});

const moveTrainingAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const appointmentId = String(req.params.appointmentId);
  const body = req.body as MoveReservationBody;
  const data = await moveTrainingAppointmentService(employeeId, appointmentId, body);

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

const deleteFacilityImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employeeId = String(req.auth?.userId);
  const facilityId = String(req.params.facilityId);
  const imagePath = typeof req.body.imagePath === 'string' ? req.body.imagePath : '';
  const data = await deleteFacilityImageService(employeeId, facilityId, imagePath);

  res.status(200).json({
    success: true,
    data,
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
  uploadFacilityImages,
  deleteFacilityImage,
  deleteProduct,
  deletePromotion,
  deleteResource,
  deleteTrainer,
  getAttendance,
  getFacilityCalendar,
  getFacilities,
  getFacility,
  getMonthlyReportPdf,
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
};
