import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api-response.model';
import type {
  AthleteTrainingAppointment,
  CreateTrainingAppointmentRequest,
  TrainerAvailability,
  TrainerDetails,
  TrainerFilters,
  TrainerListItem,
} from '../models/trainer.model';

@Injectable({
  providedIn: 'root',
})
export class TrainerService {
  private readonly http = inject(HttpClient);

  getTrainers(filters: TrainerFilters) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<ApiResponse<{ trainers: TrainerListItem[] }>>(
      `${environment.apiUrl}/trainers`,
      { params },
    );
  }

  getTrainer(trainerId: string) {
    return this.http.get<ApiResponse<{ trainer: TrainerDetails }>>(
      `${environment.apiUrl}/trainers/${trainerId}`,
    );
  }

  getTrainerAvailability(trainerId: string, date: string) {
    return this.http.get<ApiResponse<{ availability: TrainerAvailability }>>(
      `${environment.apiUrl}/trainers/${trainerId}/availability`,
      {
        params: {
          date,
        },
      },
    );
  }

  createTrainingAppointment(payload: CreateTrainingAppointmentRequest) {
    return this.http.post<ApiResponse<{ appointment: AthleteTrainingAppointment }>>(
      `${environment.apiUrl}/athletes/training-appointments`,
      payload,
    );
  }

  getTrainingAppointments() {
    return this.http.get<ApiResponse<{ appointments: AthleteTrainingAppointment[] }>>(
      `${environment.apiUrl}/athletes/training-appointments`,
    );
  }

  cancelTrainingAppointment(appointmentId: string) {
    return this.http.patch<ApiResponse<{ appointment: AthleteTrainingAppointment }>>(
      `${environment.apiUrl}/athletes/training-appointments/${appointmentId}/cancel`,
      {},
    );
  }
}
