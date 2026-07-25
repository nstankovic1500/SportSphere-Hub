import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeeTrainer } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-trainers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-trainers.component.html',
  styleUrl: './employee-trainers.component.css',
})
export class EmployeeTrainersComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  trainers: EmployeeTrainer[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  deletingIds = new Set<string>();

  constructor() {
    this.loadTrainers();
  }

  getTrainerName(trainer: EmployeeTrainer) {
    return `${trainer.firstName} ${trainer.lastName}`.trim();
  }

  getSportsLabel(trainer: EmployeeTrainer) {
    return trainer.sports.map((sport) => sport.name).join(', ');
  }

  deleteTrainer(trainer: EmployeeTrainer) {
    if (!window.confirm(`Delete trainer ${this.getTrainerName(trainer)}?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingIds.add(trainer.id);

    this.employeeService.deleteTrainer(trainer.id).subscribe({
      next: () => {
        this.trainers = this.trainers.filter((currentTrainer) => !(currentTrainer.id === trainer.id));
        this.deletingIds.delete(trainer.id);
        this.successMessage = 'Trainer deleted successfully.';
      },
      error: (error) => {
        this.deletingIds.delete(trainer.id);
        this.errorMessage = error.error?.message ?? 'Unable to delete trainer.';
      },
    });
  }

  isDeleting(trainerId: string) {
    return this.deletingIds.has(trainerId);
  }

  private loadTrainers() {
    this.employeeService.getTrainers(this.facilityId).subscribe({
      next: (response) => {
        this.trainers = response.data.trainers;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load trainers.';
        this.isLoading = false;
      },
    });
  }
}
