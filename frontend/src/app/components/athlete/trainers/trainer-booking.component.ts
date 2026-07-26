import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { TrainerAvailability, TrainerDetails } from '../../../core/models/trainer.model';
import { AuthService } from '../../../core/services/auth.service';
import { TrainerService } from '../../../core/services/trainer.service';

interface BookingSlot {
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-trainer-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trainer-booking.component.html',
  styleUrl: './trainer-booking.component.css',
})
export class TrainerBookingComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly trainerService = inject(TrainerService);

  readonly trainerId = this.route.snapshot.paramMap.get('trainerId') ?? '';
  readonly bookingForm = this.formBuilder.nonNullable.group({
    sportId: [''],
    resourceId: ['', Validators.required],
    date: ['', Validators.required],
  });

  trainer: TrainerDetails | null = null;
  availability: TrainerAvailability | null = null;
  availableSlots: BookingSlot[] = [];
  selectedSlots: BookingSlot[] = [];

  isLoadingTrainer = true;
  isLoadingAvailability = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.loadTrainer();
  }

  get date() {
    return this.bookingForm.controls.date;
  }

  get resourceId() {
    return this.bookingForm.controls.resourceId;
  }

  get sportId() {
    return this.bookingForm.controls.sportId;
  }

  get requiresSportSelection() {
    return (this.trainer?.sports.length ?? 0) > 1;
  }

  get canSubmit() {
    return !!this.trainer
      && !!this.availability
      && this.selectedSlots.length > 0
      && !this.isSubmitting
      && !this.isLoadingAvailability
      && !!this.resourceId.value
      && (!this.requiresSportSelection || !!this.sportId.value);
  }

  get selectedStartTime() {
    return this.selectedSlots.length > 0 ? this.selectedSlots[0].startTime : '';
  }

  get selectedEndTime() {
    return this.selectedSlots.length > 0
      ? this.selectedSlots[this.selectedSlots.length - 1].endTime
      : '';
  }

  get selectedDurationHours() {
    return this.selectedSlots.length;
  }

  get sportsLabel() {
    return this.trainer?.sports.map((sport) => sport.name).join(', ') ?? '';
  }

  get isBlockedInTrainerFacility() {
    return !!this.trainer
      && (this.authService.getCurrentUser()?.blockedFacilities ?? []).includes(this.trainer.facility.id);
  }

  get availableResources() {
    const resources = this.trainer?.resources ?? [];

    if (!this.sportId.value) {
      return resources;
    }

    return resources.filter((resource) => resource.sport.id === this.sportId.value);
  }

  loadAvailability() {
    if (!this.date.value || !this.resourceId.value) {
      this.date.markAsTouched();
      this.resourceId.markAsTouched();
      return;
    }

    this.isLoadingAvailability = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedSlots = [];
    this.availableSlots = [];

    this.trainerService.getTrainerAvailability(
      this.trainerId,
      this.date.value,
      this.resourceId.value,
    ).subscribe({
      next: (response) => {
        this.availability = response.data.availability;
        this.availableSlots = this.buildAvailableSlots(this.availability);
        this.isLoadingAvailability = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load trainer availability.';
        this.availability = null;
        this.availableSlots = [];
        this.selectedSlots = [];
        this.isLoadingAvailability = false;
      },
    });
  }

  toggleSlot(slot: BookingSlot) {
    this.successMessage = '';

    const existingIndex = this.selectedSlots.findIndex(
      (selectedSlot) => selectedSlot.startTime === slot.startTime,
    );

    if (existingIndex >= 0) {
      this.selectedSlots = this.selectedSlots.filter(
        (selectedSlot) => selectedSlot.startTime !== slot.startTime,
      );
      return;
    }

    const nextSelection = [...this.selectedSlots, slot]
      .sort((first, second) => first.startTime.localeCompare(second.startTime));

    if (!this.isContinuous(nextSelection)) {
      this.errorMessage = 'Selected slots must form one continuous training appointment.';
      return;
    }

    this.errorMessage = '';
    this.selectedSlots = nextSelection;
  }

  isSlotSelected(slot: BookingSlot) {
    return this.selectedSlots.some((selectedSlot) => selectedSlot.startTime === slot.startTime);
  }

  submit() {
    if (!this.canSubmit || !this.availability || !this.trainer) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.trainerService.createTrainingAppointment({
      trainerId: this.trainer.id,
      sportId: this.trainer.sports.length > 1 ? this.sportId.value : this.trainer.sports[0]?.id,
      resourceId: this.resourceId.value,
      startTime: this.makeLocalDateTimeIso(this.availability.date, this.selectedStartTime),
      endTime: this.makeLocalDateTimeIso(this.availability.date, this.selectedEndTime),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Training appointment created successfully.';
        this.selectedSlots = [];
        this.loadAvailability();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message ?? 'Unable to create training appointment.';
      },
    });
  }

  trackBySlot(_: number, slot: BookingSlot) {
    return slot.startTime;
  }

  private loadTrainer() {
    this.trainerService.getTrainer(this.trainerId).subscribe({
      next: (response) => {
        this.trainer = response.data.trainer;

        if (this.isBlockedInTrainerFacility) {
          this.errorMessage =
            'You are blocked in this facility and cannot create new reservations or training appointments.';
          this.isLoadingTrainer = false;

          window.setTimeout(() => {
            void this.router.navigate(['/athlete/trainers']);
          }, 1200);

          return;
        }

        this.isLoadingTrainer = false;

        if (this.trainer.sports.length === 1) {
          this.sportId.setValue(this.trainer.sports[0].id);
        }

        if (this.trainer.resources.length > 0) {
          const initialResource = this.trainer.resources.find(
            (resource) => !this.sportId.value || resource.sport.id === this.sportId.value,
          );

          if (initialResource) {
            this.resourceId.setValue(initialResource.id);
          }
        }

        this.date.valueChanges.subscribe(() => {
          this.availability = null;
          this.availableSlots = [];
          this.selectedSlots = [];
          this.errorMessage = '';
          this.successMessage = '';
        });

        this.sportId.valueChanges.subscribe((sportId) => {
          const validResources = (this.trainer?.resources ?? []).filter(
            (resource) => !sportId || resource.sport.id === sportId,
          );

          if (!validResources.some((resource) => resource.id === this.resourceId.value)) {
            this.resourceId.setValue(validResources[0]?.id ?? '');
          }

          this.availability = null;
          this.availableSlots = [];
          this.selectedSlots = [];
          this.errorMessage = '';
          this.successMessage = '';
        });

        this.resourceId.valueChanges.subscribe(() => {
          this.availability = null;
          this.availableSlots = [];
          this.selectedSlots = [];
          this.errorMessage = '';
          this.successMessage = '';
        });
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load trainer details.';
        this.isLoadingTrainer = false;
      },
    });
  }

  private buildAvailableSlots(availability: TrainerAvailability) {
    const slots: BookingSlot[] = [];
    const openingHour = Number(availability.openingTime.slice(0, 2));
    const closingHour = Number(availability.closingTime.slice(0, 2));

    for (let hour = openingHour; hour < closingHour; hour += 1) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
      const slotStart = new Date(this.makeLocalDateTimeIso(availability.date, startTime));
      const slotEnd = new Date(this.makeLocalDateTimeIso(availability.date, endTime));
      const overlapsOccupiedInterval = availability.occupiedIntervals.some((interval) => {
        const occupiedStart = new Date(interval.startTime);
        const occupiedEnd = new Date(interval.endTime);

        return slotStart < occupiedEnd && slotEnd > occupiedStart;
      });

      if (!overlapsOccupiedInterval) {
        slots.push({ startTime, endTime });
      }
    }

    return slots;
  }

  private isContinuous(slots: BookingSlot[]) {
    for (let index = 1; index < slots.length; index += 1) {
      if (!(slots[index - 1].endTime === slots[index].startTime)) {
        return false;
      }
    }

    return true;
  }

  private makeIsoDateTime(date: string, time: string) {
    return `${date}T${time}:00.000Z`;
  }

  private makeLocalDateTimeIso(date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
  }
}
