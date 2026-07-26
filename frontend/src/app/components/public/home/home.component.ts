import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { HomeFacility, HomePromotion } from '../../../core/models/public.model';
import { PublicService } from '../../../core/services/public.service';
import { buildUploadImageUrl } from '../../../core/utils/image.util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly publicService = inject(PublicService);

  isLoading = true;
  errorMessage = '';
  activeFacilitiesCount = 0;
  topFacilities: HomeFacility[] = [];
  promotions: HomePromotion[] = [];

  constructor() {
    this.loadHomeData();
  }

  getImageUrl(imagePath: string | null) {
    return buildUploadImageUrl(imagePath);
  }

  private loadHomeData() {
    this.publicService.getHome().subscribe({
      next: (response) => {
        this.activeFacilitiesCount = response.data.activeFacilitiesCount;
        this.topFacilities = response.data.topFacilities;
        this.promotions = response.data.promotions;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Nije moguće učitati početnu stranicu.';
        this.isLoading = false;
      },
    });
  }
}
