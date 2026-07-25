import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { EmployeeFacility } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

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
  errorMessage = '';

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

  private loadFacility() {
    const facilityId = this.route.snapshot.paramMap.get('facilityId') ?? '';

    this.employeeService.getFacility(facilityId).subscribe({
      next: (response) => {
        this.facility = response.data.facility;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load facility details.';
        this.isLoading = false;
      },
    });
  }

  private getDayLabel(day: number) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] ?? String(day);
  }
}
