import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { HttpErrorResponse } from '@angular/common/http';

import type {
  EmployeeFacility,
  EmployeeMonthlyReportType,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-employee-facility-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
  isDownloadingReport = false;
  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  reportErrorMessage = '';
  reportSuccessMessage = '';
  selectedReportMonth = this.getCurrentMonthValue();
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
        this.successMessage = 'Slike objekta su uspešno otpremljene.';
      },
      error: (error) => {
        this.isUploadingImages = false;
        this.imageErrorMessage = error.error?.message ?? 'Nije moguće otpremiti slike objekta.';
      },
    });
  }

  deleteImage(imagePath: string) {
    if (!this.facility || !window.confirm('Obrisati ovu sliku objekta?') || this.isDeletingImage) {
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
        this.successMessage = 'Slika objekta je uspešno obrisana.';
      },
      error: (error) => {
        this.isDeletingImage = false;
        this.imageErrorMessage = error.error?.message ?? 'Nije moguće obrisati sliku objekta.';
      },
    });
  }

  downloadMonthlyReport(type: EmployeeMonthlyReportType) {
    if (!this.facility || !this.selectedReportMonth || this.isDownloadingReport) {
      return;
    }

    this.isDownloadingReport = true;
    this.reportErrorMessage = '';
    this.reportSuccessMessage = '';

    this.employeeService
      .downloadMonthlyReportPdf(this.facility.id, this.selectedReportMonth, type)
      .subscribe({
        next: (response) => {
          const fileBlob = response.body;

          if (!fileBlob) {
            this.isDownloadingReport = false;
            this.reportErrorMessage = 'PDF izveštaj nije dostupan.';
            return;
          }

          const objectUrl = URL.createObjectURL(fileBlob);
          const link = document.createElement('a');
          const reportLabel = type === 'occupancy' ? 'popunjenost' : 'promet-opreme';

          link.href = objectUrl;
          link.download = `${reportLabel}-${this.facility?.id}-${this.selectedReportMonth}.pdf`;
          link.click();
          URL.revokeObjectURL(objectUrl);

          this.isDownloadingReport = false;
          this.reportSuccessMessage =
            type === 'occupancy'
              ? 'PDF izveštaj o popunjenosti je uspešno generisan.'
              : 'PDF izveštaj o prometu opreme je uspešno generisan.';
        },
        error: async (error: HttpErrorResponse) => {
          this.isDownloadingReport = false;
          this.reportErrorMessage = await this.extractReportErrorMessage(error);
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
    return ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'][day] ?? String(day);
  }

  private getCurrentMonthValue() {
    return new Date().toISOString().slice(0, 7);
  }

  private async extractReportErrorMessage(error: HttpErrorResponse) {
    if (error.error instanceof Blob) {
      try {
        const text = await error.error.text();
        const parsed = JSON.parse(text) as { message?: string };
        return parsed.message ?? 'Nije moguće generisati mesečni PDF izveštaj.';
      } catch {
        return 'Nije moguće generisati mesečni PDF izveštaj.';
      }
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return 'Nije moguće generisati mesečni PDF izveštaj.';
  }

  private validateImageFiles(files: File[]) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const currentCount = this.facility?.images.length ?? 0;

    if (files.length > 5) {
      return 'Možete otpremiti najviše 5 slika odjednom.';
    }

    if (currentCount + files.length > 10) {
      return 'Objekat može sadržati najviše 10 slika ukupno.';
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return 'Dozvoljene su samo JPG, PNG i WEBP slike.';
      }

      if (file.size > 5 * 1024 * 1024) {
        return 'Svaka slika mora biti veličine do 5 MB.';
      }
    }

    return '';
  }
}
