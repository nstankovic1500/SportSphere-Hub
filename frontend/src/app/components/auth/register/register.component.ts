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
import type { Sport } from '../../../core/models/sport.model';
import { AuthService } from '../../../core/services/auth.service';
import {
  avatarPreviewToPngFile,
  generateAvatarPreview,
} from '../../../core/utils/avatar.util';

const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].{7,11}$/;
const phonePattern = /^[0-9+\-\s()]{6,20}$/;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

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
      phone: ['', [Validators.required, Validators.pattern(phonePattern)]],
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
  isGeneratingAvatar = false;

  errorMessage = '';
  successMessage = '';
  profileImageError = '';
  profileImagePreview = '';
  selectedProfileImageFile: File | null = null;

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

  get previewImageUrl(): string {
    return this.profileImagePreview || 'assets/images/default-avatar.png';
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
        (selectedId) => !(selectedId === sportId),
      ),
    );
    this.favoriteSports.updateValueAndValidity();
  }

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.profileImageError = '';

    if (!file) {
      this.selectedProfileImageFile = null;
      this.profileImagePreview = '';
      return;
    }

    const errorMessage = this.validateImageFile(file);

    if (errorMessage) {
      this.selectedProfileImageFile = null;
      this.profileImagePreview = '';
      this.profileImageError = errorMessage;
      input.value = '';
      return;
    }

    this.selectedProfileImageFile = file;
    this.profileImagePreview = URL.createObjectURL(file);
  }

  async generateAvatar(): Promise<void> {
    if (this.isGeneratingAvatar) {
      return;
    }

    this.isGeneratingAvatar = true;
    this.profileImageError = '';

    try {
      const seedBase =
        this.username.value.trim() ||
        this.email.value.trim() ||
        `${this.firstName.value.trim()}-${this.lastName.value.trim()}` ||
        'sportsphere';

      const avatar = await generateAvatarPreview(`${seedBase}-${Date.now()}`);
      this.selectedProfileImageFile = await avatarPreviewToPngFile(
        avatar.previewUrl,
        `avatar-${Date.now()}.png`,
      );
      this.profileImagePreview = avatar.previewUrl;
    } catch {
      this.profileImageError = 'Nije moguće generisati avatar.';
    } finally {
      this.isGeneratingAvatar = false;
    }
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
          'Zahtev za registraciju je poslat. Sačekajte odobrenje administratora.';

        this.resetForm();

        window.setTimeout(() => {
          void this.router.navigate(['/']);
        }, 1500);
      },

      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ??
          'Registracija nije uspela.';
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
            'Nije moguće učitati sportove.';

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

  private validateImageFile(file: File): string {
    if (!allowedImageTypes.includes(file.type)) {
      return 'Dozvoljeni su samo JPG, PNG i WEBP formati.';
    }

    if (file.size > maxImageSize) {
      return 'Veličina slike ne sme biti veća od 5 MB.';
    }

    return '';
  }

  private buildPayload(): FormData {
    const formValue =
      this.registerForm.getRawValue();

    const formData = new FormData();
    formData.append('username', formValue.username.trim());
    formData.append('password', formValue.password);
    formData.append('firstName', formValue.firstName.trim());
    formData.append('lastName', formValue.lastName.trim());
    formData.append('phone', formValue.phone.trim());
    formData.append('email', formValue.email.trim().toLowerCase());
    formData.append('role', formValue.role);
    formData.append('favoriteSports', JSON.stringify(formValue.favoriteSports));

    if (formValue.role === 'employee') {
      formData.append(
        'employeeData',
        JSON.stringify({
          companyName:
            formValue.employeeData.companyName.trim(),
          headOfficeAddress:
            formValue.employeeData.headOfficeAddress.trim(),
          registrationNumber:
            formValue.employeeData.registrationNumber.trim(),
          pib:
            formValue.employeeData.pib.trim(),
        }),
      );
    }

    if (this.selectedProfileImageFile) {
      formData.append('profileImage', this.selectedProfileImageFile);
    }

    return formData;
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
    this.profileImageError = '';
    this.profileImagePreview = '';
    this.selectedProfileImageFile = null;
  }
}
