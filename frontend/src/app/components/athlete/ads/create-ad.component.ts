import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { CreateAdRequest } from '../../../core/models/ad.model';
import type { Sport } from '../../../core/models/sport.model';
import { AdService } from '../../../core/services/ad.service';
import { PublicService } from '../../../core/services/public.service';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const futureDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { invalidDate: true };
  }

  const selectedDate = new Date(`${value}T00:00:00.000Z`);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (Number.isNaN(selectedDate.getTime())) {
    return { invalidDate: true };
  }

  return selectedDate.getTime() > today.getTime()
    ? null
    : { futureDate: true };
};

const timeRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const startTime = control.get('startTime')?.value;
  const endTime = control.get('endTime')?.value;

  if (!startTime || !endTime || !timePattern.test(startTime) || !timePattern.test(endTime)) {
    return null;
  }

  return endTime > startTime
    ? null
    : { invalidTimeRange: true };
};

@Component({
  selector: 'app-create-ad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-ad.component.html',
  styleUrl: './create-ad.component.css',
})
export class CreateAdComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adService = inject(AdService);
  private readonly publicService = inject(PublicService);
  private readonly router = inject(Router);

  readonly adForm = this.formBuilder.nonNullable.group(
    {
      sportId: ['', Validators.required],
      city: ['', Validators.required],
      date: ['', [Validators.required, futureDateValidator]],
      startTime: ['', [Validators.required, Validators.pattern(timePattern)]],
      endTime: ['', [Validators.required, Validators.pattern(timePattern)]],
      missingPlayers: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    },
    {
      validators: timeRangeValidator,
    },
  );

  sports: Sport[] = [];
  cities: string[] = [];

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadOptions();
  }

  get sportId() {
    return this.adForm.controls.sportId;
  }

  get city() {
    return this.adForm.controls.city;
  }

  get date() {
    return this.adForm.controls.date;
  }

  get startTime() {
    return this.adForm.controls.startTime;
  }

  get endTime() {
    return this.adForm.controls.endTime;
  }

  get missingPlayers() {
    return this.adForm.controls.missingPlayers;
  }

  submit() {
    if (this.adForm.invalid || this.isSubmitting) {
      this.adForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();

    this.adService.createAd(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Oglas je uspešno kreiran.';
        this.adForm.reset({
          sportId: '',
          city: '',
          date: '',
          startTime: '',
          endTime: '',
          missingPlayers: 1,
        });

        window.setTimeout(() => {
          void this.router.navigate(['/athlete/ads']);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće kreirati oglas.';
      },
    });
  }

  private loadOptions() {
    forkJoin({
      sportsResponse: this.publicService.getSports(),
      citiesResponse: this.publicService.getCities(),
    }).subscribe({
      next: ({ sportsResponse, citiesResponse }) => {
        this.sports = sportsResponse.data.sports;
        this.cities = citiesResponse.data.cities;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati opcije za oglas.';
        this.isLoading = false;
      },
    });
  }

  private buildPayload(): CreateAdRequest {
    const formValue = this.adForm.getRawValue();

    return {
      sportId: formValue.sportId,
      city: formValue.city.trim(),
      date: formValue.date,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      missingPlayers: Number(formValue.missingPlayers),
    };
  }
}
