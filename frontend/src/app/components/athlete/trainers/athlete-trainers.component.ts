import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { FacilityListItem } from '../../../core/models/public.model';
import type { Sport } from '../../../core/models/sport.model';
import type { TrainerListItem } from '../../../core/models/trainer.model';
import { PublicService } from '../../../core/services/public.service';
import { TrainerService } from '../../../core/services/trainer.service';

@Component({
  selector: 'app-athlete-trainers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './athlete-trainers.component.html',
  styleUrl: './athlete-trainers.component.css',
})
export class AthleteTrainersComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicService = inject(PublicService);
  private readonly trainerService = inject(TrainerService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    facilityId: [''],
    sportId: [''],
  });

  facilities: FacilityListItem[] = [];
  sports: Sport[] = [];
  trainers: TrainerListItem[] = [];

  isLoading = true;
  isFiltering = false;
  errorMessage = '';

  constructor() {
    this.loadPageData();
  }

  applyFilters() {
    this.fetchTrainers(true);
  }

  resetFilters() {
    this.filterForm.reset({
      facilityId: '',
      sportId: '',
    });

    this.fetchTrainers(true);
  }

  getSportsLabel(trainer: TrainerListItem) {
    return trainer.sports.map((sport) => sport.name).join(', ');
  }

  trackByTrainerId(_: number, trainer: TrainerListItem) {
    return trainer.id;
  }

  private loadPageData() {
    forkJoin({
      facilitiesResponse: this.publicService.getFacilities({}),
      sportsResponse: this.publicService.getSports(),
    }).subscribe({
      next: ({ facilitiesResponse, sportsResponse }) => {
        this.facilities = facilitiesResponse.data.facilities;
        this.sports = sportsResponse.data.sports;
        this.fetchTrainers(false);
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati filtere trenera.';
        this.isLoading = false;
      },
    });
  }

  private fetchTrainers(fromFilters: boolean) {
    this.errorMessage = '';

    if (fromFilters) {
      this.isFiltering = true;
    } else {
      this.isLoading = true;
    }

    const formValue = this.filterForm.getRawValue();

    this.trainerService.getTrainers({
      facilityId: formValue.facilityId || undefined,
      sportId: formValue.sportId || undefined,
    }).subscribe({
      next: (response) => {
        this.trainers = response.data.trainers;
        this.isLoading = false;
        this.isFiltering = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati trenere.';
        this.isLoading = false;
        this.isFiltering = false;
      },
    });
  }
}
