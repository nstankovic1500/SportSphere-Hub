import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AdminTrainer } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './admin-trainers.component.html',
  styleUrl: './admin-trainers.component.css',
})
export class AdminTrainersComponent {
  private readonly adminService = inject(AdminService);

  trainers: AdminTrainer[] = [];
  isLoading = true;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadTrainers();
  }

  deactivateTrainer(trainer: AdminTrainer) {
    if (this.isProcessing || !trainer.active || !window.confirm(`Deaktivirati trenera ${trainer.firstName} ${trainer.lastName}?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.deactivateTrainer(trainer.id).subscribe({
      next: (response) => {
        this.trainers = this.trainers.map((currentTrainer) =>
          currentTrainer.id === trainer.id ? response.data.trainer : currentTrainer,
        );
        this.isProcessing = false;
        this.successMessage = 'Trener je uspešno deaktiviran.';
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće deaktivirati trenera.';
      },
    });
  }

  private loadTrainers() {
    this.adminService.getTrainers().subscribe({
      next: (response) => {
        this.trainers = response.data.trainers;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati trenere.';
        this.isLoading = false;
      },
    });
  }
}
