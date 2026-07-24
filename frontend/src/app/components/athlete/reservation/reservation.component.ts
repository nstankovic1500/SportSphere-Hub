import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  CalendarOptions,
  DateSelectArg,
  DatesSetArg,
  EventInput,
} from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import { forkJoin } from 'rxjs';

import type {
  AthleteReservationRequest,
  ResourceAvailability,
} from '../../../core/models/athlete.model';
import type {
  FacilityDetails,
  FacilityResource,
} from '../../../core/models/public.model';
import { AthleteService } from '../../../core/services/athlete.service';
import { PublicService } from '../../../core/services/public.service';

interface ReservationSelection {
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FullCalendarModule],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css',
})
export class ReservationComponent {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicService = inject(PublicService);
  private readonly athleteService = inject(AthleteService);

  reservationForm = this.fb.nonNullable.group({
    resourceId: ['', Validators.required],
  });

  facility: FacilityDetails | null = null;
  activeResources: FacilityResource[] = [];
  availabilityMap: { [date: string]: ResourceAvailability } = {};
  reservedEvents: EventInput[] = [];
  selectedSlot: ReservationSelection | null = null;
  calendarOptions: CalendarOptions = {};

  rangeStart = '';
  rangeEnd = '';
  lastLoadedRange = '';

  backendError = '';
  successMessage = '';
  isLoadingFacility = true;
  isLoadingAvailability = false;
  isSubmitting = false;

  constructor() {
    this.setCalendarOptions();
    this.loadFacilityData();

    this.resourceId.valueChanges.subscribe((resourceId) => {
      this.backendError = '';
      this.successMessage = '';
      this.selectedSlot = null;
      this.lastLoadedRange = '';
      this.clearSelectedSlot();

      if (!resourceId) {
        this.reservedEvents = [];
        this.availabilityMap = {};
        this.refreshCalendar();
        return;
      }

      this.loadAvailabilityForCurrentRange(true);
    });
  }

  get resourceId() {
    return this.reservationForm.controls.resourceId;
  }

  get hasResources() {
    return this.activeResources.length > 0;
  }

  get currentResourceIndex() {
    return this.activeResources.findIndex((resource) => resource.id === this.resourceId.value);
  }

  get currentResource() {
    if (this.currentResourceIndex < 0) {
      return null;
    }

    return this.activeResources[this.currentResourceIndex];
  }

  get hasPreviousResource() {
    return this.currentResourceIndex > 0;
  }

  get hasNextResource() {
    return this.currentResourceIndex >= 0
      && this.currentResourceIndex < this.activeResources.length - 1;
  }

  get canConfirmReservation() {
    return !!this.selectedSlot && !this.isSubmitting;
  }

  goToPreviousResource() {
    if (!this.hasPreviousResource) {
      return;
    }

    this.resourceId.setValue(this.activeResources[this.currentResourceIndex - 1].id);
  }

  goToNextResource() {
    if (!this.hasNextResource) {
      return;
    }

    this.resourceId.setValue(this.activeResources[this.currentResourceIndex + 1].id);
  }

  confirmReservation() {
    if (!this.selectedSlot || !this.currentResource) {
      this.backendError = 'Please select a valid reservation time.';
      return;
    }

    const body: AthleteReservationRequest = {
      resourceId: this.currentResource.id,
      startTime: this.makeIsoDateTime(this.selectedSlot.date, this.selectedSlot.startTime),
      endTime: this.makeIsoDateTime(this.selectedSlot.date, this.selectedSlot.endTime),
    };

    this.isSubmitting = true;
    this.backendError = '';
    this.successMessage = '';

    this.athleteService.createReservation(body).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Reservation created successfully.';
        this.clearSelection();
        this.loadAvailabilityForCurrentRange(true);

        window.setTimeout(() => {
          void this.router.navigate(['/athlete/profile']);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.backendError = error.error?.message ?? 'Unable to create reservation.';
      },
    });
  }

  clearSelection() {
    this.selectedSlot = null;
    this.clearSelectedSlot();
  }

  getResourceTypeLabel(type: string) {
    return type.replace('_', ' ');
  }

  private loadFacilityData() {
    const facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';

    this.publicService.getFacilityDetails(facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
        this.activeResources = response.data.facility.resources;
        this.isLoadingFacility = false;
        this.refreshCalendar();

        if (this.activeResources.length > 0) {
          this.resourceId.setValue(this.activeResources[0].id);
        }
      },
      error: (error) => {
        this.backendError = error.error?.message ?? 'Unable to load facility details.';
        this.isLoadingFacility = false;
      },
    });
  }

  private setCalendarOptions() {
    this.calendarOptions = {
      plugins: [timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek',
      },
      allDaySlot: false,
      selectable: true,
      selectMirror: true,
      unselectAuto: false,
      eventOverlap: false,
      editable: false,
      eventStartEditable: false,
      eventDurationEditable: false,
      slotDuration: '01:00:00',
      slotLabelInterval: '01:00:00',
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
      businessHours: [],
      validRange: {
        start: this.getToday(),
      },
      weekends: true,
      nowIndicator: true,
      events: [],
      selectOverlap: () => false,
      selectAllow: (info) => this.canSelectSlot(info, true),
      select: (info) => this.onCalendarSelect(info),
      datesSet: (info) => this.onCalendarDatesChange(info),
      height: 'auto',
      timeZone: 'UTC',
      firstDay: 1,
      dayHeaderFormat: {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    };
  }

  private onCalendarDatesChange(info: DatesSetArg) {
    this.rangeStart = this.formatDate(info.start);
    this.rangeEnd = this.formatDate(info.end);
    this.loadAvailabilityForCurrentRange();
  }

  private onCalendarSelect(info: DateSelectArg) {
    const valid = this.canSelectSlot(info, false);

    if (!valid) {
      this.clearSelectedSlot();
      return;
    }

    this.selectedSlot = {
      date: this.formatDate(info.start),
      startTime: this.formatTime(info.start),
      endTime: this.formatTime(info.end),
      durationHours: this.getDurationInHours(info.start, info.end),
    };

    this.successMessage = '';
  }

  private loadAvailabilityForCurrentRange(force = false) {
    if (!this.currentResource || !this.rangeStart || !this.rangeEnd) {
      this.reservedEvents = [];
      this.availabilityMap = {};
      this.refreshCalendar();
      return;
    }

    const loadKey = `${this.currentResource.id}|${this.rangeStart}|${this.rangeEnd}`;

    if (!force && this.lastLoadedRange === loadKey) {
      return;
    }

    const dates = this.getDateList(this.rangeStart, this.rangeEnd);

    if (dates.length === 0) {
      return;
    }

    this.isLoadingAvailability = true;
    this.backendError = '';

    const requests = dates.map((date) =>
      this.athleteService.getResourceAvailability(this.currentResource!.id, date),
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const newAvailabilityMap: { [date: string]: ResourceAvailability } = {};
        const newEvents: EventInput[] = [];

        for (const response of responses) {
          const availability = response.data.availability;
          newAvailabilityMap[availability.date] = availability;

          for (const interval of availability.occupiedIntervals) {
            newEvents.push({
              title: 'Reserved',
              start: interval.startTime,
              end: interval.endTime,
              editable: false,
              overlap: false,
              color: '#d64545',
              textColor: '#ffffff',
            });
          }
        }

        this.availabilityMap = newAvailabilityMap;
        this.reservedEvents = newEvents;
        this.lastLoadedRange = loadKey;
        this.isLoadingAvailability = false;
        this.selectedSlot = null;
        this.clearSelectedSlot();
        this.refreshCalendar();
      },
      error: (error) => {
        this.isLoadingAvailability = false;
        this.backendError = error.error?.message ?? 'Unable to load calendar availability.';
        this.availabilityMap = {};
        this.reservedEvents = [];
        this.lastLoadedRange = '';
        this.refreshCalendar();
      },
    });
  }

  private refreshCalendar() {
    const slotTimes = this.getCalendarTimes();
    const businessHours = this.getCalendarBusinessHours();
    const calendarApi = this.calendarComponent?.getApi();

    if (calendarApi) {
      calendarApi.setOption('slotMinTime', slotTimes.minTime);
      calendarApi.setOption('slotMaxTime', slotTimes.maxTime);
      calendarApi.setOption('businessHours', businessHours);
      calendarApi.removeAllEvents();

      if (this.reservedEvents.length > 0) {
        calendarApi.addEventSource(this.reservedEvents);
      }

      return;
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      slotMinTime: slotTimes.minTime,
      slotMaxTime: slotTimes.maxTime,
      businessHours,
      events: this.reservedEvents,
    };
  }

  private canSelectSlot(info: any, silent: boolean) {
    const start = info.start as Date;
    const end = info.end as Date;
    const date = this.formatDate(start);
    const availability = this.availabilityMap[date];

    if (!availability) {
      return this.showSelectionError('Availability is not loaded for the selected day.', silent);
    }

    if (this.formatDate(start) !== this.formatDate(end)) {
      return this.showSelectionError('Reservation must start and end on the same date.', silent);
    }

    if (!this.isWholeHour(start) || !this.isWholeHour(end)) {
      return this.showSelectionError('Reservation must start and end on full hours.', silent);
    }

    if (end <= start) {
      return this.showSelectionError('Reservation must last at least 1 hour.', silent);
    }

    if (this.getDurationInHours(start, end) < 1) {
      return this.showSelectionError('Reservation must last at least 1 hour.', silent);
    }

    if (start <= new Date()) {
      return this.showSelectionError('Reservation must be in the future.', silent);
    }

    const opening = this.makeDate(availability.date, availability.openingTime);
    const closing = this.makeDate(availability.date, availability.closingTime);

    if (start < opening || end > closing) {
      return this.showSelectionError('Reservation must stay inside facility opening hours.', silent);
    }

    if (this.overlapsReservedTime(availability, start, end)) {
      return this.showSelectionError('Reservation overlaps an occupied interval.', silent);
    }

    return true;
  }

  private showSelectionError(message: string, silent: boolean) {
    if (!silent) {
      this.backendError = message;
    }

    return false;
  }

  private overlapsReservedTime(availability: ResourceAvailability, start: Date, end: Date) {
    for (const interval of availability.occupiedIntervals) {
      const reservedStart = new Date(interval.startTime);
      const reservedEnd = new Date(interval.endTime);

      if (start < reservedEnd && end > reservedStart) {
        return true;
      }
    }

    return false;
  }

  private clearSelectedSlot() {
    const calendarApi = this.calendarComponent?.getApi();

    if (calendarApi) {
      calendarApi.unselect();
    }
  }

  private getDateList(startDate: string, endDate: string) {
    const list: string[] = [];
    const current = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    while (current < end) {
      list.push(this.formatDate(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return list;
  }

  private getCalendarTimes() {
    const availabilityList = Object.values(this.availabilityMap);
    let minTime = '06:00:00';
    let maxTime = '23:00:00';

    if (availabilityList.length === 0 && this.facility && this.facility.openingHours.length > 0) {
      minTime = `${this.facility.openingHours[0].open}:00`;
      maxTime = `${this.facility.openingHours[0].close}:00`;

      for (const openingHour of this.facility.openingHours) {
        const openTime = `${openingHour.open}:00`;
        const closeTime = `${openingHour.close}:00`;

        if (openTime < minTime) {
          minTime = openTime;
        }

        if (closeTime > maxTime) {
          maxTime = closeTime;
        }
      }
    }

    if (availabilityList.length > 0) {
      minTime = `${availabilityList[0].openingTime}:00`;
      maxTime = `${availabilityList[0].closingTime}:00`;

      for (const availability of availabilityList) {
        const openTime = `${availability.openingTime}:00`;
        const closeTime = `${availability.closingTime}:00`;

        if (openTime < minTime) {
          minTime = openTime;
        }

        if (closeTime > maxTime) {
          maxTime = closeTime;
        }
      }
    }

    return { minTime, maxTime };
  }

  private getCalendarBusinessHours() {
    const businessHours: Array<{
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
    }> = [];

    for (const date of Object.keys(this.availabilityMap)) {
      const availability = this.availabilityMap[date];
      const dayNumber = new Date(`${date}T00:00:00.000Z`).getUTCDay();

      businessHours.push({
        daysOfWeek: [dayNumber],
        startTime: availability.openingTime,
        endTime: availability.closingTime,
      });
    }

    return businessHours;
  }

  private makeIsoDateTime(date: string, time: string) {
    return `${date}T${time}:00.000Z`;
  }

  private makeDate(date: string, time: string) {
    return new Date(this.makeIsoDateTime(date, time));
  }

  private isWholeHour(date: Date) {
    return (
      date.getUTCMinutes() === 0
      && date.getUTCSeconds() === 0
      && date.getUTCMilliseconds() === 0
    );
  }

  private getDurationInHours(start: Date, end: Date) {
    return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private formatTime(date: Date) {
    return date.toISOString().slice(11, 16);
  }

  private getToday() {
    return this.formatDate(new Date());
  }
}
