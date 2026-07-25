import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type {
  EmployeeAttendanceItem,
  EmployeeAttendanceType,
  EmployeeFacility,
} from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './employee-attendance.component.html',
  styleUrl: './employee-attendance.component.css',
})
export class EmployeeAttendanceComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  readonly facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';
  readonly filterForm = this.formBuilder.nonNullable.group({
    date: [''],
    type: this.formBuilder.nonNullable.control<EmployeeAttendanceType>('all'),
  });

  facility: EmployeeFacility | null = null;
  items: EmployeeAttendanceItem[] = [];
  processingIds = new Set<string>();

  isLoadingFacility = true;
  isLoadingAttendance = true;
  errorMessage = '';
  successMessage = '';
  blockingMessage = '';

  constructor() {
    this.loadFacility();
    this.loadAttendance();

    this.filterForm.valueChanges.subscribe(() => {
      this.loadAttendance();
    });
  }

  get selectedFacilityName() {
    return this.facility?.name ?? 'Facility';
  }

  get displayTypeLabel() {
    return this.filterForm.controls.type.value;
  }

  isProcessing(itemId: string) {
    return this.processingIds.has(itemId);
  }

  getActorName(item: EmployeeAttendanceItem) {
    return item.type === 'reservation'
      ? item.resourceName ?? '-'
      : item.trainerName ?? '-';
  }

  getTypeLabel(item: EmployeeAttendanceItem) {
    return item.type === 'reservation' ? 'Reservation' : 'Training';
  }

  markAttended(item: EmployeeAttendanceItem) {
    if (item.type !== 'reservation' || !item.canRecordAttendance || this.isProcessing(item.id)) {
      return;
    }

    this.runAction(item.id, this.employeeService.markReservationAttended(item.id));
  }

  markReservationNoShow(item: EmployeeAttendanceItem) {
    if (item.type !== 'reservation' || !item.canRecordAttendance || this.isProcessing(item.id)) {
      return;
    }

    if (!window.confirm(`Mark ${item.athleteName} as no-show for this reservation?`)) {
      return;
    }

    this.runAction(item.id, this.employeeService.markReservationNoShow(item.id));
  }

  markCompleted(item: EmployeeAttendanceItem) {
    if (item.type !== 'training' || !item.canRecordAttendance || this.isProcessing(item.id)) {
      return;
    }

    this.runAction(item.id, this.employeeService.markTrainingCompleted(item.id));
  }

  markTrainingNoShow(item: EmployeeAttendanceItem) {
    if (item.type !== 'training' || !item.canRecordAttendance || this.isProcessing(item.id)) {
      return;
    }

    if (!window.confirm(`Mark ${item.athleteName} as no-show for this training?`)) {
      return;
    }

    this.runAction(item.id, this.employeeService.markTrainingNoShow(item.id));
  }

  private loadFacility() {
    this.employeeService.getFacility(this.facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
        this.isLoadingFacility = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load facility details.';
        this.isLoadingFacility = false;
      },
    });
  }

  private loadAttendance() {
    this.isLoadingAttendance = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.blockingMessage = '';

    const formValue = this.filterForm.getRawValue();

    this.employeeService.getAttendance(this.facilityId, {
      date: formValue.date || undefined,
      type: formValue.type,
    }).subscribe({
      next: (response) => {
        this.items = response.data.items;
        this.isLoadingAttendance = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load attendance items.';
        this.items = [];
        this.isLoadingAttendance = false;
      },
    });
  }

  private runAction(
    itemId: string,
    request: ReturnType<
      | EmployeeService['markReservationAttended']
      | EmployeeService['markReservationNoShow']
      | EmployeeService['markTrainingCompleted']
      | EmployeeService['markTrainingNoShow']
    >,
  ) {
    this.processingIds.add(itemId);
    this.errorMessage = '';
    this.successMessage = '';
    this.blockingMessage = '';

    request.subscribe({
      next: (response) => {
        this.items = this.items.map((item) =>
          item.id === itemId ? response.data.item : item,
        );

        this.processingIds.delete(itemId);
        this.successMessage = 'Attendance updated successfully.';

        if (response.data.athleteBlockedInFacility) {
          this.blockingMessage = `Athlete reached ${response.data.totalNoShows} no-shows out of ${response.data.allowedNoShows} allowed and is now blocked in this facility.`;
        }
      },
      error: (error) => {
        this.processingIds.delete(itemId);
        this.errorMessage = error.error?.message ?? 'Unable to update attendance.';
      },
    });
  }
}
