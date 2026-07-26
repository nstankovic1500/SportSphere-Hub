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
  jsonErrorMessage = '';
  importedJsonFileName = '';
  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];

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
        : currentSports.filter((selectedSportId) => selectedSportId !== sportId),
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

  onJsonSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.jsonErrorMessage = '';
    this.successMessage = '';

    if (!file) {
      this.importedJsonFileName = '';
      return;
    }

    if (!(file.type === 'application/json' || file.name.toLowerCase().endsWith('.json'))) {
      this.importedJsonFileName = '';
      this.jsonErrorMessage = 'Dozvoljen je samo JSON fajl.';
      input.value = '';
      return;
    }

    void file.text().then((content) => {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        this.applyJsonData(parsed);
        this.importedJsonFileName = file.name;
      } catch (error) {
        this.importedJsonFileName = '';
        this.jsonErrorMessage =
          error instanceof Error ? error.message : 'JSON fajl nije ispravan.';
        input.value = '';
      }
    });
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
            this.errorMessage =
              error.error?.message ?? 'Objekat je kreiran, ali slike nisu uspešno otpremljene.';
          },
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće poslati zahtev za objekat.';
      },
    });
  }

  private loadSports() {
    this.publicService.getSports().subscribe({
      next: (sportsResponse) => {
        this.sports = sportsResponse.data.sports;

        if (this.openingHours.length === 0) {
          this.addOpeningHour();
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati sportove.';
        this.isLoading = false;
      },
    });
  }

  private createOpeningHourGroup(day = 1, open = '', close = '') {
    return this.formBuilder.nonNullable.group({
      day: [day, [Validators.required, Validators.min(0), Validators.max(6)]],
      open: [open, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      close: [close, [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
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
    this.successMessage = 'Zahtev za objekat je uspešno poslat.';

    window.setTimeout(() => {
      void this.router.navigate(['/employee/profile']);
    }, 1200);
  }

  private validateImageFiles(files: File[]) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (files.length > 5) {
      return 'Možete otpremiti najviše 5 slika odjednom.';
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

  private applyJsonData(data: Record<string, unknown>) {
    const sports = this.mapImportedSports(data['sports']);
    const openingHours = this.mapImportedOpeningHours(data['openingHours']);
    const coordinates = this.mapImportedCoordinates(data['location']);

    const importedValues = {
      name: this.toText(data['name']),
      city: this.toText(data['city']),
      country: this.toText(data['country']),
      address: this.toText(data['address']),
      description: this.toText(data['description']),
      longitude: coordinates.longitude ?? this.toNumber(data['longitude']),
      latitude: coordinates.latitude ?? this.toNumber(data['latitude']),
      hourlyPrice: this.toNumber(data['hourlyPrice']),
      allowedNoShows: this.toInteger(data['allowedNoShows']),
      sports,
      openingHours,
    };

    const missingFields = this.getMissingJsonFields(importedValues);

    if (missingFields.length > 0) {
      throw new Error(
        `JSON fajl nema sva obavezna polja ili nisu ispravna: ${missingFields.join(', ')}.`,
      );
    }

    this.facilityForm.patchValue({
      name: importedValues.name,
      city: importedValues.city,
      country: importedValues.country,
      address: importedValues.address,
      description: importedValues.description,
      longitude: importedValues.longitude,
      latitude: importedValues.latitude,
      hourlyPrice: importedValues.hourlyPrice,
      allowedNoShows: importedValues.allowedNoShows,
      sports: importedValues.sports,
    });

    this.facilityForm.setControl(
      'openingHours',
      this.formBuilder.array<FormGroup>(
        importedValues.openingHours.map((row) =>
          this.createOpeningHourGroup(row.day, row.open, row.close),
        ),
      ),
    );

    this.selectedSports.updateValueAndValidity();
    this.facilityForm.markAsUntouched();
    this.jsonErrorMessage = '';
    this.successMessage = 'JSON podaci su uspešno učitani u formu.';
  }

  private getMissingJsonFields(data: {
    name: string;
    city: string;
    country: string;
    address: string;
    description: string;
    longitude: number;
    latitude: number;
    hourlyPrice: number;
    allowedNoShows: number;
    sports: string[];
    openingHours: Array<{ day: number; open: string; close: string }>;
  }) {
    const missingFields: string[] = [];

    if (!data.name) {
      missingFields.push('name');
    }

    if (!data.city) {
      missingFields.push('city');
    }

    if (!data.country) {
      missingFields.push('country');
    }

    if (!data.address) {
      missingFields.push('address');
    }

    if (!data.description) {
      missingFields.push('description');
    }

    if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) {
      missingFields.push('longitude/location.coordinates[0]');
    }

    if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) {
      missingFields.push('latitude/location.coordinates[1]');
    }

    if (!Number.isFinite(data.hourlyPrice) || data.hourlyPrice < 0) {
      missingFields.push('hourlyPrice');
    }

    if (!Number.isInteger(data.allowedNoShows) || data.allowedNoShows < 0) {
      missingFields.push('allowedNoShows');
    }

    if (data.sports.length === 0) {
      missingFields.push('sports');
    }

    if (data.openingHours.length === 0) {
      missingFields.push('openingHours');
    }

    return missingFields;
  }

  private mapImportedSports(value: unknown) {
    if (!Array.isArray(value)) {
      return [] as string[];
    }

    const availableSports = new Map<string, string>();

    for (const sport of this.sports) {
      availableSports.set(sport.id, sport.id);
      availableSports.set(sport.name.trim().toLowerCase(), sport.id);
    }

    return [
      ...new Set(
        value
          .map((sport) => {
            if (typeof sport === 'string') {
              const trimmedSport = sport.trim();

              return (
                availableSports.get(trimmedSport) ??
                availableSports.get(trimmedSport.toLowerCase()) ??
                ''
              );
            }

            if (sport && typeof sport === 'object') {
              const record = sport as Record<string, unknown>;
              const candidateId = this.toText(record['id']);
              const candidateOid = this.toText(record['$oid']);
              const candidateName = this.toText(record['name']).toLowerCase();

              return (
                availableSports.get(candidateId) ??
                availableSports.get(candidateOid) ??
                availableSports.get(candidateName) ??
                ''
              );
            }

            return '';
          })
          .filter(Boolean),
      ),
    ];
  }

  private mapImportedOpeningHours(value: unknown) {
    if (!Array.isArray(value)) {
      return [] as Array<{ day: number; open: string; close: string }>;
    }

    return value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const row = item as Record<string, unknown>;
        const day = this.toInteger(row['day']);
        const open = this.toText(row['open']);
        const close = this.toText(row['close']);

        if (day < 0 || day > 6 || !open || !close) {
          return null;
        }

        return { day, open, close };
      })
      .filter((row): row is { day: number; open: string; close: string } => row !== null)
      .sort((first, second) => first.day - second.day);
  }

  private mapImportedCoordinates(value: unknown) {
    if (!value || typeof value !== 'object') {
      return {
        longitude: undefined as number | undefined,
        latitude: undefined as number | undefined,
      };
    }

    const location = value as Record<string, unknown>;
    const coordinates = Array.isArray(location['coordinates']) ? location['coordinates'] : [];

    return {
      longitude: this.toOptionalNumber(coordinates[0]),
      latitude: this.toOptionalNumber(coordinates[1]),
    };
  }

  private toText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private toInteger(value: unknown) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : 0;
  }

  private toOptionalNumber(value: unknown) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
