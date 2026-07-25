import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { TrainerAvailability, TrainerDetails } from '../../../core/models/trainer.model';
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
  private readonly trainerService = inject(TrainerService);

  readonly trainerId = this.route.snapshot.paramMap.get('trainerId') ?? '';
  readonly bookingForm = this.formBuilder.nonNullable.group({
    sportId: [''],
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

  loadAvailability() {
    if (!this.date.value) {
      this.date.markAsTouched();
      return;
    }

    this.isLoadingAvailability = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedSlots = [];
    this.availableSlots = [];

    this.trainerService.getTrainerAvailability(this.trainerId, this.date.value).subscribe({
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
      startTime: this.makeIsoDateTime(this.availability.date, this.selectedStartTime),
      endTime: this.makeIsoDateTime(this.availability.date, this.selectedEndTime),
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
        this.isLoadingTrainer = false;

        if (this.trainer.sports.length === 1) {
          this.sportId.setValue(this.trainer.sports[0].id);
        }

        this.date.valueChanges.subscribe(() => {
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
      const slotStart = new Date(this.makeIsoDateTime(availability.date, startTime));
      const slotEnd = new Date(this.makeIsoDateTime(availability.date, endTime));
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
}
