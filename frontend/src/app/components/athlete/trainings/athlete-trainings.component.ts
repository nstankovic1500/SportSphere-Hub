import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AthleteTrainingAppointment } from '../../../core/models/trainer.model';
import { TrainerService } from '../../../core/services/trainer.service';

@Component({
  selector: 'app-athlete-trainings',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './athlete-trainings.component.html',
  styleUrl: './athlete-trainings.component.css',
})
export class AthleteTrainingsComponent {
  private readonly trainerService = inject(TrainerService);

  appointments: AthleteTrainingAppointment[] = [];
  cancellingIds = new Set<string>();
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadAppointments();
  }

  getStatusLabel(status: AthleteTrainingAppointment['status']) {
    switch (status) {
      case 'scheduled':
        return 'Zakazan';
      case 'completed':
        return 'Završen';
      case 'cancelled':
        return 'Otkazan';
      case 'no_show':
        return 'Nije došao';
      default:
        return status;
    }
  }

  cancelAppointment(appointment: AthleteTrainingAppointment) {
    if (!appointment.canCancel || this.cancellingIds.has(appointment.id)) {
      return;
    }

    this.cancellingIds.add(appointment.id);
    this.errorMessage = '';
    this.successMessage = '';

    this.trainerService.cancelTrainingAppointment(appointment.id).subscribe({
      next: (response) => {
        this.appointments = this.appointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? response.data.appointment
            : currentAppointment,
        );
        this.cancellingIds.delete(appointment.id);
        this.successMessage = 'Termin treninga je uspešno otkazan.';
      },
      error: (error) => {
        this.cancellingIds.delete(appointment.id);
        this.errorMessage = error.error?.message ?? 'Nije moguće otkazati termin treninga.';
      },
    });
  }

  isCancelling(appointmentId: string) {
    return this.cancellingIds.has(appointmentId);
  }

  private loadAppointments() {
    this.trainerService.getTrainingAppointments().subscribe({
      next: (response) => {
        this.appointments = response.data.appointments;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati istoriju treninga.';
        this.isLoading = false;
      },
    });
  }
}
