import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import type { UpdateEmployeeFacilityRequest } from '../../../core/models/employee.model';
import type { Sport } from '../../../core/models/sport.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { PublicService } from '../../../core/services/public.service';

@Component({
  selector: 'app-edit-facility',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-facility.component.html',
  styleUrl: './edit-facility.component.css',
})
export class EditFacilityComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly publicService = inject(PublicService);

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
  errorMessage = '';
  successMessage = '';
  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly weekdays = [
    { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
  ];

  constructor() { this.loadPageData(); }

  get openingHours() { return this.facilityForm.controls.openingHours as FormArray<FormGroup>; }
  get selectedSports() { return this.facilityForm.controls.sports; }
  get openingHourRows() { return this.openingHours.controls; }

  isSportSelected(sportId: string) { return this.selectedSports.value.includes(sportId); }

  onSportChange(sportId: string, checked: boolean) {
    const currentSports = this.selectedSports.value;
    this.selectedSports.setValue(
      checked ? [...currentSports, sportId] : currentSports.filter((selectedSportId) => !(selectedSportId === sportId)),
    );
    this.selectedSports.updateValueAndValidity();
  }

  addOpeningHour() { this.openingHours.push(this.createOpeningHourGroup()); }
  removeOpeningHour(index: number) { this.openingHours.removeAt(index); }

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

    this.employeeService.updateFacility(this.facilityId, this.buildPayload()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Facility updated successfully.';
        window.setTimeout(() => {
          void this.router.navigate(['/employee/facilities', this.facilityId]);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Unable to update facility.';
      },
    });
  }

  private loadPageData() {
    forkJoin({
      sportsResponse: this.publicService.getSports(),
      facilityResponse: this.employeeService.getFacility(this.facilityId),
    }).subscribe({
      next: ({ sportsResponse, facilityResponse }) => {
        this.sports = sportsResponse.data.sports;
        const facility = facilityResponse.data.facility;
        this.patchForm(facility);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load facility.';
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

  private patchForm(facility: any) {
    this.openingHours.clear();
    for (const openingHour of facility.openingHours ?? []) {
      this.openingHours.push(this.formBuilder.nonNullable.group({
        day: [openingHour.day, [Validators.required, Validators.min(0), Validators.max(6)]],
        open: [openingHour.open, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
        close: [openingHour.close, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      }));
    }
    if (this.openingHours.length === 0) { this.addOpeningHour(); }

    this.facilityForm.reset({
      name: facility.name,
      city: facility.city,
      country: facility.country,
      address: facility.address,
      description: facility.description,
      longitude: facility.location?.coordinates?.[0] ?? 0,
      latitude: facility.location?.coordinates?.[1] ?? 0,
      sports: facility.sports.map((sport: Sport) => sport.id),
      hourlyPrice: facility.hourlyPrice,
      allowedNoShows: facility.allowedNoShows ?? 0,
      openingHours: [],
    });
  }

  private buildPayload(): UpdateEmployeeFacilityRequest {
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
}
