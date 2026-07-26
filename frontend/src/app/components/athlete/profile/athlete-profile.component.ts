import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { AthleteProfile, AthleteReservation } from '../../../core/models/athlete.model';
import type { Sport } from '../../../core/models/sport.model';
import { AuthService } from '../../../core/services/auth.service';
import { AthleteService } from '../../../core/services/athlete.service';
import { PublicService } from '../../../core/services/public.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-athlete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './athlete-profile.component.html',
  styleUrl: './athlete-profile.component.css',
})
export class AthleteProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly athleteService = inject(AthleteService);
  private readonly publicService = inject(PublicService);
  private readonly authService = inject(AuthService);

  readonly profileForm = this.formBuilder.nonNullable.group({
    username: [{ value: '', disabled: true }, Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    favoriteSports: this.formBuilder.nonNullable.control<string[]>([]),
  });

  profile: AthleteProfile | null = null;
  reservations: AthleteReservation[] = [];
  sports: Sport[] = [];

  isLoading = true;
  isSaving = false;
  isUploadingImage = false;
  isCancellingIds = new Set<string>();
  errorMessage = '';
  successMessage = '';
  reservationsErrorMessage = '';
  imageErrorMessage = '';
  profileImagePreview = '';
  selectedProfileImageFile: File | null = null;

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

  isSportSelected(sportId: string) {
    return this.favoriteSports.value.includes(sportId);
  }

  canSelectMoreSports(sportId: string) {
    return this.isSportSelected(sportId) || this.favoriteSports.value.length < 5;
  }

  get profileImageUrl() {
    return this.profileImagePreview || buildUploadImageUrl(this.profile?.profileImage);
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

    this.athleteService
      .updateProfile({
        firstName: this.firstName.value.trim(),
        lastName: this.lastName.value.trim(),
        phone: this.phone.value.trim(),
        email: this.email.value.trim(),
        favoriteSports: this.favoriteSports.value,
      })
      .subscribe({
        next: (response) => {
          this.profile = response.data.athlete;
          this.patchForm(response.data.athlete);
          this.isSaving = false;
          this.successMessage = 'Profile updated successfully.';
          this.authService.loadCurrentUser().subscribe();
        },
        error: (error) => {
          this.isSaving = false;
          this.errorMessage = error.error?.message ?? 'Unable to update profile.';
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

  uploadProfileImage() {
    if (!this.selectedProfileImageFile || this.isUploadingImage) {
      return;
    }

    this.isUploadingImage = true;
    this.imageErrorMessage = '';
    this.successMessage = '';

    this.athleteService.uploadProfileImage(this.selectedProfileImageFile).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile = {
            ...this.profile,
            profileImage: response.data.imagePath,
          };
        }

        this.isUploadingImage = false;
        this.successMessage = 'Profile image updated successfully.';
        this.selectedProfileImageFile = null;
        this.profileImagePreview = '';
        this.authService.loadCurrentUser().subscribe();
      },
      error: (error) => {
        this.isUploadingImage = false;
        this.imageErrorMessage = error.error?.message ?? 'Unable to upload profile image.';
      },
    });
  }

  isCancelling(reservationId: string) {
    return this.isCancellingIds.has(reservationId);
  }

  cancelReservation(reservation: AthleteReservation) {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    this.reservationsErrorMessage = '';
    this.successMessage = '';
    this.isCancellingIds.add(reservation.id);

    this.athleteService.cancelReservation(reservation.id).subscribe({
      next: (response) => {
        this.reservations = this.reservations.map((currentReservation) =>
          currentReservation.id === reservation.id
            ? response.data.reservation
            : currentReservation,
        );
        this.isCancellingIds.delete(reservation.id);
        this.successMessage = 'Reservation cancelled successfully.';
      },
      error: (error) => {
        this.isCancellingIds.delete(reservation.id);
        this.reservationsErrorMessage =
          error.error?.message ?? 'Unable to cancel reservation.';
      },
    });
  }

  private loadPageData() {
    forkJoin({
      profileResponse: this.athleteService.getProfile(),
      reservationsResponse: this.athleteService.getReservations(),
      sportsResponse: this.publicService.getSports(),
    }).subscribe({
      next: ({ profileResponse, reservationsResponse, sportsResponse }) => {
        this.profile = profileResponse.data.athlete;
        this.reservations = reservationsResponse.data.reservations;
        this.sports = sportsResponse.data.sports;
        this.patchForm(profileResponse.data.athlete);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load athlete profile.';
        this.isLoading = false;
      },
    });
  }

  private patchForm(profile: AthleteProfile) {
    this.profileForm.reset({
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      email: profile.email,
      favoriteSports: profile.favoriteSports.map((sport) => sport.id),
    });
  }

  private validateImageFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG and WEBP images are allowed.';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must not exceed 5 MB.';
    }

    return '';
  }
}
