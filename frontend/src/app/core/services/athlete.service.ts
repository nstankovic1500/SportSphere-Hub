import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';
import type {
  AthleteReservationRequest,
  AthleteProfile,
  AthleteReservation,
  ResourceAvailability,
  UpdateAthleteProfileRequest,
} from '../models/athlete.model';

@Injectable({
  providedIn: 'root',
})
export class AthleteService {
  private readonly http = inject(HttpClient);

  getProfile() {
    return this.http.get<ApiResponse<{ athlete: AthleteProfile }>>(
      `${environment.apiUrl}/athletes/profile`,
    );
  }

  updateProfile(payload: UpdateAthleteProfileRequest) {
    return this.http.patch<ApiResponse<{ athlete: AthleteProfile }>>(
      `${environment.apiUrl}/athletes/profile`,
      payload,
    );
  }

  getReservations() {
    return this.http.get<ApiResponse<{ reservations: AthleteReservation[] }>>(
      `${environment.apiUrl}/athletes/reservations`,
    );
  }

  cancelReservation(id: string) {
    return this.http.patch<ApiResponse<{ reservation: AthleteReservation }>>(
      `${environment.apiUrl}/athletes/reservations/${id}/cancel`,
      {},
    );
  }

  getResourceAvailability(resourceId: string, date: string) {
    return this.http.get<ApiResponse<{ availability: ResourceAvailability }>>(
      `${environment.apiUrl}/athletes/resources/${resourceId}/availability`,
      {
        params: {
          date,
        },
      },
    );
  }

  createReservation(payload: AthleteReservationRequest) {
    return this.http.post<ApiResponse<{ reservation: AthleteReservation }>>(
      `${environment.apiUrl}/athletes/reservations`,
      payload,
    );
  }
}
