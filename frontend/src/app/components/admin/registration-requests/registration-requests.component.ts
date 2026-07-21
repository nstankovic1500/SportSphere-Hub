import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import type { RegistrationRequest } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  imports: [CommonModule, DatePipe],
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

  approve(request: RegistrationRequest) {
    if (!window.confirm(`Approve registration for ${request.username}?`)) {
      return;
    }

    this.processRequest(request, 'approve');
  }

  reject(request: RegistrationRequest) {
    if (!window.confirm(`Reject registration for ${request.username}?`)) {
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
          error.error?.message ?? 'Unable to load registration requests.';
        this.isLoading = false;
      },
    });
  }

  private processRequest(
    request: RegistrationRequest,
    action: 'approve' | 'reject',
  ) {
    if (!request.id) {
      this.errorMessage = 'Registration request id is missing.';
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
          (currentRequest) => currentRequest.id !== request.id,
        );
        this.processingRequestIds.delete(request.id);
        this.successMessage =
          action === 'approve'
            ? 'Registration request approved.'
            : 'Registration request rejected.';
      },
      error: (error) => {
        this.processingRequestIds.delete(request.id);
        this.errorMessage =
          error.error?.message ?? `Unable to ${action} registration request.`;
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
