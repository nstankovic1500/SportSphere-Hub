import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { EmployeeFacility } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-facilities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-facilities.component.html',
  styleUrl: './employee-facilities.component.css',
})
export class EmployeeFacilitiesComponent {
  private readonly employeeService = inject(EmployeeService);

  facilities: EmployeeFacility[] = [];
  isLoading = true;
  errorMessage = '';

  constructor() {
    this.loadFacilities();
  }

  getSportsLabel(facility: EmployeeFacility) {
    return facility.sports.map((sport) => sport.name).join(', ');
  }

  private loadFacilities() {
    this.employeeService.getFacilities().subscribe({
      next: (response) => {
        this.facilities = response.data.facilities;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati objekte zaposlenog.';
        this.isLoading = false;
      },
    });
  }
}
