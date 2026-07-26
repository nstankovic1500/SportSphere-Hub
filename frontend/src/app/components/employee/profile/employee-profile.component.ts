import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type {
  EmployeeFacility,
  EmployeeProfile,
  EmployeeResource,
} from '../../../core/models/employee.model';
import type { Sport } from '../../../core/models/sport.model';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { PublicService } from '../../../core/services/public.service';
import {
  avatarPreviewToPngFile,
  generateAvatarPreview,
} from '../../../core/utils/avatar.util';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

const phonePattern = /^[0-9+\-\s()]{6,20}$/;

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
    phone: ['', [Validators.required, Validators.pattern(phonePattern)]],
    email: ['', [Validators.required, Validators.email]],
    favoriteSports: this.formBuilder.nonNullable.control<string[]>([]),
    companyName: ['', Validators.required],
    headOfficeAddress: ['', Validators.required],
    registrationNumber: [{ value: '', disabled: true }, Validators.required],
    pib: [{ value: '', disabled: true }, Validators.required],
  });

  profile: EmployeeProfile | null = null;
  sports: Sport[] = [];
  facilities: EmployeeFacility[] = [];

  isLoading = true;
  isSaving = false;
  isUploadingImage = false;
  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  profileImagePreview = '';
  selectedProfileImageFile: File | null = null;
  isGeneratingAvatar = false;

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

  get profileImageUrl() {
    return this.profileImagePreview || buildUploadImageUrl(this.profile?.profileImage);
  }

  isSportSelected(sportId: string) {
    return this.favoriteSports.value.includes(sportId);
  }

  canSelectMoreSports(sportId: string) {
    return this.isSportSelected(sportId) || this.favoriteSports.value.length < 5;
  }

  getSportsLabel(facility: EmployeeFacility) {
    return facility.sports.map((sport) => sport.name).join(', ');
  }

  getOutdoorResources(facility: EmployeeFacility) {
    return (facility.resources ?? []).filter((resource) => resource.type === 'outdoor');
  }

  getIndoorResources(facility: EmployeeFacility) {
    return (facility.resources ?? []).filter((resource) => resource.type === 'indoor');
  }

  getTeamHallResources(facility: EmployeeFacility) {
    return (facility.resources ?? []).filter((resource) => resource.type === 'team_hall');
  }

  getResourceLabel(resource: EmployeeResource) {
    return `${resource.name} (${resource.capacity})`;
  }

  getResourceListLabel(resources: EmployeeResource[]) {
    return resources.map((resource) => this.getResourceLabel(resource)).join(', ');
  }

  hasAnyResources(facility: EmployeeFacility) {
    return (facility.resources ?? []).length > 0;
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
        this.successMessage = 'Profil je uspešno ažuriran.';
        this.authService.loadCurrentUser().subscribe();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće ažurirati profil zaposlenog.';
      },
    });
  }

  onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageErrorMessage = '';

    if (!file) {
      this.selectedProfileImageFile = null;
      this.profileImagePreview = '';
      return;
    }

    const validationError = this.validateImageFile(file);

    if (validationError) {
      input.value = '';
      this.selectedProfileImageFile = null;
      this.profileImagePreview = '';
      this.imageErrorMessage = validationError;
      return;
    }

    this.selectedProfileImageFile = file;
    this.profileImagePreview = URL.createObjectURL(file);
  }

  async generateAvatar() {
    this.isGeneratingAvatar = true;
    this.imageErrorMessage = '';
    this.successMessage = '';

    try {
      const seedBase = this.profile?.username
        || this.username.getRawValue()
        || `${this.firstName.value}-${this.lastName.value}`
        || `zaposleni-${Date.now()}`;
      const avatar = await generateAvatarPreview(`${seedBase}-${Date.now()}`);
      this.selectedProfileImageFile = await avatarPreviewToPngFile(
        avatar.previewUrl,
        `avatar-${Date.now()}.png`,
      );
      this.profileImagePreview = avatar.previewUrl;
    } catch (error) {
      this.imageErrorMessage =
        error instanceof Error ? error.message : 'Nije moguće generisati avatar.';
    } finally {
      this.isGeneratingAvatar = false;
    }
  }

  uploadProfileImage() {
    if (!this.selectedProfileImageFile || this.isUploadingImage) {
      return;
    }

    this.isUploadingImage = true;
    this.imageErrorMessage = '';
    this.successMessage = '';

    this.authService.uploadProfileImage(this.selectedProfileImageFile).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile = {
            ...this.profile,
            profileImage: response.data.imagePath,
          };
        }

        this.isUploadingImage = false;
        this.successMessage = 'Profilna slika je uspešno ažurirana.';
        this.selectedProfileImageFile = null;
        this.profileImagePreview = '';
        this.authService.loadCurrentUser().subscribe();
      },
      error: (error) => {
        this.isUploadingImage = false;
        this.imageErrorMessage = error.error?.message ?? 'Nije moguće otpremiti profilnu sliku.';
      },
    });
  }

  private loadPageData() {
    forkJoin({
      profileResponse: this.employeeService.getProfile(),
      sportsResponse: this.publicService.getSports(),
      facilitiesResponse: this.employeeService.getFacilities(),
    }).subscribe({
      next: ({ profileResponse, sportsResponse, facilitiesResponse }) => {
        this.profile = profileResponse.data.employee;
        this.sports = sportsResponse.data.sports;
        this.patchForm(profileResponse.data.employee);
        this.loadFacilityResources(facilitiesResponse.data.facilities);
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati profil zaposlenog.';
        this.isLoading = false;
      },
    });
  }

  private loadFacilityResources(facilities: EmployeeFacility[]) {
    if (facilities.length === 0) {
      this.facilities = [];
      this.isLoading = false;
      return;
    }

    forkJoin(
      facilities.map((facility) => this.employeeService.getResources(facility.id)),
    ).subscribe({
      next: (resourceResponses) => {
        this.facilities = facilities.map((facility, index) => ({
          ...facility,
          resources: resourceResponses[index].data.resources,
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.facilities = facilities;
        this.errorMessage =
          error.error?.message ?? 'Nije moguće učitati objekte zaposlenog.';
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

  private validateImageFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Dozvoljene su samo JPG, PNG i WEBP slike.';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Veličina slike ne sme biti veća od 5 MB.';
    }

    return '';
  }
}
