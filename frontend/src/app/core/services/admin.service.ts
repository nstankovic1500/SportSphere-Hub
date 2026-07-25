import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type {
  AdminFacilityRequestsResponse,
  AdminResolvedFacilityRequestResponse,
  AdminRegistrationRequestsResponse,
  AdminResolvedRegistrationResponse,
} from '../models/api-response.model';

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
}
