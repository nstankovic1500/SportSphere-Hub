import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { FacilityRequest } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-facility-requests',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './facility-requests.component.html',
  styleUrl: './facility-requests.component.css',
})
export class FacilityRequestsComponent {
  private readonly adminService = inject(AdminService);
  private readonly dayLabels: { [key: number]: string } = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  };

  requests: FacilityRequest[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingIds = new Set<string>();

  constructor() {
    this.loadRequests();
  }

  approve(request: FacilityRequest) {
    if (!window.confirm(`Approve facility request for ${request.name}?`)) {
      return;
    }

    this.processRequest(request, 'approve');
  }

  reject(request: FacilityRequest) {
    if (!window.confirm(`Reject facility request for ${request.name}?`)) {
      return;
    }

    this.processRequest(request, 'reject');
  }

  isProcessing(requestId: string) {
    return this.processingIds.has(requestId);
  }

  getSportsLabel(request: FacilityRequest) {
    return (request.sports ?? []).map((sport) => sport.name).join(', ');
  }

  getEmployeesLabel(request: FacilityRequest) {
    return (request.employees ?? [])
      .map((employee) => `${employee.firstName} ${employee.lastName}`.trim())
      .join(', ');
  }

  getCompaniesLabel(request: FacilityRequest) {
    return (request.employees ?? []).map((employee) => employee.companyName).join(', ');
  }

  getOpeningHoursLabel(request: FacilityRequest) {
    const openingHours = request.openingHours ?? [];

    if (openingHours.length === 0) {
      return 'Not provided';
    }

    return openingHours
      .map((openingHour) =>
        `${this.dayLabels[openingHour.day] ?? openingHour.day} ${openingHour.open} - ${openingHour.close}`,
      )
      .join(', ');
  }

  private loadRequests() {
    this.adminService.getFacilityRequests().subscribe({
      next: (response) => {
        this.requests = response.data.requests;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load facility requests.';
        this.isLoading = false;
      },
    });
  }

  private processRequest(request: FacilityRequest, action: 'approve' | 'reject') {
    this.successMessage = '';
    this.errorMessage = '';
    this.processingIds.add(request.id);

    const requestCall = action === 'approve'
      ? this.adminService.approveFacilityRequest(request.id)
      : this.adminService.rejectFacilityRequest(request.id);

    requestCall.subscribe({
      next: () => {
        this.requests = this.requests.filter((currentRequest) => !(currentRequest.id === request.id));
        this.processingIds.delete(request.id);
        this.successMessage = action === 'approve'
          ? 'Facility request approved.'
          : 'Facility request rejected.';
      },
      error: (error) => {
        this.processingIds.delete(request.id);
        this.errorMessage = error.error?.message ?? `Unable to ${action} facility request.`;
      },
    });
  }
}
