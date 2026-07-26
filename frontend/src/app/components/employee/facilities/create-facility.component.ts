import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { CreateEmployeeFacilityRequest } from '../../../core/models/employee.model';
import type { Sport } from '../../../core/models/sport.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { PublicService } from '../../../core/services/public.service';

@Component({
  selector: 'app-create-facility',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-facility.component.html',
  styleUrl: './create-facility.component.css',
})
export class CreateFacilityComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly publicService = inject(PublicService);
  private readonly router = inject(Router);

  readonly facilityForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
    address: ['', Validators.required],
    description: ['', Validators.required],
    longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
    latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    sports: this.formBuilder.nonNullable.control<string[]>([]),
    hourlyPrice: [0, [Validators.required, Validators.min(0)]],
    allowedNoShows: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    openingHours: this.formBuilder.array<FormGroup>([]),
  });

  sports: Sport[] = [];
  isLoading = true;
  isSubmitting = false;
  isUploadingImages = false;
  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];

  readonly weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  constructor() {
    this.loadSports();
  }

  get openingHours() {
    return this.facilityForm.controls.openingHours as FormArray<FormGroup>;
  }

  get selectedSports() {
    return this.facilityForm.controls.sports;
  }

  get openingHourRows() {
    return this.openingHours.controls;
  }

  isSportSelected(sportId: string) {
    return this.selectedSports.value.includes(sportId);
  }

  onSportChange(sportId: string, checked: boolean) {
    const currentSports = this.selectedSports.value;
    this.selectedSports.setValue(
      checked
        ? [...currentSports, sportId]
        : currentSports.filter((selectedSportId) => !(selectedSportId === sportId)),
    );
    this.selectedSports.updateValueAndValidity();
  }

  addOpeningHour() {
    this.openingHours.push(this.createOpeningHourGroup());
  }

  removeOpeningHour(index: number) {
    this.openingHours.removeAt(index);
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.imageErrorMessage = '';

    const validationError = this.validateImageFiles(files);

    if (validationError) {
      input.value = '';
      this.selectedImageFiles = [];
      this.imagePreviews = [];
      this.imageErrorMessage = validationError;
      return;
    }

    this.selectedImageFiles = files;
    this.imagePreviews = files.map((file) => URL.createObjectURL(file));
  }

  submit() {
    if (this.facilityForm.invalid || this.selectedSports.value.length === 0 || this.isSubmitting) {
      this.facilityForm.markAllAsTouched();
      if (this.selectedSports.value.length === 0) {
        this.selectedSports.setErrors({ required: true });
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();

    this.employeeService.createFacility(payload).subscribe({
      next: (response) => {
        const facilityId = response.data.facility.id;

        if (this.selectedImageFiles.length === 0) {
          this.finishSuccess();
          return;
        }

        this.isUploadingImages = true;

        this.employeeService.uploadFacilityImages(facilityId, this.selectedImageFiles).subscribe({
          next: () => {
            this.isUploadingImages = false;
            this.finishSuccess();
          },
          error: (error) => {
            this.isSubmitting = false;
            this.isUploadingImages = false;
            this.errorMessage = error.error?.message ?? 'Facility was created, but images could not be uploaded.';
          },
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Unable to create facility request.';
      },
    });
  }

  private loadSports() {
    forkJoin({
      sportsResponse: this.publicService.getSports(),
    }).subscribe({
      next: ({ sportsResponse }) => {
        this.sports = sportsResponse.data.sports;
        if (this.openingHours.length === 0) {
          this.addOpeningHour();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load sports.';
        this.isLoading = false;
      },
    });
  }

  private createOpeningHourGroup() {
    return this.formBuilder.nonNullable.group({
      day: [1, [Validators.required, Validators.min(0), Validators.max(6)]],
      open: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      close: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
    });
  }

  private buildPayload(): CreateEmployeeFacilityRequest {
    const formValue = this.facilityForm.getRawValue();

    return {
      name: formValue.name.trim(),
      city: formValue.city.trim(),
      country: formValue.country.trim(),
      address: formValue.address.trim(),
      description: formValue.description.trim(),
      longitude: Number(formValue.longitude),
      latitude: Number(formValue.latitude),
      sports: formValue.sports,
      openingHours: this.openingHours.controls.map((row) => ({
        day: Number(row.get('day')?.value),
        open: String(row.get('open')?.value ?? ''),
        close: String(row.get('close')?.value ?? ''),
      })),
      hourlyPrice: Number(formValue.hourlyPrice),
      allowedNoShows: Number(formValue.allowedNoShows),
    };
  }

  private finishSuccess() {
    this.isSubmitting = false;
    this.successMessage = 'Facility request created successfully.';

    window.setTimeout(() => {
      void this.router.navigate(['/employee/facilities']);
    }, 1200);
  }

  private validateImageFiles(files: File[]) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (files.length > 5) {
      return 'You can upload at most 5 images at once.';
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return 'Only JPG, PNG and WEBP images are allowed.';
      }

      if (file.size > 5 * 1024 * 1024) {
        return 'Each image must be 5 MB or smaller.';
      }
    }

    return '';
  }
}
