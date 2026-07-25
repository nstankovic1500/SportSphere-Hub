import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  EmployeeCreatedFacilityApiResponse,
  EmployeeCreatedResourceApiResponse,
  EmployeeFacilityApiResponse,
  EmployeeFacilitiesApiResponse,
  EmployeeProfileApiResponse,
  EmployeeResourcesApiResponse,
} from '../models/api-response.model';
import type {
  CreateEmployeeFacilityRequest,
  CreateEmployeeResourceRequest,
  UpdateEmployeeFacilityRequest,
  UpdateEmployeeProfileRequest,
  UpdateEmployeeResourceRequest,
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

  updateFacility(facilityId: string, payload: UpdateEmployeeFacilityRequest) {
    return this.http.patch<EmployeeFacilityApiResponse>(
      `${environment.apiUrl}/employees/facilities/${facilityId}`,
      payload,
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
}
