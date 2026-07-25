import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { AdListItem } from '../../../core/models/ad.model';
import type { Sport } from '../../../core/models/sport.model';
import { AdService } from '../../../core/services/ad.service';
import { PublicService } from '../../../core/services/public.service';

@Component({
  selector: 'app-ad-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './ad-list.component.html',
  styleUrl: './ad-list.component.css',
})
export class AdListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adService = inject(AdService);
  private readonly publicService = inject(PublicService);

  readonly filterForm = this.formBuilder.nonNullable.group({
    sportId: [''],
    city: [''],
    date: [''],
  });

  sports: Sport[] = [];
  cities: string[] = [];
  ads: AdListItem[] = [];

  isLoading = true;
  isFiltering = false;
  errorMessage = '';
  actionMessage = '';

  applyingIds = new Set<string>();
  closingIds = new Set<string>();

  constructor() {
    this.loadPageData();
  }

  applyFilters() {
    this.fetchAds(true);
  }

  resetFilters() {
    this.filterForm.reset({
      sportId: '',
      city: '',
      date: '',
    });

    this.fetchAds(true);
  }

  applyToAd(ad: AdListItem) {
    if (ad.isOwner || ad.hasRequested || this.isApplying(ad.id)) {
      return;
    }

    this.actionMessage = '';
    this.errorMessage = '';
    this.applyingIds.add(ad.id);

    this.adService.applyToAd(ad.id).subscribe({
      next: () => {
        this.ads = this.ads.map((currentAd) =>
          currentAd.id === ad.id
            ? { ...currentAd, hasRequested: true }
            : currentAd,
        );
        this.applyingIds.delete(ad.id);
        this.actionMessage = 'Request sent successfully.';
      },
      error: (error) => {
        this.applyingIds.delete(ad.id);
        this.errorMessage = error.error?.message ?? 'Unable to send apply request.';
      },
    });
  }

  closeAd(ad: AdListItem) {
    if (!ad.isOwner || !(ad.status === 'active') || this.isClosing(ad.id)) {
      return;
    }

    this.actionMessage = '';
    this.errorMessage = '';
    this.closingIds.add(ad.id);

    this.adService.closeAd(ad.id).subscribe({
      next: () => {
        this.ads = this.ads.filter((currentAd) => !(currentAd.id === ad.id));
        this.closingIds.delete(ad.id);
        this.actionMessage = 'Ad closed successfully.';
      },
      error: (error) => {
        this.closingIds.delete(ad.id);
        this.errorMessage = error.error?.message ?? 'Unable to close ad.';
      },
    });
  }

  isApplying(adId: string) {
    return this.applyingIds.has(adId);
  }

  isClosing(adId: string) {
    return this.closingIds.has(adId);
  }

  trackByAdId(_: number, ad: AdListItem) {
    return ad.id;
  }

  private loadPageData() {
    forkJoin({
      sportsResponse: this.publicService.getSports(),
      citiesResponse: this.publicService.getCities(),
    }).subscribe({
      next: ({ sportsResponse, citiesResponse }) => {
        this.sports = sportsResponse.data.sports;
        this.cities = citiesResponse.data.cities;
        this.fetchAds(false);
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load ad filters.';
        this.isLoading = false;
      },
    });
  }

  private fetchAds(fromFilters: boolean) {
    this.errorMessage = '';
    this.actionMessage = '';

    if (fromFilters) {
      this.isFiltering = true;
    } else {
      this.isLoading = true;
    }

    const formValue = this.filterForm.getRawValue();

    this.adService.getAds({
      sportId: formValue.sportId || undefined,
      city: formValue.city || undefined,
      date: formValue.date || undefined,
    }).subscribe({
      next: (response) => {
        this.ads = response.data.ads;
        this.isLoading = false;
        this.isFiltering = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message ?? 'Unable to load ads.';
        this.isLoading = false;
        this.isFiltering = false;
      },
    });
  }
}
