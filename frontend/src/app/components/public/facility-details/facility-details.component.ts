import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { FacilityDetails } from '../../../core/models/public.model';
import { AuthService } from '../../../core/services/auth.service';
import { PublicService } from '../../../core/services/public.service';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-facility-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './facility-details.component.html',
  styleUrl: './facility-details.component.css',
})
export class FacilityDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly authService = inject(AuthService);

  isLoading = true;
  errorMessage = '';
  facility: FacilityDetails | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadFacility(id);
  }

  getDayName(day: number) {
    return dayNames[day] ?? `Day ${day}`;
  }

  get canReserve() {
    const user = this.authService.getCurrentUser();
    return user?.role === 'athlete';
  }

  private loadFacility(id: string) {
    this.publicService.getFacilityDetails(id).subscribe({
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
}
