import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import type {
  CreateEmployeeTrainerRequest,
  EmployeeFacility,
  EmployeeTrainer,
  UpdateEmployeeTrainerRequest,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-trainer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trainer-form.component.html',
  styleUrl: './trainer-form.component.css',
})
export class TrainerFormComponent {
  private readonly phonePattern = /^[0-9+\-\s()]{6,20}$/;
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly trainerId = this.route.snapshot.paramMap.get('trainerId');
  readonly isEditMode = !!this.trainerId;

  readonly trainerForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
    sports: this.formBuilder.nonNullable.control<string[]>([]),
    biography: ['', [Validators.required, Validators.maxLength(1000)]],
    pricePerHour: [0, [Validators.required, Validators.min(0)]],
    active: [true],
    workingHours: this.formBuilder.array<FormGroup>([]),
  });

  facility: EmployeeFacility | null = null;
  trainer: EmployeeTrainer | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly weekdays = [
    { value: 0, label: 'Nedelja' },
    { value: 1, label: 'Ponedeljak' },
    { value: 2, label: 'Utorak' },
    { value: 3, label: 'Sreda' },
    { value: 4, label: 'Četvrtak' },
    { value: 5, label: 'Petak' },
    { value: 6, label: 'Subota' },
  ];

  constructor() {
    this.loadPageData();
  }

  get selectedSports() {
    return this.trainerForm.controls.sports;
  }

  get supportedSports() {
    return this.facility?.sports ?? [];
  }

  get workingHours() {
    return this.trainerForm.controls.workingHours as FormArray<FormGroup>;
  }

  get workingHourRows() {
    return this.workingHours.controls;
  }

  get firstNameControl() {
    return this.trainerForm.controls.firstName;
  }

  get lastNameControl() {
    return this.trainerForm.controls.lastName;
  }

  get emailControl() {
    return this.trainerForm.controls.email;
  }

  get phoneControl() {
    return this.trainerForm.controls.phone;
  }

  get biographyControl() {
    return this.trainerForm.controls.biography;
  }

  get pricePerHourControl() {
    return this.trainerForm.controls.pricePerHour;
  }

  hasWorkingHoursDuplicateDays() {
    const days = this.workingHours.controls.map((row) => Number(row.get('day')?.value));
    return new Set(days).size !== days.length;
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

  addWorkingHour() {
    this.workingHours.push(this.createWorkingHourGroup());
  }

  removeWorkingHour(index: number) {
    this.workingHours.removeAt(index);
  }

  submit() {
    if (this.trainerForm.invalid || this.selectedSports.value.length === 0 || this.isSubmitting) {
      this.trainerForm.markAllAsTouched();
      if (this.selectedSports.value.length === 0) {
        this.selectedSports.setErrors({ required: true });
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.isEditMode && this.trainerId
      ? this.employeeService.updateTrainer(this.trainerId, this.makeUpdatePayload())
      : this.employeeService.createTrainer(this.facilityId, this.makeCreatePayload());

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.isEditMode ? 'Trener je uspešno ažuriran.' : 'Trener je uspešno kreiran.';
        window.setTimeout(() => {
          void this.router.navigate(['/employee/facilities', this.facilityId, 'trainers']);
        }, 1200);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće sačuvati trenera.';
      },
    });
  }

  private loadPageData() {
    const requests: any = {
      facilityResponse: this.employeeService.getFacility(this.facilityId),
    };

    if (this.isEditMode) {
      requests.trainersResponse = this.employeeService.getTrainers(this.facilityId);
    }

    forkJoin(requests).subscribe({
      next: (response: any) => {
        this.facility = response.facilityResponse.data.facility;

        if (this.isEditMode) {
          this.trainer = response.trainersResponse.data.trainers.find(
            (trainer: EmployeeTrainer) => trainer.id === this.trainerId,
          ) ?? null;

          if (this.trainer) {
            this.patchTrainer(this.trainer);
          }
        } else {
          this.addWorkingHour();
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati formu trenera.';
        this.isLoading = false;
      },
    });
  }

  private createWorkingHourGroup() {
    return this.formBuilder.nonNullable.group({
      day: [1, [Validators.required, Validators.min(0), Validators.max(6)]],
      open: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      close: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
    });
  }

  private patchTrainer(trainer: EmployeeTrainer) {
    this.workingHours.clear();
    for (const workingHour of trainer.workingHours) {
      this.workingHours.push(this.formBuilder.nonNullable.group({
        day: [workingHour.day, [Validators.required, Validators.min(0), Validators.max(6)]],
        open: [workingHour.open, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
        close: [workingHour.close, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      }));
    }
    if (this.workingHours.length === 0) {
      this.addWorkingHour();
    }

    this.trainerForm.reset({
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone,
      sports: trainer.sports.map((sport) => sport.id),
      biography: trainer.biography ?? '',
      pricePerHour: trainer.pricePerHour,
      active: trainer.active,
      workingHours: [],
    });
  }

  private makeCreatePayload(): CreateEmployeeTrainerRequest {
    const formValue = this.trainerForm.getRawValue();
    return {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      sports: formValue.sports,
      workingHours: this.workingHours.controls.map((row) => ({
        day: Number(row.get('day')?.value),
        open: String(row.get('open')?.value ?? ''),
        close: String(row.get('close')?.value ?? ''),
      })),
      biography: formValue.biography.trim(),
      pricePerHour: Number(formValue.pricePerHour),
    };
  }

  private makeUpdatePayload(): UpdateEmployeeTrainerRequest {
    const formValue = this.trainerForm.getRawValue();
    return {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      sports: formValue.sports,
      workingHours: this.workingHours.controls.map((row) => ({
        day: Number(row.get('day')?.value),
        open: String(row.get('open')?.value ?? ''),
        close: String(row.get('close')?.value ?? ''),
      })),
      biography: formValue.biography.trim(),
      pricePerHour: Number(formValue.pricePerHour),
      active: formValue.active,
    };
  }
}
