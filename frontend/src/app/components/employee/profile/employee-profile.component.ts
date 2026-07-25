import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { EmployeeProfile } from '../../../core/models/employee.model';
import type { Sport } from '../../../core/models/sport.model';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { PublicService } from '../../../core/services/public.service';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './employee-profile.component.html',
  styleUrl: './employee-profile.component.css',
})
export class EmployeeProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly publicService = inject(PublicService);
  private readonly authService = inject(AuthService);

  readonly profileForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    favoriteSports: this.formBuilder.nonNullable.control<string[]>([]),
    companyName: ['', Validators.required],
    headOfficeAddress: ['', Validators.required],
    registrationNumber: [{ value: '', disabled: true }, Validators.required],
    pib: [{ value: '', disabled: true }, Validators.required],
  });

  profile: EmployeeProfile | null = null;
  sports: Sport[] = [];

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadPageData();
  }

  get username() {
    return this.profileForm.controls.username;
  }

  get firstName() {
    return this.profileForm.controls.firstName;
  }

  get lastName() {
    return this.profileForm.controls.lastName;
  }

  get phone() {
    return this.profileForm.controls.phone;
  }

  get email() {
    return this.profileForm.controls.email;
  }

  get favoriteSports() {
    return this.profileForm.controls.favoriteSports;
  }

  get companyName() {
    return this.profileForm.controls.companyName;
  }

  get headOfficeAddress() {
    return this.profileForm.controls.headOfficeAddress;
  }

  get registrationNumber() {
    return this.profileForm.controls.registrationNumber;
  }

  get pib() {
    return this.profileForm.controls.pib;
  }

  isSportSelected(sportId: string) {
    return this.favoriteSports.value.includes(sportId);
  }

  canSelectMoreSports(sportId: string) {
    return this.isSportSelected(sportId) || this.favoriteSports.value.length < 5;
  }

  onSportChange(sportId: string, checked: boolean) {
    const selectedSports = this.favoriteSports.value;

    if (checked) {
      if (selectedSports.length >= 5) {
        this.favoriteSports.markAsTouched();
        this.favoriteSports.setErrors({ maxSelectedSports: true });
        return;
      }

      this.favoriteSports.setValue([...selectedSports, sportId]);
      this.favoriteSports.updateValueAndValidity();
      return;
    }

    this.favoriteSports.setValue(
      selectedSports.filter((selectedSportId) => !(selectedSportId === sportId)),
    );
    this.favoriteSports.updateValueAndValidity();
  }

  saveProfile() {
    if (this.profileForm.invalid || this.favoriteSports.value.length > 5 || this.isSaving) {
      this.profileForm.markAllAsTouched();
      if (this.favoriteSports.value.length > 5) {
        this.favoriteSports.setErrors({ maxSelectedSports: true });
      }
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.employeeService.updateProfile({
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      phone: this.phone.value.trim(),
      email: this.email.value.trim(),
      favoriteSports: this.favoriteSports.value,
      employeeData: {
        companyName: this.companyName.value.trim(),
        headOfficeAddress: this.headOfficeAddress.value.trim(),
      },
    }).subscribe({
      next: (response) => {
        this.profile = response.data.employee;
        this.patchForm(response.data.employee);
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully.';
        this.authService.loadCurrentUser().subscribe();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message ?? 'Unable to update employee profile.';
      },
    });
  }

  private loadPageData() {
    forkJoin({
      profileResponse: this.employeeService.getProfile(),
      sportsResponse: this.publicService.getSports(),
    }).subscribe({
      next: ({ profileResponse, sportsResponse }) => {
        this.profile = profileResponse.data.employee;
        this.sports = sportsResponse.data.sports;
        this.patchForm(profileResponse.data.employee);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load employee profile.';
        this.isLoading = false;
      },
    });
  }

  private patchForm(profile: EmployeeProfile) {
    this.profileForm.reset({
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      email: profile.email,
      favoriteSports: profile.favoriteSports.map((sport) => sport.id),
      companyName: profile.employeeData.companyName,
      headOfficeAddress: profile.employeeData.headOfficeAddress,
      registrationNumber: profile.employeeData.registrationNumber,
      pib: profile.employeeData.pib,
    });
  }
}
