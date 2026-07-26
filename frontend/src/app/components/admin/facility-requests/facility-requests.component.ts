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
    0: 'Ned',
    1: 'Pon',
    2: 'Uto',
    3: 'Sre',
    4: 'Čet',
    5: 'Pet',
    6: 'Sub',
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
    if (!window.confirm(`Odobriti zahtev za objekat ${request.name}?`)) {
      return;
    }

    this.processRequest(request, 'approve');
  }

  reject(request: FacilityRequest) {
    if (!window.confirm(`Odbiti zahtev za objekat ${request.name}?`)) {
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
      return 'Nije uneto';
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
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati zahteve za objekte.';
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
          ? 'Zahtev za objekat je odobren.'
          : 'Zahtev za objekat je odbijen.';
      },
      error: (error) => {
        this.processingIds.delete(request.id);
        this.errorMessage =
          error.error?.message ??
          (action === 'approve'
            ? 'Nije moguće odobriti zahtev za objekat.'
            : 'Nije moguće odbiti zahtev za objekat.');
      },
    });
  }
}
