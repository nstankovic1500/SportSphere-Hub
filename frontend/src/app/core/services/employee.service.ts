import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  EmployeeFacilitiesApiResponse,
  EmployeeProfileApiResponse,
} from '../models/api-response.model';
import type { UpdateEmployeeProfileRequest } from '../models/employee.model';

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
}
