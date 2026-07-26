import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeeFacility } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-employee-facility-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-facility-details.component.html',
  styleUrl: './employee-facility-details.component.css',
})
export class EmployeeFacilityDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  facility: EmployeeFacility | null = null;
  isLoading = true;
  isUploadingImages = false;
  isDeletingImage = false;
  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor() {
    this.loadFacility();
  }

  getSportsLabel() {
    return this.facility?.sports.map((sport) => sport.name).join(', ') ?? '';
  }

  getOpeningHoursLabel() {
    return (this.facility?.openingHours ?? [])
      .map((openingHour) => `${this.getDayLabel(openingHour.day)} ${openingHour.open} - ${openingHour.close}`)
      .join(', ');
  }

  getImageUrl(imagePath: string) {
    return buildUploadImageUrl(imagePath);
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

  uploadImages() {
    if (!this.facility || this.selectedImageFiles.length === 0 || this.isUploadingImages) {
      return;
    }

    this.isUploadingImages = true;
    this.imageErrorMessage = '';
    this.successMessage = '';

    this.employeeService.uploadFacilityImages(this.facility.id, this.selectedImageFiles).subscribe({
      next: (response) => {
        if (this.facility) {
          this.facility = {
            ...this.facility,
            images: [...this.facility.images, ...response.data.imagePaths],
          };
        }

        this.isUploadingImages = false;
        this.selectedImageFiles = [];
        this.imagePreviews = [];
        this.successMessage = 'Facility images uploaded successfully.';
      },
      error: (error) => {
        this.isUploadingImages = false;
        this.imageErrorMessage = error.error?.message ?? 'Unable to upload facility images.';
      },
    });
  }

  deleteImage(imagePath: string) {
    if (!this.facility || !window.confirm('Delete this facility image?') || this.isDeletingImage) {
      return;
    }

    this.isDeletingImage = true;
    this.imageErrorMessage = '';
    this.successMessage = '';

    this.employeeService.deleteFacilityImage(this.facility.id, imagePath).subscribe({
      next: () => {
        if (this.facility) {
          this.facility = {
            ...this.facility,
            images: this.facility.images.filter((currentImagePath) => currentImagePath !== imagePath),
          };
        }

        this.isDeletingImage = false;
        this.successMessage = 'Facility image deleted successfully.';
      },
      error: (error) => {
        this.isDeletingImage = false;
        this.imageErrorMessage = error.error?.message ?? 'Unable to delete facility image.';
      },
    });
  }

  private loadFacility() {
    const facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';

    this.employeeService.getFacility(facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati detalje objekta.';
        this.isLoading = false;
      },
    });
  }

  private getDayLabel(day: number) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] ?? String(day);
  }

  private validateImageFiles(files: File[]) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const currentCount = this.facility?.images.length ?? 0;

    if (files.length > 5) {
      return 'You can upload at most 5 images at once.';
    }

    if (currentCount + files.length > 10) {
      return 'A facility can contain at most 10 images in total.';
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
