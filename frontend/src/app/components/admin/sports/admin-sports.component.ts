import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { AdminSport } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-sports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-sports.component.html',
  styleUrl: './admin-sports.component.css',
})
export class AdminSportsComponent {
  private readonly adminService = inject(AdminService);
  private readonly formBuilder = inject(FormBuilder);

  sports: AdminSport[] = [];
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly sportForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    this.loadSports();
  }

  createSport() {
    if (this.sportForm.invalid || this.isSubmitting) {
      this.sportForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.createSport({
      name: this.sportForm.controls.name.value.trim(),
    }).subscribe({
      next: (response) => {
        this.sports = [...this.sports, response.data.sport].sort((first, second) =>
          first.name.localeCompare(second.name),
        );
        this.isSubmitting = false;
        this.successMessage = 'Sport je uspešno dodat.';
        this.sportForm.reset({ name: '' });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće dodati sport.';
      },
    });
  }

  private loadSports() {
    this.adminService.getSports().subscribe({
      next: (response) => {
        this.sports = response.data.sports;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati sportove.';
        this.isLoading = false;
      },
    });
  }
}
