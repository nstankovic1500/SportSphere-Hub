import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  EmployeeCreatedFacilityApiResponse,
  EmployeeFacilitiesApiResponse,
  EmployeeProfileApiResponse,
} from '../models/api-response.model';
import type {
  CreateEmployeeFacilityRequest,
  UpdateEmployeeProfileRequest,
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
}
