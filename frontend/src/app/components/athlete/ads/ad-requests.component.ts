import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { AdDetails, ApplyRequestItem } from '../../../core/models/ad.model';
import { AdService } from '../../../core/services/ad.service';

@Component({
  selector: 'app-ad-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ad-requests.component.html',
  styleUrl: './ad-requests.component.css',
})
export class AdRequestsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adService = inject(AdService);

  ad: AdDetails | null = null;
  requests: ApplyRequestItem[] = [];

  isLoading = true;
  errorMessage = '';
  actionMessage = '';
  processingIds = new Set<string>();

  constructor() {
    this.loadRequests();
  }

  approveRequest(request: ApplyRequestItem) {
    if (!(request.status === 'pending') || this.isProcessing(request.id) || this.isCompleted) {
      return;
    }

    this.actionMessage = '';
    this.errorMessage = '';
    this.processingIds.add(request.id);

    this.adService.approveRequest(request.id).subscribe({
      next: () => {
        this.requests = this.requests.map((currentRequest) =>
          currentRequest.id === request.id
            ? { ...currentRequest, status: 'accepted' }
            : currentRequest,
        );

        if (this.ad) {
          const updatedAcceptedPlayers = this.ad.acceptedPlayers + 1;
          this.ad = {
            ...this.ad,
            acceptedPlayers: updatedAcceptedPlayers,
            status: updatedAcceptedPlayers >= this.ad.missingPlayers
              ? 'completed'
              : this.ad.status,
          };
        }

        this.processingIds.delete(request.id);
        this.actionMessage = this.isCompleted
          ? 'Request approved. Team is now full.'
          : 'Request approved successfully.';
      },
      error: (error) => {
        this.processingIds.delete(request.id);
        this.errorMessage = error.error?.message ?? 'Unable to approve request.';
      },
    });
  }

  rejectRequest(request: ApplyRequestItem) {
    if (!(request.status === 'pending') || this.isProcessing(request.id) || this.isCompleted) {
      return;
    }

    this.actionMessage = '';
    this.errorMessage = '';
    this.processingIds.add(request.id);

    this.adService.rejectRequest(request.id).subscribe({
      next: () => {
        this.requests = this.requests.map((currentRequest) =>
          currentRequest.id === request.id
            ? { ...currentRequest, status: 'rejected' }
            : currentRequest,
        );
        this.processingIds.delete(request.id);
        this.actionMessage = 'Request rejected successfully.';
      },
      error: (error) => {
        this.processingIds.delete(request.id);
        this.errorMessage = error.error?.message ?? 'Unable to reject request.';
      },
    });
  }

  isProcessing(requestId: string) {
    return this.processingIds.has(requestId);
  }

  get isCompleted() {
    return this.ad?.status === 'completed';
  }

  private loadRequests() {
    const adId = this.route.snapshot.paramMap.get('id') ?? '';

    this.adService.getAdRequests(adId).subscribe({
      next: (response) => {
        this.ad = response.data.ad;
        this.requests = response.data.requests;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load ad requests.';
        this.isLoading = false;
      },
    });
  }
}
