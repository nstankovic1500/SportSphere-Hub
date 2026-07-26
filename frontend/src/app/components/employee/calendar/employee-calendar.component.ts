import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import type { CalendarOptions, DatesSetArg, EventDropArg, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

import type {
  EmployeeAttendanceType,
  EmployeeCalendarEvent,
  EmployeeFacility,
  EmployeeResource,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FullCalendarModule],
  templateUrl: './employee-calendar.component.html',
  styleUrl: './employee-calendar.component.css',
})
export class EmployeeCalendarComponent {
  @ViewChild('calendar') calendarComponent?: FullCalendarComponent;

  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    facilityId: ['', Validators.required],
    resourceId: ['', Validators.required],
    type: this.formBuilder.nonNullable.control<EmployeeAttendanceType>('all'),
  });

  facilities: EmployeeFacility[] = [];
  facility: EmployeeFacility | null = null;
  resources: EmployeeResource[] = [];
  selectedCalendarResourceName = '';
  selectedCalendarResourceSport = '';
  events: EmployeeCalendarEvent[] = [];
  calendarOptions: CalendarOptions = {};

  currentRangeStart = '';
  currentRangeEnd = '';
  isLoadingFacilities = true;
  isLoadingFacility = true;
  isLoadingResources = true;
  isLoadingCalendar = true;
  isMovingEvent = false;
  isChangingFacility = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.setCalendarOptions();
    this.loadFacilities();

    const initialFacilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
    if (initialFacilityId) {
      this.filterForm.controls.facilityId.setValue(initialFacilityId, { emitEvent: false });
      this.loadFacilityContext(initialFacilityId);
    } else {
      this.isLoadingFacility = false;
      this.isLoadingResources = false;
      this.isLoadingCalendar = false;
    }

    this.filterForm.controls.facilityId.valueChanges.subscribe((facilityId) => {
      if (!facilityId || facilityId === this.facility?.id || this.isChangingFacility) {
        return;
      }

      this.isChangingFacility = true;
      void this.router.navigate(['/employee/facilities', facilityId, 'calendar']).finally(() => {
        this.isChangingFacility = false;
      });

      this.resetCalendarState();
      this.loadFacilityContext(facilityId);
    });

    this.filterForm.controls.resourceId.valueChanges.subscribe(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.loadCalendar();
    });

    this.filterForm.controls.type.valueChanges.subscribe(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.loadCalendar();
    });
  }

  get selectedFacilityName() {
    return this.facility?.name ?? 'Facility';
  }

  private loadFacilities() {
    this.employeeService.getFacilities().subscribe({
      next: (response) => {
        this.facilities = response.data.facilities;
        this.isLoadingFacilities = false;

        if (!this.filterForm.controls.facilityId.value && this.facilities.length > 0) {
          this.filterForm.controls.facilityId.setValue(this.facilities[0].id);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati objekte zaposlenog.';
        this.isLoadingFacilities = false;
      },
    });
  }

  private loadFacilityContext(facilityId: string) {
    this.isLoadingFacility = true;
    this.isLoadingResources = true;
    this.isLoadingCalendar = true;
    this.errorMessage = '';

    this.employeeService.getFacility(facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
        this.isLoadingFacility = false;
      },
      error: (error) => {
        this.facility = null;
        this.resources = [];
        this.isLoadingFacility = false;
        this.isLoadingResources = false;
        this.isLoadingCalendar = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati detalje objekta.';
      },
    });

    this.employeeService.getResources(facilityId).subscribe({
      next: (response) => {
        this.resources = response.data.resources.filter((resource) => resource.active);
        this.isLoadingResources = false;

        const currentResourceId = this.filterForm.controls.resourceId.value;
        const validResource = this.resources.find((resource) => resource.id === currentResourceId);

        if (validResource) {
          this.filterForm.controls.resourceId.setValue(validResource.id);
          return;
        }

        this.filterForm.controls.resourceId.setValue(this.resources[0]?.id ?? '');

        if (this.resources.length === 0) {
          this.isLoadingCalendar = false;
          this.syncCalendarEvents([]);
        }
      },
      error: (error) => {
        this.resources = [];
        this.isLoadingResources = false;
        this.isLoadingCalendar = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati resurse objekta.';
        this.syncCalendarEvents([]);
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
      editable: true,
      eventStartEditable: true,
      eventDurationEditable: true,
      eventOverlap: false,
      slotDuration: '01:00:00',
      slotLabelInterval: '01:00:00',
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
      firstDay: 1,
      nowIndicator: true,
      timeZone: 'UTC',
      height: 'auto',
      events: [],
      datesSet: (info) => this.onDatesChange(info),
      eventDrop: (info) => this.onEventDrop(info),
    };
  }

  private onDatesChange(info: DatesSetArg) {
    this.currentRangeStart = info.start.toISOString();
    this.currentRangeEnd = info.end.toISOString();
    this.loadCalendar();
  }

  private loadCalendar() {
    const facilityId = this.filterForm.controls.facilityId.value;
    const resourceId = this.filterForm.controls.resourceId.value;

    if (!facilityId || !resourceId || !this.currentRangeStart || !this.currentRangeEnd) {
      return;
    }

    this.isLoadingCalendar = true;
    this.errorMessage = '';

    this.employeeService.getCalendar(facilityId, {
      resourceId,
      start: this.currentRangeStart,
      end: this.currentRangeEnd,
      type: this.filterForm.controls.type.value,
    }).subscribe({
      next: (response) => {
        this.events = response.data.events;
        this.selectedCalendarResourceName = response.data.resource.name;
        this.selectedCalendarResourceSport = response.data.resource.sportName;
        this.isLoadingCalendar = false;
        this.syncCalendarEvents(this.events.map((event) => this.toCalendarEvent(event)));
      },
      error: (error) => {
        this.events = [];
        this.selectedCalendarResourceName = '';
        this.selectedCalendarResourceSport = '';
        this.isLoadingCalendar = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati kalendar.';
        this.syncCalendarEvents([]);
      },
    });
  }

  private onEventDrop(info: EventDropArg) {
    const eventId = info.event.id;
    const itemType = String(info.event.extendedProps['itemType'] ?? '');
    const start = info.event.start;
    const end = info.event.end;

    if (!start || !end || this.isMovingEvent) {
      info.revert();
      return;
    }

    this.isMovingEvent = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    const request =
      itemType === 'training'
        ? this.employeeService.moveTrainingAppointment(eventId, payload)
        : this.employeeService.moveReservation(eventId, payload);

    request.subscribe({
      next: (response) => {
        this.isMovingEvent = false;
        const updatedEvent = response.data.event;
        this.events = this.events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event));
        this.syncCalendarEvents(this.events.map((event) => this.toCalendarEvent(event)));
        this.successMessage =
          updatedEvent.itemType === 'training'
            ? 'Trening je uspešno pomeren.'
            : 'Rezervacija je uspešno pomerena.';
      },
      error: (error) => {
        this.isMovingEvent = false;
        this.errorMessage = error.error?.message ?? 'Nije moguće pomeriti događaj u kalendaru.';
        info.revert();
      },
    });
  }

  private syncCalendarEvents(events: EventInput[]) {
    const calendarApi = this.calendarComponent?.getApi();

    if (calendarApi) {
      calendarApi.batchRendering(() => {
        calendarApi.removeAllEvents();

        for (const event of events) {
          calendarApi.addEvent(event);
        }
      });

      return;
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events,
    };
  }

  private toCalendarEvent(event: EmployeeCalendarEvent): EventInput {
    const labelParts = [event.athleteName];

    if (event.itemType === 'training' && event.trainerName) {
      labelParts.push(event.trainerName);
    }

    return {
      id: event.id,
      title: event.title || labelParts.join(' - '),
      start: event.start,
      end: event.end,
      editable: event.editable,
      startEditable: event.editable,
      durationEditable: event.editable,
      backgroundColor: event.itemType === 'training' ? '#2563eb' : '#0f766e',
      borderColor: event.itemType === 'training' ? '#2563eb' : '#0f766e',
      textColor: '#ffffff',
      extendedProps: {
        itemType: event.itemType,
        athleteName: event.athleteName,
        trainerName: event.trainerName,
        sportName: event.sportName,
        status: event.status,
      },
    };
  }

  private resetCalendarState() {
    this.resources = [];
    this.events = [];
    this.selectedCalendarResourceName = '';
    this.selectedCalendarResourceSport = '';
    this.filterForm.controls.resourceId.setValue('', { emitEvent: false });
    this.syncCalendarEvents([]);
  }
}
