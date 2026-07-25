import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  EmployeeCreatedFacilityApiResponse,
  EmployeeOrderApiResponse,
  EmployeeOrdersApiResponse,
  EmployeeProductApiResponse,
  EmployeeProductsApiResponse,
  EmployeePromotionApiResponse,
  EmployeePromotionsApiResponse,
  EmployeeCreatedResourceApiResponse,
  EmployeeCreatedTrainerApiResponse,
  EmployeeAttendanceApiResponse,
  EmployeeAttendanceUpdateApiResponse,
  EmployeeFacilityApiResponse,
  EmployeeFacilitiesApiResponse,
  EmployeeProfileApiResponse,
  EmployeeResourcesApiResponse,
  EmployeeTrainersApiResponse,
} from '../models/api-response.model';
import type {
  CreateEmployeeFacilityRequest,
  EmployeeOrder,
  EmployeeProductRequest,
  CreateEmployeePromotionRequest,
  CreateEmployeeResourceRequest,
  CreateEmployeeTrainerRequest,
  EmployeeAttendanceType,
  UpdateEmployeePromotionRequest,
  UpdateEmployeeFacilityRequest,
  UpdateEmployeeOrderStatusRequest,
  UpdateEmployeeProfileRequest,
  UpdateEmployeeResourceRequest,
  UpdateEmployeeTrainerRequest,
} from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);

  getProfile() {
    return this.http.get<EmployeeProfileApiResponse>(`${environment.apiUrl}/employees/profile`);
  }

  updateProfile(payload: UpdateEmployeeProfileRequest) {
    return this.http.patch<EmployeeProfileApiResponse>(
      `${environment.apiUrl}/employees/profile`,
      payload,
    );
  }

  getFacilities() {
    return this.http.get<EmployeeFacilitiesApiResponse>(`${environment.apiUrl}/employees/facilities`);
  }

  createFacility(payload: CreateEmployeeFacilityRequest) {
    return this.http.post<EmployeeCreatedFacilityApiResponse>(
      `${environment.apiUrl}/employees/facilities`,
      payload,
    );
  }

  getFacility(facilityId: string) {
    return this.http.get<EmployeeFacilityApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}`,
    );
  }

  getAttendance(facilityId: string, filters: { date?: string; type?: EmployeeAttendanceType }) {
    let params = new HttpParams();

    if (filters.date) {
      params = params.set('date', filters.date);
    }

    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<EmployeeAttendanceApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/attendance`,
      { params },
    );
  }

  getOrders(facilityId: string) {
    return this.http.get<EmployeeOrdersApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/orders`,
    );
  }

  getProducts(facilityId: string, active?: boolean) {
    let params = new HttpParams();

    if (typeof active === 'boolean') {
      params = params.set('active', String(active));
    }

    return this.http.get<EmployeeProductsApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/products`,
      { params },
    );
  }

  getPromotions(facilityId: string) {
    return this.http.get<EmployeePromotionsApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/promotions`,
    );
  }

  updateFacility(facilityId: string, payload: UpdateEmployeeFacilityRequest) {
    return this.http.patch<EmployeeFacilityApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}`,
      payload,
    );
  }

  createPromotion(facilityId: string, payload: CreateEmployeePromotionRequest) {
    return this.http.post<EmployeePromotionApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/promotions`,
      payload,
    );
  }

  createProduct(facilityId: string, payload: EmployeeProductRequest) {
    return this.http.post<EmployeeProductApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/products`,
      payload,
    );
  }

  updatePromotion(promotionId: string, payload: UpdateEmployeePromotionRequest) {
    return this.http.patch<EmployeePromotionApiResponse>(
      `${environment.apiUrl}/employees/promotions/${promotionId}`,
      payload,
    );
  }

  updateProduct(productId: string, payload: EmployeeProductRequest) {
    return this.http.patch<EmployeeProductApiResponse>(
      `${environment.apiUrl}/employees/products/${productId}`,
      payload,
    );
  }

  updateOrderStatus(orderId: string, payload: UpdateEmployeeOrderStatusRequest) {
    return this.http.patch<EmployeeOrderApiResponse>(
      `${environment.apiUrl}/employees/orders/${orderId}/status`,
      payload,
    );
  }

  deletePromotion(promotionId: string) {
    return this.http.delete<ApiResponse<Record<string, never>>>(
      `${environment.apiUrl}/employees/promotions/${promotionId}`,
    );
  }

  deleteProduct(productId: string) {
    return this.http.delete<ApiResponse<Record<string, never>>>(
      `${environment.apiUrl}/employees/products/${productId}`,
    );
  }

  getResources(facilityId: string) {
    return this.http.get<EmployeeResourcesApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/resources`,
    );
  }

  createResource(facilityId: string, payload: CreateEmployeeResourceRequest) {
    return this.http.post<EmployeeCreatedResourceApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/resources`,
      payload,
    );
  }

  updateResource(resourceId: string, payload: UpdateEmployeeResourceRequest) {
    return this.http.patch<EmployeeCreatedResourceApiResponse>(
      `${environment.apiUrl}/employees/resources/${resourceId}`,
      payload,
    );
  }

  deleteResource(resourceId: string) {
    return this.http.delete<ApiResponse<Record<string, never>>>(
      `${environment.apiUrl}/employees/resources/${resourceId}`,
    );
  }

  markReservationAttended(reservationId: string) {
    return this.http.patch<EmployeeAttendanceUpdateApiResponse>(
      `${environment.apiUrl}/employees/reservations/${reservationId}/attended`,
      {},
    );
  }

  markReservationNoShow(reservationId: string) {
    return this.http.patch<EmployeeAttendanceUpdateApiResponse>(
      `${environment.apiUrl}/employees/reservations/${reservationId}/no-show`,
      {},
    );
  }

  getTrainers(facilityId: string) {
    return this.http.get<EmployeeTrainersApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/trainers`,
    );
  }

  createTrainer(facilityId: string, payload: CreateEmployeeTrainerRequest) {
    return this.http.post<EmployeeCreatedTrainerApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}/trainers`,
      payload,
    );
  }

  updateTrainer(trainerId: string, payload: UpdateEmployeeTrainerRequest) {
    return this.http.patch<EmployeeCreatedTrainerApiResponse>(
      `${environment.apiUrl}/employees/trainers/${trainerId}`,
      payload,
    );
  }

  deleteTrainer(trainerId: string) {
    return this.http.delete<ApiResponse<Record<string, never>>>(
      `${environment.apiUrl}/employees/trainers/${trainerId}`,
    );
  }

  markTrainingCompleted(appointmentId: string) {
    return this.http.patch<EmployeeAttendanceUpdateApiResponse>(
      `${environment.apiUrl}/employees/training-appointments/${appointmentId}/completed`,
      {},
    );
  }

  markTrainingNoShow(appointmentId: string) {
    return this.http.patch<EmployeeAttendanceUpdateApiResponse>(
      `${environment.apiUrl}/employees/training-appointments/${appointmentId}/no-show`,
      {},
    );
  }
}
