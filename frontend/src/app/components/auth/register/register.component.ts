import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

import { environment } from '../../../../environments/environment';
import type {
  ApiResponse,
  SportsResponseData,
} from '../../../core/models/api-response.model';
import type { RegisterRequest } from '../../../core/models/register.model';
import type { Sport } from '../../../core/models/sport.model';
import { AuthService } from '../../../core/services/auth.service';

const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].{7,11}$/;

const passwordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.value;

  if (!password) {
    return null;
  }

  return passwordPattern.test(password)
    ? null
    : { invalidPassword: true };
};

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

const maxSelectedSportsValidator = (
  maximum: number,
): ValidatorFn => {
  return (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const selectedSports = control.value;

    if (!Array.isArray(selectedSports)) {
      return null;
    }

    return selectedSports.length <= maximum
      ? null
      : { maxSelectedSports: true };
  };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      username: ['', Validators.required],

      password: [
        '',
        [
          Validators.required,
          passwordValidator,
        ],
      ],

      confirmPassword: ['', Validators.required],

      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],

      role: this.formBuilder.nonNullable.control<
        'athlete' | 'employee'
      >('athlete'),

      favoriteSports:
        this.formBuilder.nonNullable.control<string[]>(
          [],
          [maxSelectedSportsValidator(5)],
        ),

      employeeData: this.formBuilder.nonNullable.group({
        companyName: [''],
        headOfficeAddress: [''],
        registrationNumber: [''],
        pib: [''],
      }),
    },
    {
      validators: passwordMatchValidator,
    },
  );

  sports: Sport[] = [];

  isLoadingSports = true;
  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadSports();

    this.role.valueChanges.subscribe((role) => {
      this.updateEmployeeValidators(role);
    });
  }

  get username() {
    return this.registerForm.controls.username;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get confirmPassword() {
    return this.registerForm.controls.confirmPassword;
  }

  get firstName() {
    return this.registerForm.controls.firstName;
  }

  get lastName() {
    return this.registerForm.controls.lastName;
  }

  get phone() {
    return this.registerForm.controls.phone;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get role() {
    return this.registerForm.controls.role;
  }

  get favoriteSports() {
    return this.registerForm.controls.favoriteSports;
  }

  get employeeDataGroup() {
    return this.registerForm.controls.employeeData;
  }

  get isEmployee(): boolean {
    return this.role.value === 'employee';
  }

  canSelectMoreSports(sportId: string): boolean {
    return (
      this.isSportSelected(sportId) ||
      this.favoriteSports.value.length < 5
    );
  }

  isSportSelected(sportId: string): boolean {
    return this.favoriteSports.value.includes(sportId);
  }

  onSportChange(
    sportId: string,
    checked: boolean,
  ): void {
    const selectedSports = this.favoriteSports.value;

    if (checked) {
      if (selectedSports.length >= 5) {
        this.favoriteSports.markAsTouched();
        this.favoriteSports.setErrors({
          maxSelectedSports: true,
        });
        return;
      }

      this.favoriteSports.setValue([
        ...selectedSports,
        sportId,
      ]);
      this.favoriteSports.updateValueAndValidity();

      return;
    }

    this.favoriteSports.setValue(
      selectedSports.filter(
        (selectedId) => selectedId !== sportId,
      ),
    );
    this.favoriteSports.updateValueAndValidity();
  }

  onSubmit(): void {
    if (
      this.registerForm.invalid ||
      this.isSubmitting
    ) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;

        this.successMessage =
          'Registration request submitted. Wait for administrator approval.';

        this.resetForm();

        window.setTimeout(() => {
          void this.router.navigate(['/']);
        }, 1500);
      },

      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage =
          error.error?.message ??
          'Registration failed.';
      },
    });
  }

  private loadSports(): void {
    this.http
      .get<ApiResponse<SportsResponseData>>(
        `${environment.apiUrl}/sports`,
      )
      .subscribe({
        next: (response) => {
          this.sports = response.data.sports;
          this.isLoadingSports = false;
        },

        error: () => {
          this.errorMessage =
            'Unable to load sports.';

          this.isLoadingSports = false;
        },
      });
  }

  private updateEmployeeValidators(
    role: 'athlete' | 'employee',
  ): void {
    const {
      companyName,
      headOfficeAddress,
      registrationNumber,
      pib,
    } = this.employeeDataGroup.controls;

    if (role === 'employee') {
      companyName.setValidators(
        Validators.required,
      );

      headOfficeAddress.setValidators(
        Validators.required,
      );

      registrationNumber.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/),
      ]);

      pib.setValidators([
        Validators.required,
        Validators.pattern(/^[1-9]\d{8}$/),
      ]);
    } else {
      companyName.clearValidators();
      headOfficeAddress.clearValidators();
      registrationNumber.clearValidators();
      pib.clearValidators();

      this.employeeDataGroup.reset({
        companyName: '',
        headOfficeAddress: '',
        registrationNumber: '',
        pib: '',
      });
    }

    companyName.updateValueAndValidity();
    headOfficeAddress.updateValueAndValidity();
    registrationNumber.updateValueAndValidity();
    pib.updateValueAndValidity();
  }

  private buildPayload(): RegisterRequest {
    const formValue =
      this.registerForm.getRawValue();

    const payload: RegisterRequest = {
      username: formValue.username.trim(),
      password: formValue.password,
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      phone: formValue.phone.trim(),
      email: formValue.email.trim().toLowerCase(),
      role: formValue.role,
      favoriteSports: formValue.favoriteSports,
    };

    if (formValue.role === 'employee') {
      payload.employeeData = {
        companyName:
          formValue.employeeData.companyName.trim(),

        headOfficeAddress:
          formValue.employeeData.headOfficeAddress.trim(),

        registrationNumber:
          formValue.employeeData.registrationNumber.trim(),

        pib:
          formValue.employeeData.pib.trim(),
      };
    }

    return payload;
  }

  private resetForm(): void {
    this.registerForm.reset({
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      role: 'athlete',
      favoriteSports: [],
      employeeData: {
        companyName: '',
        headOfficeAddress: '',
        registrationNumber: '',
        pib: '',
      },
    });

    this.updateEmployeeValidators('athlete');
  }
}
