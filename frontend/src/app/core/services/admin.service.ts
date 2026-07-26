import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  AdminFacilityRequestsResponse,
  AdminSportApiResponse,
  AdminSportsApiResponse,
  AdminTrainerApiResponse,
  AdminTrainersApiResponse,
  AdminUserApiResponse,
  AdminUsersApiResponse,
  AdminResolvedFacilityRequestResponse,
  AdminRegistrationRequestsResponse,
  AdminResolvedRegistrationResponse,
  ApiResponse,
} from '../models/api-response.model';
import type { CreateAdminSportRequest, UpdateAdminUserRequest } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getRegistrationRequests() {
    return this.http.get<AdminRegistrationRequestsResponse>(
      `${environment.apiUrl}/admin/registrationRequests`,
    );
  }

  approveRegistration(userId: string) {
    return this.http.patch<AdminResolvedRegistrationResponse>(
      `${environment.apiUrl}/admin/registrationRequests/${userId}/approve`,
      {},
    );
  }

  rejectRegistration(userId: string) {
    return this.http.patch<AdminResolvedRegistrationResponse>(
      `${environment.apiUrl}/admin/registrationRequests/${userId}/reject`,
      {},
    );
  }

  getFacilityRequests() {
    return this.http.get<AdminFacilityRequestsResponse>(
      `${environment.apiUrl}/admin/facility-requests`,
    );
  }

  getUsers() {
    return this.http.get<AdminUsersApiResponse>(`${environment.apiUrl}/admin/users`);
  }

  updateUser(userId: string, payload: UpdateAdminUserRequest) {
    return this.http.patch<AdminUserApiResponse>(`${environment.apiUrl}/admin/users/${userId}`, payload);
  }

  deleteUser(userId: string) {
    return this.http.delete<ApiResponse<Record<string, never>>>(`${environment.apiUrl}/admin/users/${userId}`);
  }

  approveFacilityRequest(facilityId: string) {
    return this.http.patch<AdminResolvedFacilityRequestResponse>(
      `${environment.apiUrl}/admin/facility-requests/${facilityId}/approve`,
      {},
    );
  }

  rejectFacilityRequest(facilityId: string) {
    return this.http.patch<AdminResolvedFacilityRequestResponse>(
      `${environment.apiUrl}/admin/facility-requests/${facilityId}/reject`,
      {},
    );
  }

  getTrainers() {
    return this.http.get<AdminTrainersApiResponse>(`${environment.apiUrl}/admin/trainers`);
  }

  deactivateTrainer(trainerId: string) {
    return this.http.patch<AdminTrainerApiResponse>(`${environment.apiUrl}/admin/trainers/${trainerId}/deactivate`, {});
  }

  getSports() {
    return this.http.get<AdminSportsApiResponse>(`${environment.apiUrl}/admin/sports`);
  }

  createSport(payload: CreateAdminSportRequest) {
    return this.http.post<AdminSportApiResponse>(`${environment.apiUrl}/admin/sports`, payload);
  }
}
