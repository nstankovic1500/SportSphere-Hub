import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { RegistrationRequest } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './registration-requests.component.html',
  styleUrl: './registration-requests.component.css',
})
export class RegistrationRequestsComponent {
  private readonly adminService = inject(AdminService);

  requests: RegistrationRequest[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  processingRequestIds = new Set<string>();

  constructor() {
    this.loadRequests();
  }

  isProcessing(request: RegistrationRequest) {
    return this.processingRequestIds.has(request.id);
  }

  getTrackKey(request: RegistrationRequest) {
    return request.id || request._id || request.email;
  }

  getRoleLabel(role: RegistrationRequest['role']) {
    return role === 'athlete' ? 'sportista' : role === 'employee' ? 'zaposleni' : role;
  }

  approve(request: RegistrationRequest) {
    if (!window.confirm(`Odobriti registraciju za korisnika ${request.username}?`)) {
      return;
    }

    this.processRequest(request, 'approve');
  }

  reject(request: RegistrationRequest) {
    if (!window.confirm(`Odbiti registraciju za korisnika ${request.username}?`)) {
      return;
    }

    this.processRequest(request, 'reject');
  }

  private loadRequests() {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getRegistrationRequests().subscribe({
      next: (response) => {
        this.requests = response.data.requests.map((request) =>
          this.normalizeRequest(request),
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ?? 'Nije moguće učitati zahteve za registraciju.';
        this.isLoading = false;
      },
    });
  }

  private processRequest(
    request: RegistrationRequest,
    action: 'approve' | 'reject',
  ) {
    if (!request.id) {
      this.errorMessage = 'Nedostaje identifikator zahteva za registraciju.';
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.processingRequestIds.add(request.id);

    const requestCall =
      action === 'approve'
        ? this.adminService.approveRegistration(request.id)
        : this.adminService.rejectRegistration(request.id);

    requestCall.subscribe({
      next: () => {
        this.requests = this.requests.filter(
          (currentRequest) => !(currentRequest.id === request.id),
        );
        this.processingRequestIds.delete(request.id);
        this.successMessage =
          action === 'approve'
            ? 'Zahtev za registraciju je odobren.'
            : 'Zahtev za registraciju je odbijen.';
      },
      error: (error) => {
        this.processingRequestIds.delete(request.id);
        this.errorMessage =
          error.error?.message ??
          (action === 'approve'
            ? 'Nije moguće odobriti zahtev za registraciju.'
            : 'Nije moguće odbiti zahtev za registraciju.');
      },
    });
  }

  private normalizeRequest(
    request: RegistrationRequest,
  ): RegistrationRequest {
    return {
      ...request,
      id: request.id || request._id || '',
    };
  }
}
